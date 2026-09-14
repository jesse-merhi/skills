import * as SqliteClient from "@effect/sql-sqlite-node/SqliteClient"
import { assert, layer } from "@effect/vitest"
import * as Effect from "effect/Effect"
import * as SqlClient from "effect/unstable/sql/SqlClient"

import { type ProgressEvent, readProgress, recordProgress } from "./ReviewProgress.ts"

layer(SqliteClient.layer({ filename: ":memory:" }))("review progress", test => {
test.effect("persists distinct passes, rejects stale writes and resets clean counts across heads", () => Effect.gen(function*() {
  const sql = yield* SqlClient.SqlClient
  yield* sql`create table if not exists review_progress_events (run_id text, revision integer, payload text, primary key(run_id, revision))`
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
  assert.strictEqual((yield* sql`select * from review_progress_events where run_id = 'run'`).length, 3)
}))

test.effect("keeps each phase's pass and clean streak when another phase starts in between", () => Effect.gen(function*() {
  const sql = yield* SqlClient.SqlClient
  yield* sql`create table if not exists review_progress_events (run_id text, revision integer, payload text, primary key(run_id, revision))`
  const native = { expectedRevision: 0, phase: "native", head: "head-a", outcome: "started", evidence: "synthetic exercise" } satisfies ProgressEvent
  yield* recordProgress("interleaved", native)
  const firstClean = yield* recordProgress("interleaved", { ...native, expectedRevision: 1, outcome: "clean" })
  assert.strictEqual(firstClean.cleanStreak, 1)
  yield* recordProgress("interleaved", { ...native, expectedRevision: 2 })
  const cold = yield* recordProgress("interleaved", { ...native, expectedRevision: 3, phase: "cold" })
  assert.strictEqual(cold.pass, 1)
  assert.strictEqual(cold.cleanStreak, 0)
  const secondClean = yield* recordProgress("interleaved", { ...native, expectedRevision: 4, outcome: "clean" })
  assert.strictEqual(secondClean.revision, 5)
  assert.strictEqual(secondClean.pass, 2)
  assert.strictEqual(secondClean.cleanStreak, 2)
  assert.strictEqual(secondClean.totalPasses, 3)
  const coldClean = yield* recordProgress("interleaved", { ...native, expectedRevision: 5, phase: "cold", outcome: "clean" })
  assert.strictEqual(coldClean.cleanStreak, 1)
  const unstarted = yield* recordProgress("interleaved", { ...native, expectedRevision: 6, outcome: "clean" }).pipe(Effect.exit)
  assert.strictEqual(unstarted._tag, "Failure")
}))

test.effect("counts ClawSweeper passes across an interleaved native start so the six-pass cap still fires", () => Effect.gen(function*() {
  const sql = yield* SqlClient.SqlClient
  yield* sql`create table if not exists review_progress_events (run_id text, revision integer, payload text, primary key(run_id, revision))`
  const claws = { expectedRevision: 0, phase: "clawsweeper", head: "head-a", outcome: "started", evidence: "synthetic exercise" } satisfies ProgressEvent
  for (let revision = 0; revision < 6; revision++) yield* recordProgress("claws", { ...claws, expectedRevision: revision })
  const native = yield* recordProgress("claws", { ...claws, expectedRevision: 6, phase: "native" })
  assert.strictEqual(native.pass, 1)
  const exhausted = yield* recordProgress("claws", { ...claws, expectedRevision: 7 }).pipe(Effect.exit)
  assert.strictEqual(exhausted._tag, "Failure")
  assert.strictEqual((yield* sql`select * from review_progress_events where run_id = 'claws'`).length, 7)
}))
})
