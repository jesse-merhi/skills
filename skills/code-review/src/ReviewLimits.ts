import * as DateTime from "effect/DateTime"
import * as Effect from "effect/Effect"
import * as Schema from "effect/Schema"
import * as SqlClient from "effect/unstable/sql/SqlClient"

import { type Progress, type ProgressEvent, readProgressHistory } from "./ReviewProgress.ts"

const PositiveCount = Schema.Number.check(Schema.isInt(), Schema.isGreaterThan(0))
const LimitSettings = Schema.Struct({
  timeBudgetHours: Schema.Number.check(Schema.isFinite(), Schema.isGreaterThan(0)),
  consultCap: PositiveCount,
  coldCleanTarget: PositiveCount
})
export type LimitSettings = typeof LimitSettings.Type
export const DEFAULT_REVIEW_LIMITS: LimitSettings = { timeBudgetHours: 8, consultCap: 5, coldCleanTarget: 1 }
export type ReviewPhase = ProgressEvent["phase"]

export const freezeReviewLimits = Effect.fn("ReviewLimits.freeze")(function*(runId: string, input: Partial<LimitSettings>) {
  const settings = yield* Schema.decodeUnknownEffect(LimitSettings)({ ...DEFAULT_REVIEW_LIMITS, ...input })
  const sql = yield* SqlClient.SqlClient
  yield* sql`insert or ignore into review_run_limits (run_id, settings) values (${runId}, ${JSON.stringify(settings)})`
})

export const readReviewLimits = Effect.fn("ReviewLimits.read")(function*(runId: string, head = "", phase?: ReviewPhase) {
  const sql = yield* SqlClient.SqlClient
  const rows = yield* sql<{ readonly started_at: number | null; readonly settings: string | null; readonly head: string }>`select review_runs.started_at, review_run_limits.settings, coalesce(review_runs.head, '') as head
    from review_runs left join review_run_limits on review_run_limits.run_id = review_runs.id where review_runs.id = ${runId}`
  const row = rows[0]
  const currentHead = head || row?.head || ""
  const settings = row?.settings == null ? DEFAULT_REVIEW_LIMITS
    : yield* Schema.decodeUnknownEffect(Schema.fromJsonString(LimitSettings))(row.settings)
  const now = Math.floor(DateTime.toEpochMillis(yield* DateTime.now) / 1000)
  const startedAt = row?.started_at ?? null
  const timeBudgetSeconds = settings.timeBudgetHours * 3600
  const deadline = startedAt === null ? null : startedAt + timeBudgetSeconds
  const remainingSeconds = deadline === null ? 0 : Math.max(0, deadline - now)
  const questions = yield* sql<{ readonly decision_id: string; readonly summary: string; readonly decision: string; readonly status: string }>`select decision_id, summary, coalesce(decision, '') as decision, status from issues
    where run_id = ${runId} and coalesce(owner_resolution, '') = ''
      and (status = 'provisional' or (disposition = 'consult' and status in ('open', 'reopened')))
    order by decision_id`
  const openQuestions = questions.map(question => ({ decisionId: question.decision_id, summary: question.summary, question: question.decision, status: question.status }))
  const progress = yield* readProgressHistory(runId)
  const cleanTargets = { native: 2, cold: settings.coldCleanTarget, clawsweeper: 2 } as const
  const latest = new Map<ReviewPhase, Progress>()
  const completed = new Set<ReviewPhase>()
  for (const event of progress) {
    latest.set(event.phase, event)
    if (event.head === currentHead && event.cleanStreak >= cleanTargets[event.phase]) completed.add(event.phase)
  }
  const incompletePhases = [...latest].filter(([savedPhase, event]) => !completed.has(savedPhase) && event.cleanStreak < cleanTargets[savedPhase]).map(([savedPhase]) => savedPhase)
  const last = progress.at(-1)
  if (last !== undefined && last.head !== currentHead && !incompletePhases.includes(last.phase)) incompletePhases.push(last.phase)
  const stoppingReasons: Array<string> = []
  if (row?.settings == null || startedAt === null) stoppingReasons.push("LIMITS_NOT_INITIALIZED")
  if (deadline !== null && remainingSeconds === 0) stoppingReasons.push("TIME_EXPIRED")
  if (openQuestions.length >= settings.consultCap) stoppingReasons.push("CONSULT_CAP_REACHED")
  if (last !== undefined && last.head === currentHead && completed.has(last.phase) && openQuestions.length > 0) stoppingReasons.push("QUEUE_FIXED_POINT")
  if (phase !== undefined && completed.has(phase)) stoppingReasons.push("PHASE_TARGET_MET")
  const scope = (yield* sql<{ readonly status: string; readonly growth_lines: number; readonly allowed_growth_lines: number; readonly new_binary_production_paths_json: string }>`select status, growth_lines, allowed_growth_lines, new_binary_production_paths_json from review_scope_budgets where run_id = ${runId}`)[0]
  if (scope?.status === "blocked") {
    if (scope.growth_lines > scope.allowed_growth_lines) stoppingReasons.push("DIFF_GROWTH_EXCEEDED")
    if (scope.new_binary_production_paths_json !== "[]") stoppingReasons.push("NEW_BINARY_PATHS")
  }
  if (scope?.status === "rebaseline-required") stoppingReasons.push("SCOPE_REBASELINE_REQUIRED")
  const activeFindings = yield* sql<{ readonly decision_id: string }>`select decision_id from issues where run_id = ${runId} and status in ('open', 'reopened', 'provisional')`
  const repairAttempts = activeFindings.map(finding => {
    const authorized = progress.findLastIndex(event => event.outcome === "repair-authorized" && event.findingId === finding.decision_id)
    const failures = progress.slice(authorized + 1).filter(event => event.outcome === "repair-unsuccessful" && event.findingId === finding.decision_id)
    return { findingId: finding.decision_id, unsuccessfulAttempts: failures.length, evidence: failures.map(event => ({ attempt: event.repairAttempt, head: event.head, reference: event.evidence })) }
  }).filter(attempt => attempt.unsuccessfulAttempts > 0)
  if (repairAttempts.some(attempt => attempt.unsuccessfulAttempts >= 2)) stoppingReasons.push("REPAIR_CONSULT_REQUIRED")
  return {
    runId, startedAt, deadline, timeBudgetSeconds, remainingSeconds, consultCap: settings.consultCap,
    openQuestionCount: openQuestions.length, openQuestions, cleanTargets, incompletePhases, repairAttempts,
    stoppingReasons, allowed: stoppingReasons.length === 0,
    nextAction: stoppingReasons.includes("TIME_EXPIRED") ? "handoff"
      : stoppingReasons.some(reason => ["CONSULT_CAP_REACHED", "QUEUE_FIXED_POINT", "DIFF_GROWTH_EXCEEDED", "NEW_BINARY_PATHS", "SCOPE_REBASELINE_REQUIRED", "REPAIR_CONSULT_REQUIRED"].includes(reason)) ? "consult"
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
