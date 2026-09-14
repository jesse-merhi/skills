import * as Effect from "effect/Effect"
import * as Schema from "effect/Schema"
import * as SqlClient from "effect/unstable/sql/SqlClient"

import { candidateCoverage, type CandidatePhase } from "./ReviewCandidate.ts"
import { type Progress, type ProgressEvent, readProgressHistory } from "./ReviewProgress.ts"

const PositiveCount = Schema.Number.check(Schema.isInt(), Schema.isGreaterThan(0))
export const LimitSettings = Schema.Struct({
  consultCap: PositiveCount,
  coldCleanTarget: PositiveCount,
  nativeCleanTarget: Schema.optionalKey(PositiveCount),
  requiredPhases: Schema.optionalKey(Schema.Array(Schema.Literals(["native", "cold"]))),
  requireCurrentHead: Schema.optionalKey(Schema.Boolean)
})
export type LimitSettings = typeof LimitSettings.Type
export const DEFAULT_REVIEW_LIMITS: LimitSettings = { consultCap: 5, coldCleanTarget: 1 }
export type ReviewPhase = ProgressEvent["phase"]

export const freezeReviewLimits = Effect.fn("ReviewLimits.freeze")(function*(runId: string, input: Partial<LimitSettings>) {
  const settings = yield* Schema.decodeUnknownEffect(LimitSettings)({ ...DEFAULT_REVIEW_LIMITS, ...input })
  const sql = yield* SqlClient.SqlClient
  yield* sql`insert or ignore into review_run_limits (run_id, settings) values (${runId}, ${JSON.stringify(settings)})`
})

export const readReviewLimits = Effect.fn("ReviewLimits.read")(function*(runId: string, head = "", phase?: ReviewPhase) {
  const sql = yield* SqlClient.SqlClient
  const rows = yield* sql<{ readonly settings: string | null; readonly head: string; readonly base_oid: string; readonly evidence_revision: number }>`select review_run_limits.settings, coalesce(review_runs.head, '') as head,
      coalesce(review_scope_budgets.base_oid, '') as base_oid, coalesce(review_scope_budgets.evidence_revision, 0) as evidence_revision
    from review_runs left join review_run_limits on review_run_limits.run_id = review_runs.id
      left join review_scope_budgets on review_scope_budgets.run_id = review_runs.id where review_runs.id = ${runId}`
  const row = rows[0]
  const currentHead = head || row?.head || ""
  const settings = row?.settings == null ? DEFAULT_REVIEW_LIMITS
    : yield* Schema.decodeUnknownEffect(Schema.fromJsonString(LimitSettings))(row.settings)
  const questions = yield* sql<{ readonly decision_id: string; readonly summary: string; readonly decision: string; readonly status: string }>`select decision_id, summary, coalesce(decision, '') as decision, status from issues
    where run_id = ${runId} and coalesce(owner_resolution, '') = ''
      and (status = 'provisional' or (disposition = 'consult' and status in ('open', 'reopened')))
    order by decision_id`
  const openQuestions = questions.map(question => ({ decisionId: question.decision_id, summary: question.summary, question: question.decision, status: question.status }))
  const progress = yield* readProgressHistory(runId)
  const cleanTargets = { native: settings.nativeCleanTarget ?? 2, cold: settings.coldCleanTarget, clawsweeper: 2 } as const
  const candidate = row === undefined ? undefined : yield* candidateCoverage(runId, currentHead, row.base_oid)
  const inheritedCounts: Readonly<Record<CandidatePhase, number>> = candidate === undefined ? { native: 0, cold: 0 } : {
    native: candidate.source.reviews.filter(review => review.phase === "native").length,
    cold: candidate.source.reviews.filter(review => review.phase === "cold").length
  }
  const inheritedPhases = candidate === undefined || candidate.decision === "broad"
    ? new Set<CandidatePhase>()
    : new Set((["native", "cold"] as const).filter(savedPhase =>
      !candidate.affectedPhases.includes(savedPhase) && inheritedCounts[savedPhase] >= cleanTargets[savedPhase]
    ))
  const latest = new Map<ReviewPhase, Progress>()
  const completed = new Set<ReviewPhase>(inheritedPhases)
  for (const event of progress) {
    latest.set(event.phase, event)
    if ((row?.evidence_revision ?? 0) === 0 && candidate === undefined && event.head === currentHead && event.cleanStreak >= cleanTargets[event.phase]) completed.add(event.phase)
  }
  for (const savedPhase of ["native", "cold", "clawsweeper"] as const) {
    const cutoff = candidate?.affectedPhases.some(phase => phase === savedPhase) === true
      ? Math.max(row?.evidence_revision ?? 0, candidate.targetProgressRevision)
      : row?.evidence_revision ?? 0
    if (cutoff === 0 && candidate === undefined) continue
    let sequence = 0
    let maximum = 0
    for (const event of progress) {
      if (event.revision <= cutoff || event.phase !== savedPhase) continue
      if (event.head !== currentHead) {
        if (savedPhase === "clawsweeper") sequence = 0
        continue
      }
      if (event.outcome === "clean" || event.outcome === "clean-except-queue") {
        sequence++
        maximum = Math.max(maximum, sequence)
      } else if (event.outcome !== "started") {
        sequence = 0
      }
    }
    if (maximum >= cleanTargets[savedPhase]) completed.add(savedPhase)
  }
  const incompletePhases = [...latest].filter(([savedPhase, event]) => !completed.has(savedPhase) && (settings.requireCurrentHead === true || event.cleanStreak < cleanTargets[savedPhase])).map(([savedPhase]) => savedPhase)
  for (const affected of candidate?.affectedPhases ?? []) {
    if (!completed.has(affected) && !incompletePhases.includes(affected)) incompletePhases.push(affected)
  }
  for (const required of settings.requiredPhases ?? []) {
    if (!completed.has(required) && !incompletePhases.includes(required)) incompletePhases.push(required)
  }
  const last = progress.at(-1)
  if (last !== undefined && last.head !== currentHead && !completed.has(last.phase) && !incompletePhases.includes(last.phase)) incompletePhases.push(last.phase)
  const stoppingReasons: Array<string> = []
  const diagnosticWarnings: Array<string> = []
  if (row?.settings == null) stoppingReasons.push("LIMITS_NOT_INITIALIZED")
  if (openQuestions.length >= settings.consultCap) stoppingReasons.push("CONSULT_CAP_REACHED")
  if (last !== undefined && last.head === currentHead && completed.has(last.phase) && openQuestions.length > 0) stoppingReasons.push("QUEUE_FIXED_POINT")
  if (phase !== undefined && completed.has(phase)) stoppingReasons.push("PHASE_TARGET_MET")
  const scope = (yield* sql<{ readonly status: string; readonly growth_lines: number; readonly allowed_growth_lines: number; readonly new_binary_production_paths_json: string }>`select status, growth_lines, allowed_growth_lines, new_binary_production_paths_json from review_scope_budgets where run_id = ${runId}`)[0]
  if (scope !== undefined && scope.growth_lines > scope.allowed_growth_lines) {
    diagnosticWarnings.push("DIFF_GROWTH_EXCEEDED")
  }
  if (scope?.status === "blocked") {
    if (scope.new_binary_production_paths_json !== "[]") stoppingReasons.push("NEW_BINARY_PATHS")
  }
  if (scope?.status === "rebaseline-required") stoppingReasons.push("SCOPE_REBASELINE_REQUIRED")
  const activeFindings = yield* sql<{ readonly decision_id: string }>`select decision_id from issues where run_id = ${runId} and status in ('open', 'reopened', 'provisional')`
  const repairAttempts = activeFindings.map(finding => {
    const latestReplan = progress.findLastIndex(event => ["repair-replanned", "repair-authorized"].includes(event.outcome) && event.findingId === finding.decision_id)
    const failures = progress.slice(latestReplan + 1).filter(event => event.outcome === "repair-unsuccessful" && event.findingId === finding.decision_id)
    return { findingId: finding.decision_id, unsuccessfulAttempts: failures.length, evidence: failures.map(event => ({ attempt: event.repairAttempt, head: event.head, reference: event.evidence })) }
  }).filter(attempt => attempt.unsuccessfulAttempts > 0)
  if (repairAttempts.some(attempt => attempt.unsuccessfulAttempts >= 2)) stoppingReasons.push("REPAIR_DIAGNOSIS_REQUIRED")
  return {
    runId, consultCap: settings.consultCap,
    openQuestionCount: openQuestions.length, openQuestions, cleanTargets, incompletePhases, repairAttempts,
    candidateAssessment: candidate === undefined ? undefined : {
      candidateId: candidate.candidateId,
      decision: candidate.decision,
      semanticImpactEvidence: candidate.semanticImpactEvidence,
      affectedPhases: candidate.affectedPhases,
      inheritedPhases: [...inheritedPhases],
      sourceRunId: candidate.source.runId,
      sourceReviews: candidate.source.reviews.map(review => ({ reviewId: review.reviewId, phase: review.phase, head: review.head, baseOid: review.baseOid, outcome: review.outcome, evidence: review.evidence }))
    },
    diagnosticWarnings, stoppingReasons, allowed: stoppingReasons.length === 0,
    nextAction: stoppingReasons.includes("REPAIR_DIAGNOSIS_REQUIRED") ? "diagnose-repair"
      : stoppingReasons.some(reason => ["CONSULT_CAP_REACHED", "QUEUE_FIXED_POINT", "NEW_BINARY_PATHS", "SCOPE_REBASELINE_REQUIRED"].includes(reason)) ? "consult"
      : stoppingReasons.includes("PHASE_TARGET_MET") ? "advance-phase-or-complete"
      : stoppingReasons.includes("LIMITS_NOT_INITIALIZED") ? "scope-start" : "continue"
  }
})

export type ReviewLimitsReport = Effect.Success<ReturnType<typeof readReviewLimits>>

export class ReviewLimitsBlocked extends Schema.TaggedError<ReviewLimitsBlocked>()("ReviewLimitsBlocked", {
  message: Schema.String,
  report: Schema.Unknown
}) {}

export const checkReviewLimits = (report: ReviewLimitsReport) => report.allowed
  ? Effect.void
  : Effect.fail(new ReviewLimitsBlocked({ message: JSON.stringify({ limits: report }), report }))
