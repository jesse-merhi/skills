import * as SqliteClient from "@effect/sql-sqlite-node/SqliteClient"
import { assert, layer } from "@effect/vitest"
import * as Effect from "effect/Effect"
import * as SqlClient from "effect/unstable/sql/SqlClient"

import { type ProgressEvent, readProgress, recordProgress } from "./ReviewProgress.ts"

layer(SqliteClient.layer({ filename: ":memory:" }))("review progress", test => {
test.effect("persists distinct passes, rejects stale writes and resets clean counts across heads", () => Effect.gen(function*() {
  const sql = yield* SqlClient.SqlClient
  yield* sql`create table review_progress_events (run_id text, revision integer, payload text, primary key(run_id, revision))`
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
})
