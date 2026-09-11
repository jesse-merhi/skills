import * as Effect from "effect/Effect"
import * as Schema from "effect/Schema"
import * as SqlClient from "effect/unstable/sql/SqlClient"

import { checkedTrimmedText } from "../../../packages/effect-cli/CheckedProcess.ts"
import { trustedExecutable } from "./NativeReview.ts"
import { type FindingInput, getScopeBudget, recordCommand, recordFinding, recordReviewedFiles, reviewLimits, reviewProgress } from "./ReviewFindings.ts"
import { ProgressConflict } from "./ReviewProgress.ts"

const Text = Schema.String.check(Schema.isMinLength(1))
const Count = Schema.Number.check(Schema.isInt(), Schema.isGreaterThanOrEqualTo(0))
export const BatchRun = Schema.Struct({
  runId: Text, repo: Text, repoPath: Text, branch: Schema.String, target: Text, base: Text, head: Text
})
const Finding = Schema.Struct({
  decisionId: Text, status: Text, source: Text, fingerprint: Text, summary: Text,
  area: Schema.optionalKey(Schema.String), material: Schema.optionalKey(Schema.Boolean), userImpact: Schema.optionalKey(Schema.String),
  decision: Schema.optionalKey(Schema.String), text: Schema.optionalKey(Schema.String), findingKind: Text,
  productionPath: Schema.optionalKey(Schema.String), reachabilityEvidence: Schema.optionalKey(Schema.String),
  likelihood: Schema.optionalKey(Schema.String), impact: Schema.optionalKey(Schema.String), actualConsequence: Schema.optionalKey(Schema.String),
  maintenanceEvidence: Schema.optionalKey(Schema.String), presentCost: Schema.optionalKey(Schema.String), contractEvidence: Schema.optionalKey(Schema.String),
  rootCause: Schema.optionalKey(Schema.String), recommendedFix: Schema.optionalKey(Schema.String), interventionJustification: Schema.optionalKey(Schema.String),
  rejectionGate: Schema.optionalKey(Schema.String), fixScope: Text, handling: Text, ownerResolution: Schema.optionalKey(Schema.String)
})
const Check = Schema.Struct({ command: Text, result: Text, reason: Text, decisionId: Schema.optionalKey(Schema.String) })
const Phase = Schema.Literals(["native", "cold"])
const ReviewStart = Schema.Struct({ kind: Schema.Literal("review-start"), phase: Phase, evidence: Text })
const ReviewResult = Schema.Struct({
  kind: Schema.Literal("review-result"), phase: Phase, evidence: Text,
  outcome: Schema.Literals(["clean", "clean-except-queue", "findings", "blocked"]),
  findings: Schema.Array(Finding),
  coverage: Schema.optionalKey(Schema.Struct({ reviewId: Text, reviewer: Text, files: Schema.Array(Schema.Struct({ path: Text, changeId: Text })) }))
})
const RepairResult = Schema.Struct({
  kind: Schema.Literal("repair-result"), phase: Phase,
  repairs: Schema.Array(Schema.Struct({ finding: Finding, attempt: Text, evidence: Text, unsuccessful: Schema.Boolean })).check(Schema.isMinLength(1)),
  checks: Schema.Array(Check)
})
export const Batch = Schema.Struct({
  requestId: Text, expectedRevision: Count,
  action: Schema.Union([ReviewStart, ReviewResult, RepairResult, Schema.Struct({ kind: Schema.Literal("checks"), checks: Schema.Array(Check).check(Schema.isMinLength(1)) })])
})
const Receipt = Schema.Struct({ requestId: Text, runId: Text, revision: Count, action: Text })

const findingInput = (input: typeof Finding.Type): FindingInput => ({
  area: "", material: false, userImpact: "", decision: "", text: "", productionPath: "", reachabilityEvidence: "", likelihood: "", impact: "",
  actualConsequence: "", maintenanceEvidence: "", presentCost: "", contractEvidence: "", rootCause: "", recommendedFix: "", interventionJustification: "",
  rejectionGate: "", ownerResolution: "", ...input
})

/** Save one completed lifecycle action. Model/process execution stays outside this transaction. */
export const applyReviewBatch = Effect.fn("ReviewBatch.apply")(function*(rawRun: typeof BatchRun.Type, rawBatch: typeof Batch.Type) {
  const run = { ...yield* Schema.decodeUnknownEffect(BatchRun)(rawRun), status: "active", decisionLog: "" }
  const batch = yield* Schema.decodeUnknownEffect(Batch)(rawBatch)
  const sql = yield* SqlClient.SqlClient
  const scope = yield* getScopeBudget(run)
  if (scope.runId !== run.runId) return yield* new ProgressConflict({ message: "Saved run ID does not match the active scope; do not replay an earlier run into a new review" })
  const payload = JSON.stringify({ run, batch })
  return yield* sql.withTransaction(Effect.gen(function*() {
    const saved = (yield* sql<{ readonly payload: string; readonly receipt: string }>`select payload, receipt from review_batch_receipts where run_id = ${scope.runId} and request_id = ${batch.requestId}`)[0]
    if (saved !== undefined) {
      if (saved.payload !== payload) return yield* new ProgressConflict({ message: "Request ID already belongs to a different action; saved history is immutable" })
      return { ...yield* Schema.decodeUnknownEffect(Schema.fromJsonString(Receipt))(saved.receipt), replayed: true }
    }
    const git = yield* trustedExecutable("git", run.repoPath)
    const actualHead = yield* checkedTrimmedText(git, ["rev-parse", "HEAD"], { cwd: run.repoPath })
    const action = batch.action
    const interrupted = action.kind === "review-result" && action.outcome === "blocked"
    if (actualHead !== run.head && !interrupted) return yield* new ProgressConflict({ message: "Checkout head changed; save the old invocation as blocked before preparing an action for the actual revision" })
    const head = run.head
    let progress = yield* reviewProgress(run)
    if ((progress?.revision ?? 0) !== batch.expectedRevision) return yield* new ProgressConflict({ message: "Progress changed; inspect the saved state before submitting another action" })
    const event = (outcome: "started" | "clean" | "clean-except-queue" | "findings" | "blocked" | "repair-applied" | "repair-unsuccessful", phase: "native" | "cold", evidence: string, repair?: { findingId: string; repairAttempt: string }) => reviewProgress(run, {
      expectedRevision: progress?.revision ?? 0, phase, head, outcome, evidence, ...repair
    })
    if (action.kind === "review-start") {
      if (progress?.outcome === "started") return yield* new ProgressConflict({ message: "A review is already running; resume that invocation or record its interrupted result before starting another" })
      progress = yield* event("started", action.phase, action.evidence)
    } else if (action.kind === "review-result") {
      if (progress?.outcome !== "started" || progress.phase !== action.phase || progress.head !== head) return yield* new ProgressConflict({ message: "Review result requires the matching started invocation, phase and revision" })
      if (interrupted && (action.findings.length > 0 || action.coverage !== undefined)) return yield* new ProgressConflict({ message: "A blocked invocation records its limits only; preserve candidate artifacts separately without crediting coverage" })
      for (const finding of action.findings) yield* recordFinding(run, findingInput(finding))
      if (action.coverage !== undefined) yield* recordReviewedFiles(run, action.coverage)
      progress = yield* event(action.outcome, action.phase, action.evidence)
    } else if (action.kind === "repair-result") {
      if (progress?.outcome === "started") return yield* new ProgressConflict({ message: "Save the review result before applying repair results" })
      for (const repair of action.repairs) {
        if (repair.finding.status !== (repair.unsuccessful ? "open" : "fixed")) return yield* new ProgressConflict({ message: "A verified repair must be fixed; an unsuccessful repair stays open" })
        const limits = yield* reviewLimits(run)
        if (limits.repairAttempts.some(attempt => attempt.findingId === repair.finding.decisionId && attempt.unsuccessfulAttempts >= 2)) return yield* new ProgressConflict({ message: "Two unsuccessful repairs require the existing owner-authorization path before another attempt" })
        const identity = { findingId: repair.finding.decisionId, repairAttempt: repair.attempt }
        progress = yield* event("repair-applied", action.phase, repair.evidence, identity)
        if (repair.unsuccessful) progress = yield* event("repair-unsuccessful", action.phase, repair.evidence, identity)
        yield* recordFinding(run, findingInput(repair.finding))
      }
    }
    if (action.kind === "repair-result" || action.kind === "checks") {
      for (const check of action.checks) yield* recordCommand(run, { decisionId: "", ...check })
    }
    const receipt = { requestId: batch.requestId, runId: scope.runId, revision: progress?.revision ?? 0, action: action.kind }
    yield* sql`insert into review_batch_receipts (run_id, request_id, payload, receipt) values (${scope.runId}, ${batch.requestId}, ${payload}, ${JSON.stringify(receipt)})`
    return { ...receipt, replayed: false }
  }))
})
