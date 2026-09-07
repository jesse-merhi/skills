import { NodeServices } from "@effect/platform-node"
import * as SqliteClient from "@effect/sql-sqlite-node/SqliteClient"
import { assert, layer } from "@effect/vitest"
import * as Effect from "effect/Effect"
import * as Layer from "effect/Layer"
import * as SqlClient from "effect/unstable/sql/SqlClient"

import { initialize } from "./ReviewFindings.ts"
import { checkReviewLimits, freezeReviewLimits, readReviewLimits } from "./ReviewLimits.ts"
import { type ProgressEvent, recordProgress } from "./ReviewProgress.ts"

const database = Layer.mergeAll(NodeServices.layer, SqliteClient.layer({ filename: ":memory:" }))
const setup = Effect.gen(function*() {
  yield* initialize()
  const sql = yield* SqlClient.SqlClient
  yield* sql`delete from review_runs`
  yield* sql`insert into review_runs (id, repo_name, repo_key, repo_path, branch, target, base, head, status, updated_at, started_at)
    values ('run', 'fixture', '/fixture', '/fixture', 'feature', 'target', 'main', 'head-a', 'active', 0, 0)`
})
const start = { expectedRevision: 0, phase: "native", head: "head-a", outcome: "started", evidence: "synthetic result reference" } satisfies ProgressEvent

layer(database)("review limits", test => {
test.effect("freezes defaults and explicit limits without granting time on resume", () => Effect.gen(function*() {
  yield* setup
  yield* freezeReviewLimits("run", { timeBudgetHours: 2, consultCap: 3, coldCleanTarget: 4 })
  yield* freezeReviewLimits("run", { timeBudgetHours: 8, consultCap: 5, coldCleanTarget: 1 })
  const report = yield* readReviewLimits("run", "head-a")
  assert.strictEqual(report.timeBudgetSeconds, 7200)
  assert.strictEqual(report.startedAt, 0)
  assert.strictEqual(report.remainingSeconds, 7200)
  assert.strictEqual(report.consultCap, 3)
  assert.deepStrictEqual(report.cleanTargets, { native: 2, cold: 4, clawsweeper: 2 })
}))

test.effect("expiry gates work but allows the started pass result to be saved", () => Effect.gen(function*() {
  yield* setup
  yield* freezeReviewLimits("run", {})
  yield* recordProgress("run", start)
  const sql = yield* SqlClient.SqlClient
  yield* sql`update review_runs set started_at = -28800 where id = 'run'`
  const report = yield* readReviewLimits("run", "head-a", "native")
  assert.strictEqual(report.remainingSeconds, 0)
  assert.include(report.stoppingReasons, "TIME_EXPIRED")
  const denied = yield* checkReviewLimits(report).pipe(Effect.flip)
  assert.strictEqual(denied._tag, "ReviewLimitsBlocked")
  const clean = yield* recordProgress("run", { ...start, expectedRevision: 1, outcome: "clean" })
  assert.strictEqual(clean.cleanStreak, 1)
}))

test.effect("counts consults and provisional repairs once, excluding resolved and follow-up work", () => Effect.gen(function*() {
  yield* setup
  const sql = yield* SqlClient.SqlClient
  for (const finding of [
    { id: "consult", status: "open", disposition: "consult", resolution: "" },
    { id: "provisional", status: "provisional", disposition: "accept", resolution: "" },
    { id: "declined", status: "deferred", disposition: "consult", resolution: "declined" },
    { id: "later", status: "deferred", disposition: "follow-up", resolution: "" }
  ]) {
    yield* sql`insert into issues (id, run_id, decision_id, status, source, fingerprint, summary, decision, text, disposition, owner_resolution, updated_at)
      values (${finding.id}, 'run', ${finding.id}, ${finding.status}, 'fixture', ${finding.id}, 'Fixture question', 'Choose a repair', '', ${finding.disposition}, ${finding.resolution}, 0)`
  }
  yield* freezeReviewLimits("run", { consultCap: 2 })
  const report = yield* readReviewLimits("run", "head-a")
  assert.deepStrictEqual(report.openQuestions.map(question => question.decisionId), ["consult", "provisional"])
  assert.include(report.stoppingReasons, "CONSULT_CAP_REACHED")
}))

test.effect("keeps phase targets and unchanged fixed points despite reset events", () => Effect.gen(function*() {
  yield* setup
  yield* freezeReviewLimits("run", {})
  yield* recordProgress("run", start)
  yield* recordProgress("run", { ...start, expectedRevision: 1, outcome: "clean" })
  yield* recordProgress("run", { ...start, expectedRevision: 2 })
  yield* recordProgress("run", { ...start, expectedRevision: 3, outcome: "clean" })
  yield* recordProgress("run", { ...start, expectedRevision: 4, outcome: "reset" })
  const same = yield* readReviewLimits("run", "head-a", "native")
  assert.include(same.stoppingReasons, "PHASE_TARGET_MET")
  const changed = yield* readReviewLimits("run", "head-b", "native")
  assert.notInclude(changed.stoppingReasons, "PHASE_TARGET_MET")
  assert.deepStrictEqual(changed.incompletePhases, ["native"])
}))

test.effect("queue fixed points block phase switching below the consult cap until decisions resolve", () => Effect.gen(function*() {
  yield* setup
  yield* freezeReviewLimits("run", {})
  const sql = yield* SqlClient.SqlClient
  yield* sql`insert into issues (id, run_id, decision_id, status, source, fingerprint, summary, decision, text, disposition, updated_at)
    values ('question', 'run', 'D1', 'open', 'fixture', 'owner cause', 'Fixture question', 'Choose a repair', '', 'consult', 0)`
  yield* recordProgress("run", { ...start, phase: "cold" })
  yield* recordProgress("run", { ...start, phase: "cold", expectedRevision: 1, outcome: "clean-except-queue" })
  const report = yield* readReviewLimits("run", "head-a", "native")
  assert.strictEqual(report.consultCap, 5)
  assert.include(report.stoppingReasons, "QUEUE_FIXED_POINT")
  assert.notInclude(report.stoppingReasons, "CONSULT_CAP_REACHED")
  assert.deepStrictEqual(report.incompletePhases, [])
  yield* sql`update issues set status = 'rejected', owner_resolution = 'declined' where id = 'question'`
  const resolved = yield* readReviewLimits("run", "head-a", "native")
  assert.strictEqual(resolved.allowed, true)
  assert.deepStrictEqual(resolved.incompletePhases, [])
}))

test.effect("migration retains the original timestamp and freezes defaults only once", () => Effect.gen(function*() {
  yield* setup
  yield* freezeReviewLimits("run", { timeBudgetHours: 1, consultCap: 4, coldCleanTarget: 2 })
  const sql = yield* SqlClient.SqlClient
  yield* sql`update review_runs set started_at = -100 where id = 'run'`
  yield* initialize()
  const report = yield* readReviewLimits("run", "head-a")
  assert.strictEqual(report.startedAt, -100)
  assert.strictEqual(report.remainingSeconds, 3500)
  assert.strictEqual(report.consultCap, 4)
  assert.strictEqual(report.cleanTargets.cold, 2)
}))

test.effect("counts evidenced failed repairs, not review passes, and resumes only after an owner decision", () => Effect.gen(function*() {
  yield* setup
  yield* freezeReviewLimits("run", {})
  const sql = yield* SqlClient.SqlClient
  yield* sql`insert into issues (id, run_id, decision_id, status, source, fingerprint, summary, decision, text, disposition, updated_at)
    values ('repair', 'run', 'D1', 'open', 'fixture', 'owning cause', 'Fixture failure', 'Repair', '', 'accept', 0)`
  const applied = { ...start, findingId: "D1", repairAttempt: "patch-1", outcome: "repair-applied", evidence: "synthetic patch reference" } as const
  const unbacked = yield* recordProgress("run", { ...applied, outcome: "repair-unsuccessful" }).pipe(Effect.flip)
  assert.include(unbacked.message, "applied")
  yield* recordProgress("run", applied)
  yield* recordProgress("run", { ...applied, expectedRevision: 1, outcome: "repair-unsuccessful", evidence: "synthetic failing verification" })
  const duplicate = yield* recordProgress("run", { ...applied, expectedRevision: 2, outcome: "repair-unsuccessful" }).pipe(Effect.flip)
  assert.include(duplicate.message, "already")
  yield* recordProgress("run", { ...start, expectedRevision: 2 })
  yield* recordProgress("run", { ...start, expectedRevision: 3, outcome: "findings" })
  assert.notInclude((yield* readReviewLimits("run", "head-a")).stoppingReasons, "REPAIR_CONSULT_REQUIRED")
  yield* recordProgress("run", { ...applied, expectedRevision: 4, repairAttempt: "patch-2" })
  yield* recordProgress("run", { ...applied, expectedRevision: 5, repairAttempt: "patch-2", outcome: "repair-unsuccessful" })
  const report = yield* readReviewLimits("run", "head-a")
  assert.include(report.stoppingReasons, "REPAIR_CONSULT_REQUIRED")
  assert.strictEqual(report.repairAttempts[0]?.unsuccessfulAttempts, 2)
  const unauthorized = yield* recordProgress("run", { ...start, expectedRevision: 6, outcome: "repair-authorized", findingId: "D1" }).pipe(Effect.flip)
  assert.include(unauthorized.message, "authorization")
  yield* recordProgress("run", { ...start, expectedRevision: 6, outcome: "repair-authorized", findingId: "D1", authorization: "Owner approves another contained attempt" })
  const resumed = yield* readReviewLimits("run", "head-a")
  assert.notInclude(resumed.stoppingReasons, "REPAIR_CONSULT_REQUIRED")
  assert.strictEqual(resumed.remainingSeconds, 28800)
}))
})
