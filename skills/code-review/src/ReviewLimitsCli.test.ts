import { NodeServices } from "@effect/platform-node"
import * as SqliteClient from "@effect/sql-sqlite-node/SqliteClient"
import { assert, layer } from "@effect/vitest"
import * as Effect from "effect/Effect"
import * as FileSystem from "effect/FileSystem"
import * as Layer from "effect/Layer"
import * as Schema from "effect/Schema"
import * as Reactivity from "effect/unstable/reactivity/Reactivity"

import { checkedText, checkedTrimmedText } from "../../../packages/effect-cli/CheckedProcess.ts"

const Output = Schema.fromJsonString(Schema.Struct({
  revision: Schema.optional(Schema.Number),
  status: Schema.optional(Schema.String),
  limits: Schema.Struct({
    startedAt: Schema.Number,
    remainingSeconds: Schema.Number,
    consultCap: Schema.Number,
    openQuestionCount: Schema.Number,
    cleanTargets: Schema.Struct({ native: Schema.Number, cold: Schema.Number, clawsweeper: Schema.Number }),
    stoppingReasons: Schema.Array(Schema.String)
  })
}))
const decode = Schema.decodeUnknownSync(Output)
const fixture = Effect.gen(function*() {
  const fs = yield* FileSystem.FileSystem
  const directory = yield* fs.makeTempDirectoryScoped({ prefix: "review-limits-cli." })
  const repository = `${directory}/repo`
  yield* fs.makeDirectory(repository)
  const git = (args: ReadonlyArray<string>) => checkedTrimmedText("git", args, { cwd: repository })
  yield* git(["init", "-b", "main"])
  yield* git(["config", "user.email", "fixture@example.invalid"])
  yield* git(["config", "user.name", "Fixture"])
  yield* fs.writeFileString(`${repository}/sample.txt`, "base\n")
  yield* git(["add", "sample.txt"])
  yield* git(["-c", "core.hooksPath=/dev/null", "commit", "-m", "fixture base"])
  yield* git(["switch", "-c", "fixture"])
  yield* fs.writeFileString(`${repository}/sample.txt`, "changed\n")
  yield* git(["-c", "core.hooksPath=/dev/null", "commit", "-am", "fixture change"])
  const head = yield* git(["rev-parse", "HEAD"])
  const database = `${directory}/reviews.sqlite`
  const cli = (command: string, args: ReadonlyArray<string> = []) => checkedText(process.execPath, [
    "--disable-warning=ExperimentalWarning", new URL("review-findings.ts", import.meta.url).pathname, command,
    "--db", database, "--repo", "fixture", "--repo-path", repository, "--branch", "fixture", "--target", "fixture", "--base", "main", ...args
  ])
  const progress = (revision: number, outcome: string, phase = "native", extra: ReadonlyArray<string> = []) => cli("progress-record", [
    "--head", head, "--expected-revision", String(revision), "--phase", phase, "--outcome", outcome, "--evidence", `synthetic-${phase}-${revision}`, ...extra
  ])
  return { directory, database, repository, git, cli, progress }
})

layer(Layer.mergeAll(NodeServices.layer, Reactivity.layer))("review limits CLI", test => {
test.effect("CLI preserves native2/cold1/claws2, prevents completion bypass and unchanged reruns", () => Effect.gen(function*() {
  const { cli, progress } = yield* fixture
  const invalid = yield* cli("scope-start", ["--scope-summary", "fixture", "--consult-cap", "0", "--json"]).pipe(Effect.flip)
  assert.notStrictEqual(invalid.exitCode, 0)
  const started = decode(yield* cli("scope-start", ["--scope-summary", "fixture", "--json"]))
  assert.deepStrictEqual(started.limits.cleanTargets, { native: 2, cold: 1, clawsweeper: 2 })
  assert.strictEqual(decode(yield* cli("progress-status")).revision, 0)
  yield* progress(0, "started")
  yield* cli("record", ["--decision-id", "R1", "--status", "rejected", "--source", "fixture", "--fingerprint", "unsupported fixture candidate", "--summary", "Unsupported candidate",
    "--finding-kind", "maintenance", "--fix-scope", "local", "--handling", "reject", "--rejection-gate", "reality", "--decision", "Synthetic inspection found no claimed duplicate"])
  yield* progress(1, "clean")
  yield* cli("scope-check", ["--reason", "fixture", "--json"])
  const incomplete = yield* cli("scope-complete", ["--reason", "fixture", "--json"]).pipe(Effect.flip)
  assert.include(incomplete.stderr, "PHASE_TARGET_NOT_MET")
  assert.strictEqual(decode(yield* cli("scope-status", ["--json"])).status, "ok")
  yield* progress(2, "started")
  yield* progress(3, "clean")
  const stopped = yield* progress(4, "started").pipe(Effect.flip)
  assert.include(stopped.stderr, "PHASE_TARGET_MET")
  assert.strictEqual(decode(yield* cli("progress-status")).revision, 4)
  yield* progress(4, "started", "cold")
  yield* progress(5, "clean", "cold")
  yield* progress(6, "started", "clawsweeper")
  yield* progress(7, "clean", "clawsweeper")
  const clawsIncomplete = yield* cli("scope-complete", ["--reason", "fixture", "--json"]).pipe(Effect.flip)
  assert.include(clawsIncomplete.stderr, "PHASE_TARGET_NOT_MET")
  yield* progress(8, "started", "clawsweeper")
  yield* progress(9, "clean", "clawsweeper")
  const completed = decode(yield* cli("scope-complete", ["--reason", "fixture", "--json"]))
  assert.strictEqual(completed.status, "complete")
  const terminal = yield* progress(10, "reset").pipe(Effect.flip)
  assert.include(terminal.stderr, "immutable")
}).pipe(Effect.scoped), { timeout: 60000 })

test.effect("CLI stops at the consult cap, appends matches once, and accepts owner decisions after expiry", () => Effect.gen(function*() {
  const { cli, progress, database } = yield* fixture
  yield* cli("scope-start", ["--scope-summary", "fixture", "--consult-cap", "1", "--cold-clean-target", "3", "--json"])
  yield* progress(0, "started")
  const card = ["--decision-id", "D1", "--source", "fixture", "--fingerprint", "sample owner repeated policy", "--summary", "Fixture issue",
    "--finding-kind", "maintenance", "--maintenance-evidence", "Synthetic duplicate policy", "--present-cost", "Synthetic change cost", "--root-cause", "Synthetic shared cause",
    "--recommended-fix", "Synthetic owning repair", "--intervention-justification", "Synthetic removal cost", "--fix-scope", "local", "--handling", "fix"]
  const provisional = decode(yield* cli("record", [...card, "--status", "provisional", "--decision", "Keep or revert?", "--json"]))
  assert.strictEqual(provisional.limits.openQuestionCount, 1)
  assert.include(provisional.limits.stoppingReasons, "CONSULT_CAP_REACHED")
  const falseClean = yield* progress(1, "clean").pipe(Effect.flip)
  assert.include(falseClean.stderr, "cannot leave active findings")
  yield* progress(1, "clean-except-queue")
  const match = ["--match-of", "D1", "--source", "fixture-pass2", "--match-note", "Same owning cause", "--evidence", "synthetic-pass2", "--json"]
  yield* cli("record", match)
  yield* cli("record", match)
  const changedMatch = yield* cli("record", ["--match-of", "D1", "--source", "fixture-pass2", "--match-note", "Changed history", "--evidence", "synthetic-pass2"]).pipe(Effect.flip)
  assert.include(changedMatch.stderr, "immutable")
  const report = Schema.decodeUnknownSync(Schema.fromJsonString(Schema.Struct({ finding_matches: Schema.Array(Schema.Struct({ decision_id: Schema.String, evidence: Schema.String })) })))(yield* cli("closeout", ["--json"]))
  assert.deepStrictEqual(report.finding_matches, [{ decision_id: "D1", evidence: "synthetic-pass2" }])
  const blocked = yield* progress(2, "started").pipe(Effect.flip)
  assert.include(blocked.stderr, "CONSULT_CAP_REACHED")
  assert.strictEqual(decode(yield* cli("progress-status")).revision, 2)
  const sql = yield* SqliteClient.make({ filename: database })
  yield* sql`update review_runs set started_at = started_at - 28800`
  const resolved = decode(yield* cli("record", [...card, "--status", "fixed", "--owner-resolution", "approved", "--decision", "Keep the fixture repair", "--json"]))
  assert.strictEqual(resolved.limits.openQuestionCount, 0)
  assert.strictEqual(resolved.limits.remainingSeconds, 0)
  assert.strictEqual(resolved.limits.cleanTargets.cold, 3)
  const terminalMatch = yield* cli("record", ["--match-of", "D1", "--source", "fixture-pass3", "--match-note", "Same cause", "--evidence", "synthetic-pass3"]).pipe(Effect.flip)
  assert.include(terminalMatch.stderr, "existing open finding")
  const expired = yield* cli("scope-check", ["--reason", "fixture", "--json"]).pipe(Effect.flip)
  assert.include(expired.stderr, "TIME_EXPIRED")
  const next = yield* progress(2, "started").pipe(Effect.flip)
  assert.include(next.stderr, "TIME_EXPIRED")
  yield* cli("record-command", ["--command", "fixture-check", "--result", "passed", "--reason", "late result"])
}).pipe(Effect.scoped), { timeout: 60000 })

test.effect("CLI records a completed result after expiry without permitting a further start", () => Effect.gen(function*() {
  const { cli, progress, database } = yield* fixture
  yield* cli("scope-start", ["--scope-summary", "fixture", "--json"])
  yield* progress(0, "started")
  const sql = yield* SqliteClient.make({ filename: database })
  yield* sql`update review_runs set started_at = started_at - 28800`
  const finished = decode(yield* progress(1, "clean"))
  assert.strictEqual(finished.revision, 2)
  assert.include(finished.limits.stoppingReasons, "TIME_EXPIRED")
  const stopped = yield* progress(2, "started").pipe(Effect.flip)
  assert.include(stopped.stderr, "TIME_EXPIRED")
  assert.strictEqual(decode(yield* cli("progress-status")).revision, 2)
}).pipe(Effect.scoped), { timeout: 60000 })

test.effect("CLI gates evidenced repair failures and accepts a scoped owner decision without resetting limits", () => Effect.gen(function*() {
  const { cli, progress } = yield* fixture
  const baseline = decode(yield* cli("scope-start", ["--scope-summary", "fixture", "--json"]))
  yield* cli("record", ["--decision-id", "D1", "--source", "fixture", "--fingerprint", "owner cause", "--summary", "Fixture repair",
    "--finding-kind", "maintenance", "--maintenance-evidence", "Synthetic duplicate policy", "--present-cost", "Synthetic change cost", "--root-cause", "Synthetic shared cause",
    "--recommended-fix", "Synthetic owning repair", "--intervention-justification", "Synthetic removal cost", "--fix-scope", "local", "--handling", "fix", "--status", "open"])
  const attempt1 = ["--finding-id", "D1", "--repair-attempt", "D1-1"]
  const attempt2 = ["--finding-id", "D1", "--repair-attempt", "D1-2"]
  yield* progress(0, "repair-applied", "native", attempt1)
  yield* progress(1, "repair-unsuccessful", "native", attempt1)
  yield* progress(2, "repair-applied", "native", attempt2)
  const failed = decode(yield* progress(3, "repair-unsuccessful", "native", attempt2))
  assert.include(failed.limits.stoppingReasons, "REPAIR_CONSULT_REQUIRED")
  const stopped = yield* progress(4, "started").pipe(Effect.flip)
  assert.include(stopped.stderr, "REPAIR_CONSULT_REQUIRED")
  const scopeStopped = yield* cli("scope-check", ["--reason", "fixture", "--json"]).pipe(Effect.flip)
  assert.include(scopeStopped.stderr, "REPAIR_CONSULT_REQUIRED")
  const authorized = decode(yield* progress(4, "repair-authorized", "native", ["--finding-id", "D1", "--authorization", "Owner approves the next scoped attempt"]))
  assert.notInclude(authorized.limits.stoppingReasons, "REPAIR_CONSULT_REQUIRED")
  assert.strictEqual(authorized.limits.startedAt, baseline.limits.startedAt)
  assert.strictEqual(authorized.limits.consultCap, 5)
  yield* progress(5, "started")
}).pipe(Effect.scoped), { timeout: 60000 })

test.effect("a start's failed diff measurement persists the scope block for explicit authorization", () => Effect.gen(function*() {
  const { cli, repository, git } = yield* fixture
  yield* cli("scope-start", ["--scope-summary", "fixture", "--json"])
  const fs = yield* FileSystem.FileSystem
  yield* fs.writeFileString(`${repository}/sample.txt`, "changed\nextra\n")
  yield* git(["-c", "core.hooksPath=/dev/null", "commit", "-am", "synthetic scope expansion"])
  const head = yield* git(["rev-parse", "HEAD"])
  const startArgs = ["--head", head, "--expected-revision", "0", "--phase", "native", "--outcome", "started", "--evidence", "synthetic pass"]
  const stopped = yield* cli("progress-record", startArgs).pipe(Effect.flip)
  assert.include(stopped.stderr, "DIFF_GROWTH_EXCEEDED")
  assert.strictEqual(decode(yield* cli("scope-status", ["--json"])).status, "blocked")
  assert.strictEqual(decode(yield* cli("progress-status")).revision, 0)
  yield* cli("scope-authorize", ["--authorization", "Owner approves fixture expansion", "--scope-summary", "expanded fixture"])
  assert.strictEqual(decode(yield* cli("progress-record", startArgs)).revision, 1)
}).pipe(Effect.scoped), { timeout: 60000 })
})
