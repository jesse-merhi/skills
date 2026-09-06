import * as Effect from "effect/Effect"
import * as Schema from "effect/Schema"
import * as SqlClient from "effect/unstable/sql/SqlClient"

const Count = Schema.Number.check(Schema.isInt(), Schema.isGreaterThanOrEqualTo(0))
const NonemptyText = Schema.String.check(Schema.isMinLength(1))
export const PROGRESS_OUTCOMES = ["started", "clean", "clean-except-queue", "findings", "blocked", "reset", "diamond-attempt", "repair-applied", "repair-unsuccessful", "repair-authorized"] as const
export const ProgressEvent = Schema.Struct({
  expectedRevision: Count,
  phase: Schema.Literals(["native", "cold", "clawsweeper"]),
  head: Schema.String.check(Schema.isMinLength(1)),
  outcome: Schema.Literals(PROGRESS_OUTCOMES),
  evidence: NonemptyText,
  findingId: Schema.optional(NonemptyText),
  repairAttempt: Schema.optional(NonemptyText),
  authorization: Schema.optional(NonemptyText)
})
export type ProgressEvent = typeof ProgressEvent.Type
export const Progress = Schema.Struct({
  revision: Count, phase: ProgressEvent.fields.phase, head: Schema.String,
  pass: Count, totalPasses: Count, cleanStreak: Count, diamondAttempts: Count,
  outcome: ProgressEvent.fields.outcome, evidence: Schema.String,
  findingId: ProgressEvent.fields.findingId, repairAttempt: ProgressEvent.fields.repairAttempt, authorization: ProgressEvent.fields.authorization
})
export type Progress = typeof Progress.Type
export class ProgressConflict extends Schema.TaggedError<ProgressConflict>()("ProgressConflict", { message: Schema.String }) {}

export const advanceProgress = (previous: Progress | undefined, event: ProgressEvent): Progress => {
  const continuing = previous?.head === event.head && previous.phase === event.phase
  const attempts = previous?.diamondAttempts ?? 0
  return {
    revision: (previous?.revision ?? 0) + 1,
    phase: event.phase, head: event.head, outcome: event.outcome, evidence: event.evidence,
    ...(event.findingId === undefined ? {} : { findingId: event.findingId }),
    ...(event.repairAttempt === undefined ? {} : { repairAttempt: event.repairAttempt }),
    ...(event.authorization === undefined ? {} : { authorization: event.authorization }),
    pass: event.outcome === "diamond-attempt" ? 0 : (previous?.phase === event.phase ? previous.pass : 0) + (event.outcome === "started" ? 1 : 0),
    totalPasses: (previous?.totalPasses ?? 0) + (event.outcome === "started" ? 1 : 0),
    cleanStreak: event.outcome === "clean" || event.outcome === "clean-except-queue" ? (continuing ? previous.cleanStreak : 0) + 1
      : event.outcome === "started" && continuing ? previous.cleanStreak : 0,
    diamondAttempts: attempts + (event.outcome === "diamond-attempt" ? 1 : 0)
  }
}

export const readProgress = Effect.fn("ReviewProgress.read")(function*(runId: string) {
  const sql = yield* SqlClient.SqlClient
  const rows = yield* sql<{ readonly payload: string }>`select payload from review_progress_events where run_id = ${runId} order by revision desc limit 1`
  return rows[0] === undefined ? undefined : yield* Schema.decodeUnknownEffect(Schema.fromJsonString(Progress))(rows[0].payload)
})

export const readProgressHistory = Effect.fn("ReviewProgress.history")(function*(runId: string) {
  const sql = yield* SqlClient.SqlClient
  const events = yield* sql<{ readonly payload: string }>`select payload from review_progress_events where run_id = ${runId} order by revision`
  return yield* Effect.forEach(events, event => Schema.decodeUnknownEffect(Schema.fromJsonString(Progress))(event.payload))
})

export const recordProgress = Effect.fn("ReviewProgress.record")(function*(runId: string, input: ProgressEvent) {
  const event = yield* Schema.decodeUnknownEffect(ProgressEvent)(input)
  const sql = yield* SqlClient.SqlClient
  return yield* sql.withTransaction(Effect.gen(function*() {
    const previous = yield* readProgress(runId)
    if ((previous?.revision ?? 0) !== event.expectedRevision) return yield* new ProgressConflict({ message: "Progress changed; reload the saved state before recording another event" })
    const repairEvent = event.outcome.startsWith("repair-")
    if (!repairEvent && (event.findingId !== undefined || event.repairAttempt !== undefined || event.authorization !== undefined)) return yield* new ProgressConflict({ message: "Repair fields belong only to repair events" })
    if (repairEvent) {
      if (event.findingId === undefined || event.findingId.trim().length === 0) return yield* new ProgressConflict({ message: "Repair events require --finding-id" })
      const history = yield* readProgressHistory(runId)
      if (event.outcome === "repair-authorized") {
        if (event.authorization === undefined || event.authorization.trim().length === 0 || event.repairAttempt !== undefined) return yield* new ProgressConflict({ message: "repair-authorized requires --authorization with the owner's decision and no --repair-attempt" })
        const latestAuthorization = history.findLastIndex(saved => saved.outcome === "repair-authorized" && saved.findingId === event.findingId)
        const failures = history.slice(latestAuthorization + 1).filter(saved => saved.outcome === "repair-unsuccessful" && saved.findingId === event.findingId)
        if (failures.length < 2) return yield* new ProgressConflict({ message: "Repair authorization requires two recorded unsuccessful attempts" })
      } else {
        if (event.repairAttempt === undefined || event.repairAttempt.trim().length === 0 || event.authorization !== undefined) return yield* new ProgressConflict({ message: "Repair attempts require --repair-attempt and no --authorization" })
        const applied = history.find(saved => saved.outcome === "repair-applied" && saved.repairAttempt === event.repairAttempt)
        if (event.outcome === "repair-applied" && applied !== undefined) return yield* new ProgressConflict({ message: "Repair attempt already recorded; use its result event" })
        if (event.outcome === "repair-unsuccessful") {
          if (applied === undefined || applied.findingId !== event.findingId || applied.head !== event.head || applied.phase !== event.phase) return yield* new ProgressConflict({ message: "Unsuccessful repair requires the matching applied attempt, finding, phase and head" })
          if (history.some(saved => saved.outcome === "repair-unsuccessful" && saved.repairAttempt === event.repairAttempt)) return yield* new ProgressConflict({ message: "Unsuccessful attempt already recorded" })
        }
      }
    }
    if ((event.outcome === "clean" || event.outcome === "clean-except-queue") && (previous?.outcome !== "started" || previous.head !== event.head || previous.phase !== event.phase)) {
      return yield* new ProgressConflict({ message: "A clean result requires a distinct started pass on the same phase and head" })
    }
    if (event.outcome === "diamond-attempt" && (previous?.diamondAttempts ?? 0) >= 3) {
      return yield* new ProgressConflict({ message: "The three saved diamond attempts are exhausted" })
    }
    if (event.phase === "clawsweeper" && event.outcome === "started"
      && ((previous?.phase === "clawsweeper" && previous.pass >= 6) || (previous?.totalPasses ?? 0) >= 24)) {
      return yield* new ProgressConflict({ message: "Saved ClawSweeper convergence budget is exhausted" })
    }
    const next = advanceProgress(previous, event)
    yield* sql`insert into review_progress_events (run_id, revision, payload) values (${runId}, ${next.revision}, ${JSON.stringify(next)})`
    return next
  }))
})
