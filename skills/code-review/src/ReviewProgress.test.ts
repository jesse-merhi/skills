import * as SqliteClient from "@effect/sql-sqlite-node/SqliteClient"
import { assert, layer } from "@effect/vitest"
import * as Effect from "effect/Effect"
import * as SqlClient from "effect/unstable/sql/SqlClient"

import { type ProgressEvent, readProgress, recordProgress } from "./ReviewProgress.ts"

layer(SqliteClient.layer({ filename: ":memory:" }))("review progress", test => {
test.effect("persists distinct passes, rejects stale writes and resets clean counts across heads", () => Effect.gen(function*() {
  const sql = yield* SqlClient.SqlClient
  yield* sql`create table if not exists review_progress_events (run_id text, revision integer, payload text, primary key(run_id, revision))`
  yield* sql`delete from review_progress_events`
  const input = { expectedRevision: 0, phase: "native", head: "head-a", outcome: "started", evidence: "synthetic exercise" } satisfies ProgressEvent
  const started = yield* recordProgress("run", input)
  const clean = yield* recordProgress("run", { ...input, expectedRevision: started.revision, outcome: "clean" })
  assert.strictEqual(clean.cleanStreak, 1)
  const stale = yield* recordProgress("run", input).pipe(Effect.exit)
  assert.strictEqual(stale._tag, "Failure")
  const duplicate = yield* recordProgress("run", { ...input, expectedRevision: clean.revision, outcome: "clean" }).pipe(Effect.exit)
  assert.strictEqual(duplicate._tag, "Failure")
  const next = yield* recordProgress("run", { ...input, expectedRevision: clean.revision, head: "head-b" })
  assert.strictEqual(next.cleanStreak, 0)
  assert.strictEqual(next.pass, 2)
  assert.deepStrictEqual(yield* readProgress("run"), next)
  assert.strictEqual((yield* sql`select * from review_progress_events`).length, 3)
}))

test.effect("requires an evidenced diagnosis and changed approach after two failed repairs", () => Effect.gen(function*() {
  const sql = yield* SqlClient.SqlClient
  yield* sql`create table if not exists review_progress_events (run_id text, revision integer, payload text, primary key(run_id, revision))`
  yield* sql`delete from review_progress_events`
  const repair = { expectedRevision: 0, phase: "native", head: "head-a", outcome: "repair-applied", evidence: "patch one", findingId: "D1", repairAttempt: "patch-1" } satisfies ProgressEvent
  yield* recordProgress("run", repair)
  yield* recordProgress("run", { ...repair, expectedRevision: 1, outcome: "repair-unsuccessful", evidence: "first verification failure" })
  yield* recordProgress("run", { ...repair, expectedRevision: 2, repairAttempt: "patch-2", evidence: "patch two" })
  yield* recordProgress("run", { ...repair, expectedRevision: 3, repairAttempt: "patch-2", outcome: "repair-unsuccessful", evidence: "second verification failure" })

  const missingApproach = yield* recordProgress("run", {
    ...repair, expectedRevision: 4, outcome: "repair-replanned", repairAttempt: undefined,
    diagnosis: "Both patches changed the parser after validation"
  }).pipe(Effect.flip)
  assert.include(missingApproach.message, "--diagnosis and --changed-approach")
  const repeatedClaim = yield* recordProgress("run", {
    ...repair, expectedRevision: 4, outcome: "repair-replanned", repairAttempt: undefined,
    diagnosis: "The repair changed the wrong boundary", changedApproach: "The repair changed the wrong boundary"
  }).pipe(Effect.flip)
  assert.include(repeatedClaim.message, "distinct")

  const replanned = yield* recordProgress("run", {
    ...repair, expectedRevision: 4, outcome: "repair-replanned", repairAttempt: undefined,
    evidence: "trace from the failing entry point", diagnosis: "Both patches changed the parser after validation",
    changedApproach: "Move the correction into the validated input adapter",
    authorization: "Owner authorized the newly required dependency"
  })
  assert.strictEqual(replanned.diagnosis, "Both patches changed the parser after validation")
  assert.strictEqual(replanned.changedApproach, "Move the correction into the validated input adapter")
  assert.strictEqual(replanned.authorization, "Owner authorized the newly required dependency")
}))

test.effect("reads legacy repair authorization events without exposing them as new outcomes", () => Effect.gen(function*() {
  const sql = yield* SqlClient.SqlClient
  yield* sql`create table if not exists review_progress_events (run_id text, revision integer, payload text, primary key(run_id, revision))`
  yield* sql`delete from review_progress_events`
  const legacy = {
    revision: 1, phase: "native", head: "head-a", pass: 0, totalPasses: 0, cleanStreak: 0, diamondAttempts: 0,
    outcome: "repair-authorized", evidence: "historical owner decision", findingId: "D1", authorization: "Owner approved"
  } as const
  yield* sql`insert into review_progress_events (run_id, revision, payload) values ('run', 1, ${JSON.stringify(legacy)})`
  assert.deepStrictEqual(yield* readProgress("run"), legacy)
}))
})
