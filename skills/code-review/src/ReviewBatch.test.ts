import { NodeServices } from "@effect/platform-node"
import * as SqliteClient from "@effect/sql-sqlite-node/SqliteClient"
import { assert, layer } from "@effect/vitest"
import * as Effect from "effect/Effect"
import * as FileSystem from "effect/FileSystem"
import * as Layer from "effect/Layer"
import * as SqlClient from "effect/unstable/sql/SqlClient"

import { checkedTrimmedText } from "../../../packages/effect-cli/CheckedProcess.ts"
import { applyReviewBatch, type Batch } from "./ReviewBatch.ts"
import { authorizeScopeBudget, getScopeBudget, initialize, recordFindingMatch, reviewProgress, startScopeBudget } from "./ReviewFindings.ts"
import { measureScopeDiff } from "./ReviewScope.ts"

const fixture = Effect.fn("ReviewBatch.fixture")(function*(historical = false) {
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
const start = { requestId: "native-1-start", expectedRevision: 0, action: { kind: "review-start", phase: "native", evidence: "invocation-1" } } satisfies typeof Batch.Type
const rejected = { decisionId: "D1", status: "rejected", source: "fixture", fingerprint: "unsupported fixture", summary: "Unsupported candidate", findingKind: "maintenance", fixScope: "local", handling: "reject", rejectionGate: "reality", decision: "No duplicate exists" }
const accepted = { decisionId: "D2", status: "open", source: "fixture", fingerprint: "duplicate owner", summary: "Duplicated policy", findingKind: "maintenance", fixScope: "local", handling: "fix", maintenanceEvidence: "Same policy is implemented by two owners", presentCost: "Both owners require changes for the same policy update", rootCause: "Duplicated authority", recommendedFix: "Use the existing owner", interventionJustification: "Remove the second implementation with preserved behavior" }

layer(Layer.mergeAll(NodeServices.layer, SqliteClient.layer({ filename: ":memory:" })))("review lifecycle batches", test => {
  test.effect("preserves a denied start's scope block so authorization can resume the same request", () => Effect.gen(function*() {
    const { run, git, fs } = yield* fixture()
    yield* fs.writeFileString(`${run.repoPath}/sample.txt`, "changed\nextra\nanother\n")
    yield* git(["-c", "core.hooksPath=/dev/null", "commit", "-am", "scope expansion"])
    const expanded = { ...run, head: yield* git(["rev-parse", "HEAD"]) }
    const denied = yield* applyReviewBatch(expanded, start).pipe(Effect.flip)
    assert.strictEqual(denied._tag, "ReviewLimitsBlocked")
    const blocked = yield* getScopeBudget(expanded)
    assert.strictEqual(blocked.status, "blocked")
    assert.strictEqual(blocked.growthLines, 2)
    const sql = yield* SqlClient.SqlClient
    assert.strictEqual((yield* sql`select * from review_progress_events where run_id = ${run.runId}`).length, 0)
    assert.strictEqual((yield* sql`select * from review_batch_receipts where run_id = ${run.runId}`).length, 0)
    yield* authorizeScopeBudget(expanded, { scopeSummary: "Approved fixture expansion", authorization: "Fixture owner authorizes this scope" })
    const resumed = yield* applyReviewBatch(expanded, start)
    assert.strictEqual(resumed.revision, 1)
    assert.strictEqual((yield* applyReviewBatch(expanded, start)).replayed, true)
    assert.strictEqual((yield* sql`select * from review_progress_events where run_id = ${run.runId}`).length, 1)
  }).pipe(Effect.scoped), { timeout: 30000 })

  test.effect("reviews a pinned historical commit while the checkout stays on a later commit", () => Effect.gen(function*() {
    const { run, scope, git } = yield* fixture(true)
    assert.strictEqual(scope.pinnedHeadOid, run.head)
    yield* applyReviewBatch(run, start)
    yield* applyReviewBatch(run, { requestId: "historical-result", expectedRevision: 1, action: { kind: "review-result", phase: "native", evidence: "historical assessment", outcome: "clean", findings: [] } })
    assert.strictEqual((yield* reviewProgress(run))?.head, run.head)
    assert.strictEqual((yield* reviewProgress(run))?.outcome, "clean")
    assert.notStrictEqual(yield* git(["rev-parse", "HEAD"]), run.head)
  }).pipe(Effect.scoped), { timeout: 30000 })

  test.effect("rolls back a partially invalid result and replays a completed request without duplicate writes", () => Effect.gen(function*() {
    const { run, scope } = yield* fixture()
    const wrongRun = yield* applyReviewBatch({ ...run, runId: "previous-run" }, start).pipe(Effect.flip)
    assert.include(wrongRun.message, "run ID")
    yield* applyReviewBatch(run, start)
    const result = { requestId: "native-1-result", expectedRevision: 1, action: { kind: "review-result", phase: "native", evidence: "report-1", outcome: "clean", findings: [rejected] } } satisfies typeof Batch.Type
    yield* applyReviewBatch(run, { ...result, action: { ...result.action, findings: [rejected, { ...accepted, likelihood: "invalid" }] } }).pipe(Effect.flip)
    const sql = yield* SqlClient.SqlClient
    assert.strictEqual((yield* sql`select id from issues where run_id = ${scope.runId}`).length, 0)
    assert.strictEqual((yield* reviewProgress(run))?.revision, 1)
    const receipt = yield* applyReviewBatch(run, result)
    assert.strictEqual(receipt.revision, 2)
    assert.strictEqual((yield* applyReviewBatch(run, result)).replayed, true)
    assert.strictEqual((yield* sql`select id from issues where run_id = ${scope.runId}`).length, 1)
    const conflict = yield* applyReviewBatch(run, { ...result, action: { ...result.action, evidence: "changed" } }).pipe(Effect.flip)
    assert.include(conflict.message, "immutable")
  }).pipe(Effect.scoped), { timeout: 30000 })

  test.effect("prevents duplicate launches and records repair events before the finding becomes terminal", () => Effect.gen(function*() {
    const { run, scope } = yield* fixture()
    yield* applyReviewBatch(run, start)
    const duplicate = yield* applyReviewBatch(run, { ...start, requestId: "other-launch", expectedRevision: 1 }).pipe(Effect.flip)
    assert.include(duplicate.message, "already running")
    yield* applyReviewBatch(run, { requestId: "result", expectedRevision: 1, action: { kind: "review-result", phase: "native", evidence: "report", outcome: "findings", findings: [accepted] } })
    const repair = { requestId: "repair-1", expectedRevision: 2, action: { kind: "repair-result", phase: "native", repairs: [{ finding: { ...accepted, status: "fixed" }, attempt: "D2-1", evidence: "patch and successful behavioral check", unsuccessful: false }], checks: [{ command: "fixture-check", result: "passed", reason: "Original and repaired behavior observed" }] } } satisfies typeof Batch.Type
    yield* applyReviewBatch(run, repair)
    assert.strictEqual((yield* applyReviewBatch(run, repair)).replayed, true)
    const sql = yield* SqlClient.SqlClient
    assert.deepStrictEqual(yield* sql`select status from issues where run_id = ${scope.runId}`, [{ status: "fixed" }])
    assert.strictEqual((yield* sql`select id from commands where run_id = ${scope.runId}`).length, 1)
    assert.strictEqual((yield* reviewProgress(run))?.outcome, "repair-applied")
    const stale = yield* applyReviewBatch({ ...run, head: "wrong-head" }, { requestId: "late", expectedRevision: 3, action: { kind: "checks", checks: [{ command: "check", result: "pass", reason: "stale" }] } }).pipe(Effect.flip)
    assert.include(stale.message, "head changed")
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

  test.effect("collects independent discovery while native findings remain open without claiming a clean run", () => Effect.gen(function*() {
    const { run, scope } = yield* fixture()
    yield* applyReviewBatch(run, start)
    yield* applyReviewBatch(run, { requestId: "native-result", expectedRevision: 1, action: { kind: "review-result", phase: "native", evidence: "native inventory", outcome: "findings", findings: [accepted] } })
    yield* applyReviewBatch(run, { requestId: "cold-start", expectedRevision: 2, action: { kind: "review-start", phase: "cold", evidence: "independent inventory at original head" } })
    const premature = yield* applyReviewBatch(run, { requestId: "cold-clean", expectedRevision: 3, action: { kind: "review-result", phase: "cold", evidence: "no additional candidates", outcome: "clean", findings: [] } }).pipe(Effect.flip)
    assert.include(premature.message, "active findings")
    yield* applyReviewBatch(run, { requestId: "cold-result", expectedRevision: 3, action: { kind: "review-result", phase: "cold", evidence: "independent inventory complete; native repair still pending", outcome: "findings", findings: [] } })
    const sql = yield* SqlClient.SqlClient
    assert.deepStrictEqual(yield* sql`select decision_id, status from issues where run_id = ${scope.runId}`, [{ decision_id: "D2", status: "open" }])
    assert.strictEqual((yield* reviewProgress(run))?.revision, 4)
    assert.strictEqual((yield* reviewProgress(run))?.head, run.head)
  }).pipe(Effect.scoped), { timeout: 30000 })

  test.effect("appends repeated evidence to a rejected finding without changing its decision or reopening it", () => Effect.gen(function*() {
    const { run, scope } = yield* fixture()
    yield* applyReviewBatch(run, start)
    yield* applyReviewBatch(run, { requestId: "native-rejected", expectedRevision: 1, action: { kind: "review-result", phase: "native", evidence: "initial rejection evidence", outcome: "clean", findings: [rejected] } })
    const sql = yield* SqlClient.SqlClient
    const before = yield* sql`select status, decision, disposition, owner_resolution from issues where run_id = ${scope.runId}`
    const match = { matchOf: rejected.decisionId, source: "cold-1", evidence: "independent report", matchNote: `Same cause and unchanged counterevidence at ${run.head}` }
    yield* recordFindingMatch(run, match)
    yield* recordFindingMatch(run, match)
    assert.deepStrictEqual(yield* sql`select status, decision, disposition, owner_resolution from issues where run_id = ${scope.runId}`, before)
    assert.strictEqual((yield* sql`select id from review_finding_matches`).length, 1)
    const conflict = yield* recordFindingMatch(run, { ...match, matchNote: "replace prior evidence" }).pipe(Effect.flip)
    assert.include(conflict.message, "immutable")
    yield* sql`update review_runs set status = 'complete' where id = ${scope.runId}`
    const terminal = yield* recordFindingMatch(run, { ...match, source: "late" }).pipe(Effect.flip)
    assert.include(terminal.message, "active run")
  }).pipe(Effect.scoped), { timeout: 30000 })

  test.effect("saves an interrupted old-head result and permits a new invocation without crediting stale clean evidence", () => Effect.gen(function*() {
    const { run, git, fs } = yield* fixture()
    yield* applyReviewBatch(run, start)
    yield* fs.writeFileString(`${run.repoPath}/sample.txt`, "repaired\n")
    yield* git(["-c", "core.hooksPath=/dev/null", "commit", "-am", "repair"])
    const result = { requestId: "interrupted", expectedRevision: 1, action: { kind: "review-result", phase: "native", evidence: "target changed during invocation", outcome: "clean", findings: [] } } satisfies typeof Batch.Type
    const stale = yield* applyReviewBatch(run, result).pipe(Effect.flip)
    assert.include(stale.message, "head changed")
    yield* applyReviewBatch(run, { ...result, action: { ...result.action, outcome: "blocked" } })
    const newRun = { ...run, head: yield* git(["rev-parse", "HEAD"]) }
    const next = yield* applyReviewBatch(newRun, { ...start, requestId: "native-2-start", expectedRevision: 2 })
    assert.strictEqual(next.revision, 3)
    assert.strictEqual((yield* reviewProgress(newRun))?.head, newRun.head)
  }).pipe(Effect.scoped), { timeout: 30000 })
})
