import { NodeServices } from "@effect/platform-node"
import * as SqliteClient from "@effect/sql-sqlite-node/SqliteClient"
import { assert, layer } from "@effect/vitest"
import * as Effect from "effect/Effect"
import * as FileSystem from "effect/FileSystem"
import * as Layer from "effect/Layer"

import { checkedTrimmedText } from "../../../packages/effect-cli/CheckedProcess.ts"
import { assessCandidate, prepareCandidate } from "./ReviewCandidate.ts"
import { authorizeScopeBudget, checkScopeBudget, completeScopeBudget, type FindingInput, getScopeBudget, initialize, recordFinding, type ReviewRun, startScopeBudget } from "./ReviewFindings.ts"
import { readReviewLimits } from "./ReviewLimits.ts"
import { type ProgressEvent, recordProgress } from "./ReviewProgress.ts"
import { finishReview, startReview } from "./ReviewSession.ts"

const fixture = Effect.fn("ReviewCandidate.fixture")(function*(requiredPhases: ReadonlyArray<"native" | "cold"> = ["native", "cold"], cleanTarget = 1, requireCurrentHead = true) {
  yield* initialize()
  const fs = yield* FileSystem.FileSystem
  const repoPath = yield* fs.makeTempDirectoryScoped({ prefix: "review-candidate." })
  const git = (args: ReadonlyArray<string>) => checkedTrimmedText("git", args, { cwd: repoPath })
  yield* git(["init", "-b", "main"])
  yield* git(["config", "user.email", "fixture@example.invalid"])
  yield* git(["config", "user.name", "Fixture"])
  yield* fs.writeFileString(`${repoPath}/contract.ts`, "export const value = 1\n")
  yield* git(["add", "contract.ts"])
  yield* git(["-c", "core.hooksPath=/dev/null", "commit", "-m", "base"])
  yield* git(["switch", "-c", "feature"])
  yield* fs.writeFileString(`${repoPath}/feature.ts`, "import { value } from './contract.js'\nexport const feature = value + 1\n")
  yield* git(["add", "feature.ts"])
  yield* git(["-c", "core.hooksPath=/dev/null", "commit", "-m", "feature"])
  const run: ReviewRun = { repo: "fixture", repoPath, branch: "feature", target: "fixture", base: "main", head: "", status: "active", decisionLog: "" }
  const scope = yield* startScopeBudget(run, {
    scopeSummary: "Candidate evidence fixture",
    limits: { nativeCleanTarget: cleanTarget, coldCleanTarget: cleanTarget, requiredPhases, requireCurrentHead }
  })
  const savedRun = { ...run, runId: scope.runId }
  return { fs, git, run: savedRun }
})

const cleanPhase = Effect.fn("ReviewCandidate.cleanPhase")(function*(run: ReviewRun & { readonly runId: string }, phase: "native" | "cold") {
  const review = yield* startReview(run, phase, `${phase} fixture reviewer`)
  return yield* finishReview(review.reviewId, "clean", `${phase} fixture clean result`)
})

const rebaselineCurrentCandidate = Effect.fn("ReviewCandidate.rebaselineCurrentCandidate")(function*(run: ReviewRun & { readonly runId: string }) {
  yield* authorizeScopeBudget(run, {
    scopeSummary: "Assess the changed committed candidate",
    authorization: "Fixture owner authorized the changed candidate baseline"
  })
  return yield* getScopeBudget(run)
})

const contractFinding: FindingInput = {
  decisionId: "contract-result", status: "open", source: "focused cold review", fingerprint: "consumer assumes old contract value",
  summary: "Feature result changed after the upstream contract update", findingKind: "runtime", fixScope: "local", handling: "fix",
  rejectionGate: "", decision: "", area: "api-contract", material: false, userImpact: "Feature callers receive a different value",
  text: "", productionPath: "feature.ts", reachabilityEvidence: "feature imports contract.value at module load", likelihood: "certain",
  impact: "low", actualConsequence: "feature changes from 2 to 3", maintenanceEvidence: "", presentCost: "",
  contractEvidence: "the exported feature value is part of the fixture contract", rootCause: "upstream changed the imported constant",
  recommendedFix: "accept and verify the new result", interventionJustification: "record the intentional contract update before completing focused review",
  ownerResolution: ""
}

layer(Layer.mergeAll(NodeServices.layer, SqliteClient.layer({ filename: ":memory:" })))("candidate evidence reuse", test => {
  test.effect("reuses completed phase evidence for an equivalent amended candidate without relabelling it as fresh", () => Effect.gen(function*() {
    const { run, git } = yield* fixture()
    const native = yield* cleanPhase(run, "native")
    const cold = yield* cleanPhase(run, "cold")
    const oldHead = yield* git(["rev-parse", "HEAD"])
    yield* git(["-c", "core.hooksPath=/dev/null", "commit", "--amend", "-m", "equivalent feature commit"])
    const newHead = yield* git(["rev-parse", "HEAD"])
    assert.notStrictEqual(newHead, oldHead)
    const scope = yield* rebaselineCurrentCandidate(run)
    const prepared = yield* prepareCandidate(run, scope, run.runId)
    assert.strictEqual(prepared.source.tree, prepared.candidate.tree)
    assert.strictEqual(prepared.source.patchId, prepared.candidate.patchId)
    const assessed = yield* assessCandidate({
      candidateId: prepared.candidateId,
      decision: "reuse",
      affectedPhases: [],
      semanticImpactEvidence: "Only the commit message changed; candidate tree and exact branch patch are unchanged."
    })
    assert.strictEqual(assessed.status, "assessed")
    const limits = yield* readReviewLimits(run.runId, newHead)
    assert.deepStrictEqual(limits.incompletePhases, [])
    assert.deepStrictEqual(new Set(limits.candidateAssessment?.inheritedPhases), new Set(["native", "cold"]))
    assert.deepStrictEqual(new Set(limits.candidateAssessment?.sourceReviews.map(review => review.reviewId)), new Set([native.reviewId, cold.reviewId]))
  }).pipe(Effect.scoped), { timeout: 30_000 })

  test.effect("requires focused review when disjoint upstream work changes a shared contract", () => Effect.gen(function*() {
    const { run, fs, git } = yield* fixture()
    yield* cleanPhase(run, "native")
    yield* cleanPhase(run, "cold")
    const originalHead = yield* git(["rev-parse", "HEAD"])
    yield* git(["switch", "main"])
    yield* fs.writeFileString(`${run.repoPath}/contract.ts`, "export const value = 2\n")
    yield* git(["-c", "core.hooksPath=/dev/null", "commit", "-am", "change shared contract"])
    yield* git(["switch", "feature"])
    yield* git(["rebase", "main"])
    const scope = yield* rebaselineCurrentCandidate(run)
    const prepared = yield* prepareCandidate(run, scope)
    assert.strictEqual(prepared.source.patchId, prepared.candidate.patchId)
    yield* assessCandidate({
      candidateId: prepared.candidateId,
      decision: "focused",
      affectedPhases: ["cold"],
      semanticImpactEvidence: "Upstream changed contract.ts while the branch consumes that exported value; cold review must inspect the runtime interaction despite an unchanged branch patch."
    })
    const before = yield* readReviewLimits(run.runId, prepared.candidate.head)
    assert.deepStrictEqual(before.incompletePhases, ["cold"])
    assert.deepStrictEqual(before.candidateAssessment?.inheritedPhases, ["native"])
    const findingPass = yield* startReview(run, "cold", "Focused contract review")
    yield* recordFinding(run, contractFinding, findingPass.reviewId)
    yield* finishReview(findingPass.reviewId, "findings", "Contract interaction needs repair")
    const afterFinding = yield* readReviewLimits(run.runId, prepared.candidate.head)
    assert.deepStrictEqual(afterFinding.incompletePhases, ["cold"])
    assert.deepStrictEqual(afterFinding.candidateAssessment?.inheritedPhases, ["native"])
    yield* recordFinding(run, { ...contractFinding, status: "fixed" })
    yield* cleanPhase(run, "cold")
    assert.deepStrictEqual((yield* readReviewLimits(run.runId, prepared.candidate.head)).incompletePhases, [])
    const focusedHead = yield* git(["rev-parse", "HEAD"])
    yield* git(["-c", "core.hooksPath=/dev/null", "commit", "--amend", "-m", "equivalent rebased feature"])
    const nextScope = yield* rebaselineCurrentCandidate(run)
    const next = yield* prepareCandidate(run, nextScope)
    yield* assessCandidate({
      candidateId: next.candidateId,
      decision: "reuse",
      affectedPhases: [],
      semanticImpactEvidence: "Only the commit message changed after focused review; the exact branch patch and candidate tree are unchanged."
    })
    const chained = yield* readReviewLimits(run.runId, next.candidate.head)
    assert.deepStrictEqual(chained.incompletePhases, [])
    assert.deepStrictEqual(new Set(chained.candidateAssessment?.sourceReviews.map(review => review.head)), new Set([originalHead, focusedHead]))
  }).pipe(Effect.scoped), { timeout: 30_000 })

  test.effect("reuses a completed run after rebasing the same patch over unrelated upstream work", () => Effect.gen(function*() {
    const { run, fs, git } = yield* fixture()
    yield* cleanPhase(run, "native")
    yield* cleanPhase(run, "cold")
    yield* checkScopeBudget(run, "Final source scope check")
    yield* completeScopeBudget(run, "Source review completed cleanly")
    yield* git(["switch", "main"])
    yield* fs.writeFileString(`${run.repoPath}/upstream.ts`, "export const upstream = true\n")
    yield* git(["add", "upstream.ts"])
    yield* git(["-c", "core.hooksPath=/dev/null", "commit", "-m", "unrelated upstream"])
    yield* git(["switch", "feature"])
    yield* git(["rebase", "main"])
    const { runId: _completedRunId, ...completedIdentity } = run
    const candidateRun = { ...completedIdentity, head: "" }
    const scope = yield* startScopeBudget(candidateRun, {
      scopeSummary: "Rebased candidate",
      limits: { nativeCleanTarget: 1, coldCleanTarget: 1, requiredPhases: ["native", "cold"], requireCurrentHead: true }
    })
    const currentRun = { ...candidateRun, runId: scope.runId }
    const prepared = yield* prepareCandidate(currentRun, scope, undefined, true)
    assert.notStrictEqual(prepared.source.runId, prepared.runId)
    assert.strictEqual(prepared.source.patchId, prepared.candidate.patchId)
    yield* assessCandidate({
      candidateId: prepared.candidateId,
      decision: "reuse",
      affectedPhases: [],
      semanticImpactEvidence: "The exact feature patch is unchanged and upstream added an independent module with no shared contract or runtime edge."
    })
    const limits = yield* readReviewLimits(scope.runId, prepared.candidate.head)
    assert.deepStrictEqual(limits.incompletePhases, [])
    assert.deepStrictEqual(new Set(limits.candidateAssessment?.inheritedPhases), new Set(["native", "cold"]))
  }).pipe(Effect.scoped), { timeout: 30_000 })

  test.effect("fails whole reuse closed when a required source phase has no eligible evidence", () => Effect.gen(function*() {
    const { run, git } = yield* fixture()
    yield* cleanPhase(run, "native")
    yield* git(["-c", "core.hooksPath=/dev/null", "commit", "--amend", "-m", "equivalent feature commit"])
    const scope = yield* rebaselineCurrentCandidate(run)
    const prepared = yield* prepareCandidate(run, scope)
    const error = yield* assessCandidate({
      candidateId: prepared.candidateId,
      decision: "reuse",
      affectedPhases: [],
      semanticImpactEvidence: "The patch is equivalent."
    }).pipe(Effect.flip)
    assert.include(error.message, "missing completed source evidence for: cold")
    const focused = yield* assessCandidate({
      candidateId: prepared.candidateId,
      decision: "focused",
      affectedPhases: ["native"],
      semanticImpactEvidence: "Repeat native review and fill the missing cold review before completion."
    })
    assert.deepStrictEqual(new Set(focused.affectedPhases), new Set(["native", "cold"]))
  }).pipe(Effect.scoped), { timeout: 30_000 })

  test.effect("requires the selected focused phase when the branch patch changes", () => Effect.gen(function*() {
    const { run, fs, git } = yield* fixture()
    yield* cleanPhase(run, "native")
    yield* cleanPhase(run, "cold")
    yield* fs.writeFileString(`${run.repoPath}/feature.ts`, "import { value } from './contract.js'\nexport const feature = value + 2\n")
    yield* git(["-c", "core.hooksPath=/dev/null", "commit", "-am", "change feature behavior"])
    const scope = yield* rebaselineCurrentCandidate(run)
    const prepared = yield* prepareCandidate(run, scope)
    assert.notStrictEqual(prepared.source.patchId, prepared.candidate.patchId)
    yield* assessCandidate({
      candidateId: prepared.candidateId,
      decision: "focused",
      affectedPhases: ["native"],
      semanticImpactEvidence: "The branch changes its exported runtime result; native review must assess the changed behavior."
    })
    const limits = yield* readReviewLimits(run.runId, prepared.candidate.head)
    assert.deepStrictEqual(limits.incompletePhases, ["native"])
    assert.deepStrictEqual(limits.candidateAssessment?.inheritedPhases, ["cold"])
  }).pipe(Effect.scoped), { timeout: 30_000 })

  test.effect("rejects an assessment when the committed candidate changes after preparation", () => Effect.gen(function*() {
    const { run, fs, git } = yield* fixture()
    yield* cleanPhase(run, "native")
    yield* cleanPhase(run, "cold")
    yield* git(["-c", "core.hooksPath=/dev/null", "commit", "--amend", "-m", "equivalent feature commit"])
    const scope = yield* rebaselineCurrentCandidate(run)
    const prepared = yield* prepareCandidate(run, scope)
    yield* fs.writeFileString(`${run.repoPath}/late.ts`, "export const late = true\n")
    yield* git(["add", "late.ts"])
    yield* git(["-c", "core.hooksPath=/dev/null", "commit", "-m", "move after prepare"])
    const error = yield* assessCandidate({
      candidateId: prepared.candidateId,
      decision: "reuse",
      affectedPhases: [],
      semanticImpactEvidence: "This evidence is stale."
    }).pipe(Effect.flip)
    assert.include(error.message, "moved after preparation")
  }).pipe(Effect.scoped), { timeout: 30_000 })

  test.effect("broad assessment at the same head requires the full clean target after its cutoff", () => Effect.gen(function*() {
    const { run } = yield* fixture(["native"], 2)
    yield* cleanPhase(run, "native")
    yield* cleanPhase(run, "native")
    const scope = yield* getScopeBudget(run)
    const prepared = yield* prepareCandidate(run, scope)
    const assessed = yield* assessCandidate({
      candidateId: prepared.candidateId,
      decision: "broad",
      affectedPhases: [],
      semanticImpactEvidence: "The previous evidence is broadly invalidated even though the candidate commit is unchanged."
    })
    assert.deepStrictEqual(assessed.affectedPhases, ["native"])
    assert.strictEqual((yield* assessCandidate({
      candidateId: prepared.candidateId,
      decision: "broad",
      affectedPhases: [],
      semanticImpactEvidence: "The previous evidence is broadly invalidated even though the candidate commit is unchanged."
    })).candidateId, prepared.candidateId)
    assert.deepStrictEqual((yield* readReviewLimits(run.runId, prepared.candidate.head)).incompletePhases, ["native"])
    const noOldSource = yield* prepareCandidate(run, scope).pipe(Effect.flip)
    assert.include(noOldSource.message, "No earlier completed")
    yield* cleanPhase(run, "native")
    assert.deepStrictEqual((yield* readReviewLimits(run.runId, prepared.candidate.head)).incompletePhases, ["native"])
    yield* cleanPhase(run, "native")
    assert.deepStrictEqual((yield* readReviewLimits(run.runId, prepared.candidate.head)).incompletePhases, [])
  }).pipe(Effect.scoped), { timeout: 30_000 })

  test.effect("requires an explicitly affected phase with default completion settings", () => Effect.gen(function*() {
    const { run } = yield* fixture([], 1, false)
    yield* cleanPhase(run, "native")
    const scope = yield* getScopeBudget(run)
    const prepared = yield* prepareCandidate(run, scope)
    yield* assessCandidate({
      candidateId: prepared.candidateId,
      decision: "focused",
      affectedPhases: ["native"],
      semanticImpactEvidence: "Native evidence is explicitly invalidated under the default optional phase settings."
    })
    assert.deepStrictEqual((yield* readReviewLimits(run.runId, prepared.candidate.head)).incompletePhases, ["native"])
  }).pipe(Effect.scoped), { timeout: 30_000 })

  test.effect("broad assessment invalidates phases already run under default settings", () => Effect.gen(function*() {
    const { run } = yield* fixture([], 1, false)
    yield* cleanPhase(run, "native")
    const scope = yield* getScopeBudget(run)
    const prepared = yield* prepareCandidate(run, scope)
    const assessed = yield* assessCandidate({
      candidateId: prepared.candidateId,
      decision: "broad",
      affectedPhases: [],
      semanticImpactEvidence: "All review evidence already gathered for this candidate is invalidated."
    })
    assert.deepStrictEqual(assessed.affectedPhases, ["native"])
    assert.deepStrictEqual((yield* readReviewLimits(run.runId, prepared.candidate.head)).incompletePhases, ["native"])
  }).pipe(Effect.scoped), { timeout: 30_000 })

  test.effect("does not combine ClawSweeper clean passes separated by another head", () => Effect.gen(function*() {
    const { run, git } = yield* fixture(["native"], 1, false)
    yield* cleanPhase(run, "native")
    const currentHead = yield* git(["rev-parse", "HEAD"])
    const bot = (expectedRevision: number, head: string, outcome: ProgressEvent["outcome"]) => ({
      expectedRevision, phase: "clawsweeper" as const, head, outcome, evidence: `${head} ${outcome}`
    })
    yield* recordProgress(run.runId, bot(2, currentHead, "started"))
    yield* recordProgress(run.runId, bot(3, currentHead, "clean"))
    yield* recordProgress(run.runId, bot(4, "other-head", "started"))
    yield* recordProgress(run.runId, bot(5, "other-head", "blocked"))
    yield* recordProgress(run.runId, bot(6, currentHead, "started"))
    yield* recordProgress(run.runId, bot(7, currentHead, "clean"))
    const scope = yield* getScopeBudget(run)
    const prepared = yield* prepareCandidate(run, scope)
    yield* assessCandidate({
      candidateId: prepared.candidateId,
      decision: "reuse",
      affectedPhases: [],
      semanticImpactEvidence: "Native evidence still applies; bot convergence remains independently required."
    })
    assert.include((yield* readReviewLimits(run.runId, currentHead)).incompletePhases, "clawsweeper")
  }).pipe(Effect.scoped), { timeout: 30_000 })

  test.effect("selects the newest fully reviewed head before the original scope baseline", () => Effect.gen(function*() {
    const { run, fs, git } = yield* fixture()
    yield* cleanPhase(run, "native")
    yield* fs.writeFileString(`${run.repoPath}/feature.ts`, "import { value } from './contract.js'\nexport const feature = value + 2\n")
    yield* git(["-c", "core.hooksPath=/dev/null", "commit", "-am", "repair feature"])
    const reviewedHead = yield* git(["rev-parse", "HEAD"])
    yield* cleanPhase(run, "native")
    yield* cleanPhase(run, "cold")
    yield* git(["-c", "core.hooksPath=/dev/null", "commit", "--amend", "-m", "equivalent repaired feature"])
    const scope = yield* getScopeBudget(run)
    const prepared = yield* prepareCandidate(run, scope)
    assert.strictEqual(prepared.source.head, reviewedHead)
    assert.strictEqual(prepared.source.patchId, prepared.candidate.patchId)
    yield* assessCandidate({
      candidateId: prepared.candidateId,
      decision: "reuse",
      affectedPhases: [],
      semanticImpactEvidence: "Only the repaired commit message changed after native and cold review completed on the repaired tree."
    })
  }).pipe(Effect.scoped), { timeout: 30_000 })
  test.effect("broad invalidation resets partial progress as well as complete evidence", () => Effect.gen(function*() {
    const { run } = yield* fixture([], 2, false)
    yield* cleanPhase(run, "native")
    yield* cleanPhase(run, "cold")
    yield* cleanPhase(run, "cold")
    const prepared = yield* prepareCandidate(run, yield* getScopeBudget(run))
    const assessed = yield* assessCandidate({ candidateId: prepared.candidateId, decision: "broad", affectedPhases: [], semanticImpactEvidence: "All earlier coverage is invalidated" })
    assert.deepStrictEqual(new Set(assessed.affectedPhases), new Set(["native", "cold"]))
    yield* cleanPhase(run, "native")
    assert.include((yield* readReviewLimits(run.runId, prepared.candidate.head)).incompletePhases, "native")
    yield* cleanPhase(run, "native")
    assert.notInclude((yield* readReviewLimits(run.runId, prepared.candidate.head)).incompletePhases, "native")
  }).pipe(Effect.scoped), { timeout: 30_000 })

  test.effect("rejects reuse while an invocation is open and permits it after explicit closure", () => Effect.gen(function*() {
    const { run, git } = yield* fixture()
    yield* cleanPhase(run, "native")
    yield* cleanPhase(run, "cold")
    yield* git(["-c", "core.hooksPath=/dev/null", "commit", "--amend", "-m", "Equivalent pending candidate"])
    const pending = yield* startReview(run, "native", "Pending review")
    const prepared = yield* prepareCandidate(run, yield* getScopeBudget(run))
    const input = { candidateId: prepared.candidateId, decision: "reuse" as const, affectedPhases: [], semanticImpactEvidence: "Only the commit message changed" }
    assert.include((yield* assessCandidate(input).pipe(Effect.flip)).message, "open review invocation")
    yield* finishReview(pending.reviewId, "blocked", "Explicitly cancelled before using earlier evidence")
    const retry = yield* prepareCandidate(run, yield* getScopeBudget(run))
    yield* assessCandidate({ ...input, candidateId: retry.candidateId })
    assert.deepStrictEqual((yield* readReviewLimits(run.runId, retry.candidate.head)).incompletePhases, [])
  }).pipe(Effect.scoped), { timeout: 30_000 })

  test.effect("rejects sibling snapshots after broad invalidation and keeps that invalidation across rebaselining", () => Effect.gen(function*() {
    const { run } = yield* fixture(["native"])
    yield* cleanPhase(run, "native")
    const scope = yield* getScopeBudget(run)
    const first = yield* prepareCandidate(run, scope)
    const sibling = yield* prepareCandidate(run, scope)
    yield* assessCandidate({ candidateId: first.candidateId, decision: "broad", affectedPhases: [], semanticImpactEvidence: "All native evidence invalidated" })
    const stale = yield* assessCandidate({ candidateId: sibling.candidateId, decision: "reuse", affectedPhases: [], semanticImpactEvidence: "Earlier patch was equivalent" }).pipe(Effect.flip)
    assert.include(stale.message, "superseded")
    assert.deepStrictEqual((yield* readReviewLimits(run.runId, first.candidate.head)).incompletePhases, ["native"])
    const rebaselined = yield* rebaselineCurrentCandidate(run)
    assert.include((yield* prepareCandidate(run, rebaselined).pipe(Effect.flip)).message, "No earlier completed")
  }).pipe(Effect.scoped), { timeout: 30_000 })

  test.effect("keeps unchanged source evidence available after equivalent base alias authorization", () => Effect.gen(function*() {
    const { run, git } = yield* fixture()
    const native = yield* cleanPhase(run, "native")
    yield* cleanPhase(run, "cold")
    yield* git(["branch", "equivalent-base", "main"])
    const scope = yield* authorizeScopeBudget(run, { scopeSummary: "Equivalent base ref", authorization: "Fixture owner selected alias", newBase: "equivalent-base" })
    const prepared = yield* prepareCandidate({ ...run, base: "equivalent-base" }, scope)
    assert.include(prepared.source.reviews.map(review => review.reviewId), native.reviewId)
    yield* assessCandidate({ candidateId: prepared.candidateId, decision: "reuse", affectedPhases: [], semanticImpactEvidence: "Only base ref name changed; head and base OID are unchanged" })
    assert.deepStrictEqual((yield* readReviewLimits(run.runId, prepared.candidate.head)).incompletePhases, [])
  }).pipe(Effect.scoped), { timeout: 30_000 })

  test.effect("preserves performed phase obligations when a new run raises the target", () => Effect.gen(function*() {
    const { run, git } = yield* fixture([], 1, false)
    yield* cleanPhase(run, "native")
    yield* checkScopeBudget(run, "Source checked")
    yield* completeScopeBudget(run, "Source complete")
    yield* git(["-c", "core.hooksPath=/dev/null", "commit", "--amend", "-m", "Equivalent raised target"])
    const { runId: _sourceRun, ...identity } = run
    const scope = yield* startScopeBudget(identity, { scopeSummary: "Raised target", limits: { nativeCleanTarget: 2 } })
    const target = { ...identity, runId: scope.runId }
    const prepared = yield* prepareCandidate(target, scope, undefined, true, { nativeCleanTarget: 2 })
    const error = yield* assessCandidate({ candidateId: prepared.candidateId, decision: "reuse", affectedPhases: [], semanticImpactEvidence: "Same patch but target increased" }).pipe(Effect.flip)
    assert.include(error.message, "missing completed source evidence for: native")
    yield* assessCandidate({ candidateId: prepared.candidateId, decision: "focused", affectedPhases: [], semanticImpactEvidence: "Native must meet the raised target" })
    assert.deepStrictEqual((yield* readReviewLimits(target.runId, prepared.candidate.head)).incompletePhases, ["native"])
  }).pipe(Effect.scoped), { timeout: 30_000 })

  test.effect("includes committed dependency pins despite ignoreSubmodules configuration", () => Effect.gen(function*() {
    const { run, git, fs } = yield* fixture()
    const dependency = `${run.repoPath}/dependency`
    yield* fs.makeDirectory(dependency)
    const depGit = (args: ReadonlyArray<string>) => checkedTrimmedText("git", args, { cwd: dependency })
    yield* depGit(["init", "-b", "main"])
    yield* depGit(["config", "user.email", "fixture@example.invalid"])
    yield* depGit(["config", "user.name", "Fixture"])
    yield* fs.writeFileString(`${dependency}/value.ts`, "export const value = 1\n")
    yield* depGit(["add", "value.ts"])
    yield* depGit(["-c", "core.hooksPath=/dev/null", "commit", "-m", "dependency1"])
    yield* git(["add", "dependency"])
    yield* git(["-c", "core.hooksPath=/dev/null", "commit", "-m", "pin dependency1"])
    yield* cleanPhase(run, "native")
    yield* cleanPhase(run, "cold")
    yield* fs.writeFileString(`${dependency}/value.ts`, "export const value = 2\n")
    yield* depGit(["-c", "core.hooksPath=/dev/null", "commit", "-am", "dependency2"])
    yield* git(["add", "dependency"])
    yield* git(["-c", "core.hooksPath=/dev/null", "commit", "-m", "pin dependency2"])
    yield* git(["config", "diff.ignoreSubmodules", "all"])
    const prepared = yield* prepareCandidate(run, yield* getScopeBudget(run))
    assert.notStrictEqual(prepared.source.patchId, prepared.candidate.patchId)
    const error = yield* assessCandidate({ candidateId: prepared.candidateId, decision: "reuse", affectedPhases: [], semanticImpactEvidence: "Dependency pin changed" }).pipe(Effect.flip)
    assert.include(error.message, "equivalent stable patch")
  }).pipe(Effect.scoped), { timeout: 30_000 })

})
