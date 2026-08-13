import { Clock, DateTime, Effect, Schema } from "effect"

const DurationInput = Schema.String.pipe(
  Schema.check(Schema.isPattern(/^[0-9]+(?:\.[0-9]+)?(?:ms|s|m|h)?$/)),
  Schema.brand("WaitDurationInput")
)

export class WaitDurationError extends Schema.TaggedError<WaitDurationError>()("WaitDurationError", {
  input: Schema.String,
  message: Schema.String
}) {}

const unitMilliseconds = {
  "": 1_000,
  h: 3_600_000,
  m: 60_000,
  ms: 1,
  s: 1_000
} as const

export const parseWaitDuration = Effect.fn("parseWaitDuration")(function*(input: string) {
  const normalized = input.trim().toLowerCase()
  const decoded = yield* Schema.decodeUnknownEffect(DurationInput)(normalized).pipe(
    Effect.mapError(() => new WaitDurationError({
      input,
      message: "duration must be a non-negative number with ms, s, m, or h"
    }))
  )
  const match = /^([0-9]+(?:\.[0-9]+)?)(ms|s|m|h)?$/.exec(decoded)
  if (match?.[1] === undefined) {
    return yield* new WaitDurationError({
      input,
      message: "duration must be a non-negative number with ms, s, m, or h"
    })
  }
  const unit = (match[2] ?? "") as keyof typeof unitMilliseconds
  const milliseconds = Number(match[1]) * unitMilliseconds[unit]
  if (milliseconds > 86_400_000) {
    return yield* new WaitDurationError({ input, message: "duration must not exceed 24 hours" })
  }
  return milliseconds
})

export interface WorkflowRun {
  readonly databaseId: number
  readonly event: string
  readonly headBranch: string
  readonly startedAt?: DateTime.Utc | undefined
  readonly status: string
  readonly updatedAt?: DateTime.Utc | undefined
  readonly workflowName: string
}

export const WorkflowRunFromJson = Schema.Struct({
  databaseId: Schema.Number,
  event: Schema.String,
  headBranch: Schema.String,
  startedAt: Schema.optional(Schema.DateTimeUtcFromString),
  status: Schema.String,
  updatedAt: Schema.optional(Schema.DateTimeUtcFromString),
  workflowName: Schema.String
})

export const WorkflowRunsFromJson = Schema.Array(WorkflowRunFromJson)

const percentile = (values: ReadonlyArray<number>, probability: number) => {
  const ordered = [...values].sort((left, right) => left - right)
  return ordered[Math.max(0, Math.ceil(probability * ordered.length) - 1)] ?? 0
}

const durationSeconds = (run: WorkflowRun) => {
  if (run.startedAt === undefined || run.updatedAt === undefined) {
    return undefined
  }
  const duration = (DateTime.toEpochMillis(run.updatedAt) - DateTime.toEpochMillis(run.startedAt)) / 1_000
  return duration > 0 ? duration : undefined
}

export type WaitEstimate = Readonly<Record<string, boolean | number | string>>

export const estimateWait = (
  current: WorkflowRun,
  history: ReadonlyArray<WorkflowRun>,
  nowEpochMilliseconds: number
): WaitEstimate => {
  if (current.status === "completed") {
    return { sample_count: 0, status: "completed", suggested_wait_seconds: 0 }
  }
  const matching = history.filter((run) =>
    run.databaseId !== current.databaseId &&
    run.status === "completed" &&
    run.workflowName === current.workflowName &&
    run.event === current.event
  )
  const sameBranch = matching.filter((run) => run.headBranch === current.headBranch)
  const candidates = sameBranch.length >= 3 ? sameBranch : matching
  const durations = candidates.flatMap((run) => {
    const duration = durationSeconds(run)
    return duration === undefined ? [] : [duration]
  })
  if (durations.length < 3) {
    return {
      fallback: true,
      sample_count: durations.length,
      status: current.status,
      suggested_wait_seconds: 120
    }
  }
  const p50 = percentile(durations, 0.5)
  const p75 = percentile(durations, 0.75)
  const elapsed = current.startedAt === undefined
    ? 0
    : Math.max(0, (nowEpochMilliseconds - DateTime.toEpochMillis(current.startedAt)) / 1_000)
  const remaining = Math.max(0, p75 - elapsed)
  return {
    elapsed_seconds: Math.round(elapsed),
    estimated_remaining_seconds: Math.round(remaining),
    historical_p50_seconds: Math.round(p50),
    historical_p75_seconds: Math.round(p75),
    sample_count: durations.length,
    status: current.status,
    suggested_wait_seconds: remaining <= 30 ? 30 : Math.max(60, Math.min(1_800, Math.round(remaining)))
  }
}

export const estimateWaitNow = (current: WorkflowRun, history: ReadonlyArray<WorkflowRun>) =>
  Clock.currentTimeMillis.pipe(Effect.map((now) => estimateWait(current, history, now)))
