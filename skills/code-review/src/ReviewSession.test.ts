import { NodeServices } from "@effect/platform-node"
import * as SqliteClient from "@effect/sql-sqlite-node/SqliteClient"
import { assert, layer } from "@effect/vitest"
import * as Effect from "effect/Effect"
import * as FileSystem from "effect/FileSystem"
import * as Layer from "effect/Layer"
import * as SqlClient from "effect/unstable/sql/SqlClient"

import { checkedTrimmedText } from "../../../packages/effect-cli/CheckedProcess.ts"
import { authorizeScopeBudget, type FindingInput, getReviewFileCoverage, getScopeBudget, initialize, recordFinding, recordFindingMatch, recordReviewedFiles, reviewProgress, startScopeBudget } from "./ReviewFindings.ts"
import { measureScopeDiff } from "./ReviewScope.ts"
import { claimNativeLaunch, finishReview, getReview, reviewRun, startReview, withOpenReview } from "./ReviewSession.ts"

const fixture = Effect.fn("ReviewSession.fixture")(function*(historical = false) {
  yield* initialize()
  const fs = yield* FileSystem.FileSystem
  const repoPath = yield* fs.makeTempDirectoryScoped({ prefix: "review-batch." })
  const git = (args: ReadonlyArray<string>) => checkedTrimmedText("git", args, { cwd: repoPath })
  yield* git(["init", "-b", "main"])
  yield* git(["config", "user.email", "fixture@example.invalid"])
  yield* git(["config", "user.name", "Fixture"])
  yield* fs.writeFileString(`${repoPath}/sample.txt`, "base\n")
  yield* git(["add", "sample.txt"])
  yield* git(["-c", "core.hooksPath=/dev/null", "commit", "-m", "base"])
  yield* git(["switch", "-c", "fixture"])
  yield* fs.writeFileString(`${repoPath}/sample.txt`, "changed\n")
  yield* git(["-c", "core.hooksPath=/dev/null", "commit", "-am", "change"])
  const run = { repo: "fixture", repoPath, branch: "fixture", target: "fixture", base: "main", head: yield* git(["rev-parse", "HEAD"]), status: "active", decisionLog: "" }
  if (historical) {
    yield* fs.writeFileString(`${repoPath}/sample.txt`, "later change\n")
    yield* git(["-c", "core.hooksPath=/dev/null", "commit", "-am", "later change"])
  }
  const objectsBeforeScope = yield* git(["count-objects", "-v"])
  const scope = yield* startScopeBudget(run, { scopeSummary: "Local fixture repairs", limits: { nativeCleanTarget: 1, requiredPhases: ["native", "cold"], requireCurrentHead: true } })
  return { run: { ...run, runId: scope.runId }, scope, git, fs, objectsBeforeScope }
})
const candidate = (overrides: Partial<FindingInput> = {}): FindingInput => ({
  decisionId: "D1", status: "rejected", source: "fixture", fingerprint: "unsupported fixture", summary: "Unsupported candidate", findingKind: "maintenance", fixScope: "local", handling: "reject", rejectionGate: "reality", decision: "No duplicate exists",
  area: "", material: false, userImpact: "", text: "", productionPath: "", reachabilityEvidence: "", likelihood: "", impact: "", actualConsequence: "", maintenanceEvidence: "", presentCost: "", contractEvidence: "", rootCause: "", recommendedFix: "", interventionJustification: "", ownerResolution: "", ...overrides
})
const accepted = candidate({ decisionId: "D2", status: "open", fingerprint: "duplicate owner", summary: "Duplicated policy", handling: "fix", rejectionGate: "", decision: "", maintenanceEvidence: "Same policy has two owners", presentCost: "Both owners require changes for one update", rootCause: "Duplicated authority", recommendedFix: "Use the existing owner", interventionJustification: "Remove the duplicate while preserving behavior" })

layer(Layer.mergeAll(NodeServices.layer, SqliteClient.layer({ filename: ":memory:" })))("managed review sessions", test => {
  test.effect("keeps the scope block when start is denied and permits an authorized retry", () => Effect.gen(function*() {
    const { run, git, fs } = yield* fixture()
    yield* fs.writeFileString(`${run.repoPath}/sample.txt`, "changed\nextra\nanother\n")
    yield* git(["-c", "core.hooksPath=/dev/null", "commit", "-am", "scope expansion"])
    const denied = yield* startReview(run, "native", "invocation").pipe(Effect.flip)
    assert.strictEqual(denied._tag, "ReviewLimitsBlocked")
    assert.strictEqual((yield* getScopeBudget(run)).status, "blocked")
    assert.strictEqual((yield* getScopeBudget(run)).growthLines, 2)
    const sql = yield* SqlClient.SqlClient
    assert.lengthOf(yield* sql`select * from review_invocations where run_id = ${run.runId}`, 0)
    assert.lengthOf(yield* sql`select * from review_progress_events where run_id = ${run.runId}`, 0)
    yield* authorizeScopeBudget(run, { scopeSummary: "Approved fixture expansion", authorization: "Fixture owner approves" })
    const review = yield* startReview(run, "native", "invocation")
    assert.strictEqual((yield* startReview(run, "native", "invocation")).reviewId, review.reviewId)
    assert.strictEqual((yield* reviewProgress(run))?.revision, 1)
  }).pipe(Effect.scoped), { timeout: 30000 })

  test.effect("pins a historical review independently of checkout HEAD", () => Effect.gen(function*() {
    const { run, git } = yield* fixture(true)
    const review = yield* startReview(run, "native", "historical review")
    assert.strictEqual(review.head, run.head)
    yield* finishReview(review.reviewId, "clean", "historical result")
    assert.strictEqual((yield* reviewProgress(run))?.head, run.head)
    assert.notStrictEqual(yield* git(["rev-parse", "HEAD"]), run.head)
  }).pipe(Effect.scoped), { timeout: 30000 })

  test.effect("retains successful records after a later record fails without finishing or permitting repairs", () => Effect.gen(function*() {
    const { run } = yield* fixture()
    const review = yield* startReview(run, "native", "whole report")
    yield* withOpenReview(review.reviewId, current => recordFinding(reviewRun(current), candidate(), current.reviewId))
    yield* withOpenReview(review.reviewId, current => recordFinding(reviewRun(current), { ...accepted, likelihood: "invalid" }, current.reviewId)).pipe(Effect.flip)
    const sql = yield* SqlClient.SqlClient
    assert.deepStrictEqual(yield* sql`select decision_id from issues where run_id = ${run.runId}`, [{ decision_id: "D1" }])
    assert.strictEqual((yield* getReview(review.reviewId)).status, "open")
    yield* withOpenReview(review.reviewId, current => recordFinding(reviewRun(current), accepted, current.reviewId))
    const earlyFix = yield* recordFinding(run, { ...accepted, status: "fixed" }).pipe(Effect.flip)
    assert.include(earlyFix.message, "Finish the complete review")
    yield* reviewProgress(run, { expectedRevision: 1, phase: "native", head: run.head, outcome: "repair-applied", evidence: "premature patch", findingId: "D2", repairAttempt: "attempt" }).pipe(Effect.flip)
    assert.strictEqual((yield* reviewProgress(run))?.revision, 1)
    yield* finishReview(review.reviewId, "clean", "premature clean").pipe(Effect.flip)
    assert.strictEqual((yield* getReview(review.reviewId)).status, "open")
    yield* finishReview(review.reviewId, "findings", "complete report")
    yield* finishReview(review.reviewId, "findings", "complete report")
    assert.strictEqual((yield* reviewProgress(run))?.revision, 2)
    yield* recordFinding(run, { ...accepted, status: "fixed" })
    assert.deepStrictEqual(yield* sql`select status from issues where run_id = ${run.runId} and decision_id = 'D2'`, [{ status: "fixed" }])
    yield* withOpenReview(review.reviewId, current => recordFinding(reviewRun(current), candidate({ decisionId: "late" }), current.reviewId)).pipe(Effect.flip)
    assert.lengthOf(yield* sql`select id from issues where run_id = ${run.runId}`, 2)
  }).pipe(Effect.scoped), { timeout: 30000 })

  test.effect("credits coverage only after completion and appends repeat evidence without reopening a rejection", () => Effect.gen(function*() {
    const { run } = yield* fixture()
    const native = yield* startReview(run, "native", "native")
    yield* recordFinding(run, candidate(), native.reviewId)
    yield* finishReview(native.reviewId, "clean", "native result")
    const cold = yield* startReview(run, "cold", "cold")
    const files = yield* getReviewFileCoverage(run)
    yield* withOpenReview(cold.reviewId, current => recordFindingMatch(reviewRun(current), { matchOf: "D1", source: "cold", evidence: "cold report", matchNote: `Same cause and counterevidence at ${run.head}` }, current.reviewId))
    yield* withOpenReview(cold.reviewId, current => recordReviewedFiles(reviewRun(current), { reviewId: cold.reviewId, reviewer: "cold", files }))
    assert.strictEqual((yield* getReviewFileCoverage(run))[0]?.reviews, 0)
    yield* finishReview(cold.reviewId, "clean", "complete cold report")
    assert.strictEqual((yield* getReviewFileCoverage(run))[0]?.reviews, 1)
    const sql = yield* SqlClient.SqlClient
    assert.deepStrictEqual(yield* sql`select status from issues where run_id = ${run.runId}`, [{ status: "rejected" }])
    assert.lengthOf(yield* sql`select m.* from review_finding_matches m join issues i on i.id = m.issue_id where i.run_id = ${run.runId}`, 1)
  }).pipe(Effect.scoped), { timeout: 30000 })

  test.effect("claims one native launch across concurrent requests and closes stale results as blocked", () => Effect.gen(function*() {
    const { run, git, fs } = yield* fixture()
    const starts = yield* Effect.all([startReview(run, "native", "invocation"), startReview(run, "native", "invocation")], { concurrency: "unbounded" })
    assert.strictEqual(starts[0].reviewId, starts[1].reviewId)
    const id = starts[0].reviewId
    const launches = yield* Effect.all([claimNativeLaunch(id), claimNativeLaunch(id)], { concurrency: "unbounded" })
    assert.deepStrictEqual([...launches].sort(), [false, true])
    const files = yield* getReviewFileCoverage(run)
    yield* withOpenReview(id, current => recordReviewedFiles(reviewRun(current), { reviewId: id, reviewer: "fixture", files }))
    yield* fs.writeFileString(`${run.repoPath}/sample.txt`, "repaired\n")
    yield* git(["-c", "core.hooksPath=/dev/null", "commit", "-am", "repair"])
    yield* finishReview(id, "clean", "stale result").pipe(Effect.flip)
    yield* finishReview(id, "blocked", "target changed")
    assert.strictEqual((yield* getReviewFileCoverage(run))[0]?.reviews, 0)
    const next = yield* startReview(run, "native", "new invocation")
    assert.notStrictEqual(next.reviewId, id)
    yield* withOpenReview(id, current => recordFinding(reviewRun(current), candidate(), current.reviewId)).pipe(Effect.flip)
    const sql = yield* SqlClient.SqlClient
    assert.lengthOf(yield* sql`select * from issues where run_id = ${run.runId}`, 0)
    assert.strictEqual((yield* getReview(next.reviewId)).head, yield* git(["rev-parse", "HEAD"]))
  }).pipe(Effect.scoped), { timeout: 30000 })

  test.effect("measures untracked changes without writing objects or the real index", () => Effect.gen(function*() {
    const { run, git, fs, objectsBeforeScope } = yield* fixture()
    assert.strictEqual(yield* git(["count-objects", "-v"]), objectsBeforeScope)
    const objectsBefore = yield* git(["count-objects", "-v"])
    const indexBefore = yield* fs.readFile(`${run.repoPath}/.git/index`)
    yield* fs.writeFileString(`${run.repoPath}/new.txt`, "new behavior\n")
    yield* measureScopeDiff(run.repoPath, "main")
    assert.strictEqual(yield* git(["count-objects", "-v"]), objectsBefore)
    assert.deepStrictEqual(yield* fs.readFile(`${run.repoPath}/.git/index`), indexBefore)
  }).pipe(Effect.scoped), { timeout: 30000 })
})
