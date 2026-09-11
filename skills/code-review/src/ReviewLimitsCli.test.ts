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
  runId: Schema.optional(Schema.String),
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
  const cli = (command: string, args: ReadonlyArray<string> = [], abbreviated = false) => checkedText(process.execPath, [
    "--disable-warning=ExperimentalWarning", new URL("review-findings.ts", import.meta.url).pathname, command,
    "--db", database, "--repo", "fixture", "--repo-path", repository, "--target", "fixture", ...(abbreviated ? [] : ["--branch", "fixture", "--base", "main"]), ...args
  ])
  const progress = (revision: number, outcome: string, phase = "native", extra: ReadonlyArray<string> = []) => cli("progress-record", [
    "--head", head, "--expected-revision", String(revision), "--phase", phase, "--outcome", outcome, "--evidence", `synthetic-${phase}-${revision}`, ...extra
  ])
  const invoke = (args: ReadonlyArray<string>) => checkedText(process.execPath, ["--disable-warning=ExperimentalWarning", new URL("review-findings.ts", import.meta.url).pathname, ...args, "--db", database])
  const reviewStart = () => invoke(["review", "start", "--repo", "fixture", "--repo-path", repository, "--branch", "fixture", "--target", "fixture", "--base", "main", "--phase", "native", "--evidence", "invocation"])
  return { directory, database, repository, git, cli, progress, invoke, reviewStart }

})

layer(Layer.mergeAll(NodeServices.layer, Reactivity.layer))("review limits CLI", test => {
test.effect("CLI records a whole report with a handle, repairs only after finish, and needs no JSON input files", () => Effect.gen(function*() {
  const { cli, invoke, reviewStart, database } = yield* fixture
  yield* cli("scope-start", ["--scope-summary", "fixture", "--json"])
  const receipt = Schema.decodeUnknownSync(Schema.fromJsonString(Schema.Struct({ reviewId: Schema.String, resumed: Schema.Boolean })))
  const started = receipt(yield* reviewStart())
  assert.deepStrictEqual(receipt(yield* reviewStart()), { ...started, resumed: true })
  const handle = ["--review", started.reviewId]
  const rejected = ["--decision-id", "D1", "--status", "rejected", "--source", "fixture", "--fingerprint", "candidate", "--summary", "Unsupported candidate", "--finding-kind", "maintenance", "--fix-scope", "local", "--handling", "reject", "--rejection-gate", "reality", "--decision", "No claimed duplicate"]
  const accepted = ["--decision-id", "D2", "--source", "fixture", "--fingerprint", "owner cause", "--summary", "Fixture repair", "--finding-kind", "maintenance", "--maintenance-evidence", "Synthetic duplicate policy", "--present-cost", "Two changes for one policy", "--root-cause", "Duplicated authority", "--recommended-fix", "Use existing owner", "--intervention-justification", "Remove duplicate", "--fix-scope", "local", "--handling", "fix"]
  yield* Effect.forEach([rejected, [...accepted, "--status", "open"]], card => invoke(["record", ...handle, ...card]))
  yield* invoke(["record", ...handle, "--match-of", "D1", "--source", "second-location", "--evidence", "report", "--match-note", "Same cause"])
  const early = yield* invoke(["record", ...handle, ...accepted, "--status", "fixed"]).pipe(Effect.flip)
  assert.include(early.stderr, "Finish the complete review")
  const sql = yield* SqliteClient.make({ filename: database })
  assert.deepStrictEqual(yield* sql`select decision_id, status from issues order by decision_id`, [{ decision_id: "D1", status: "rejected" }, { decision_id: "D2", status: "open" }])
  assert.strictEqual(decode(yield* cli("progress-status")).revision, 1)
  yield* invoke(["review", "finish", ...handle, "--outcome", "findings", "--evidence", "complete report"])
  yield* invoke(["review", "finish", ...handle, "--outcome", "findings", "--evidence", "complete report"])
  yield* invoke(["record", ...handle, ...accepted, "--status", "provisional"])
  yield* invoke(["record", ...handle, ...accepted, "--status", "reopened", "--decision", "Owner declines this provisional repair"])
  assert.deepStrictEqual(yield* sql`select status from issues where decision_id = 'D2'`, [{ status: "reopened" }])
  yield* invoke(["record", ...handle, ...accepted.map(value => value === "D2" ? "NEW" : value), "--status", "reopened", "--decision", "Not an existing provisional repair"]).pipe(Effect.flip)
  assert.lengthOf(yield* sql`select id from issues where decision_id = 'NEW'`, 0)
  const inventedRepair = yield* invoke(["record", ...handle, ...accepted.map(value => value === "D2" ? "NEW-FIX" : value), "--status", "fixed"]).pipe(Effect.flip)
  assert.include(inventedRepair.stderr, "existing finding")
  assert.lengthOf(yield* sql`select id from issues where decision_id = 'NEW-FIX'`, 0)
  for (const patch of ["patch-1", "patch-2"]) {
    yield* invoke(["progress-record", ...handle, "--outcome", "repair-applied", "--finding-id", "D2", "--repair-attempt", patch, "--evidence", patch])
    yield* invoke(["progress-record", ...handle, "--outcome", "repair-unsuccessful", "--finding-id", "D2", "--repair-attempt", patch, "--evidence", "verification failed"])
  }
  const third = yield* invoke(["progress-record", ...handle, "--outcome", "repair-applied", "--finding-id", "D2", "--repair-attempt", "patch-3", "--evidence", "third patch"]).pipe(Effect.flip)
  assert.include(third.stderr, "owner authorization")
  const prematureFixed = yield* invoke(["record", ...handle, ...accepted, "--status", "fixed"]).pipe(Effect.flip)
  assert.include(prematureFixed.stderr, "owner authorization")
  assert.strictEqual(decode(yield* cli("progress-status")).revision, 6)
  yield* invoke(["progress-record", ...handle, "--outcome", "repair-authorized", "--finding-id", "D2", "--authorization", "Owner approves another attempt", "--evidence", "owner decision"])
  yield* invoke(["progress-record", ...handle, "--outcome", "repair-applied", "--finding-id", "D2", "--repair-attempt", "patch-3", "--evidence", "verified patch"])
  yield* invoke(["record", ...handle, ...accepted, "--status", "fixed"])
  assert.strictEqual(decode(yield* cli("progress-status")).revision, 8)
  assert.deepStrictEqual(yield* sql`select status from issues where decision_id = 'D2'`, [{ status: "fixed" }])
  assert.lengthOf(yield* sql`select * from review_finding_matches`, 1)
}).pipe(Effect.scoped), { timeout: 60000 })

test.effect("native command reviews the full historical range once and exposes its saved report", () => Effect.gen(function*() {
  const { cli, invoke, directory, repository, reviewStart, database, git } = yield* fixture
  const fs = yield* FileSystem.FileSystem
  yield* fs.writeFileString(`${repository}/second.txt`, "second commit\n")
  yield* git(["add", "second.txt"])
  yield* git(["-c", "core.hooksPath=/dev/null", "commit", "-m", "second"])
  const historicalHead = yield* git(["rev-parse", "HEAD"])
  yield* fs.writeFileString(`${repository}/later.txt`, "later commit\n")
  yield* git(["add", "later.txt"])
  yield* git(["-c", "core.hooksPath=/dev/null", "commit", "-m", "later"])
  const worktrees = yield* git(["worktree", "list", "--porcelain"])
  const reviewer = `${directory}/reviewer`
  const calls = `${directory}/calls`
  yield* fs.writeFileString(reviewer, `#!/bin/sh
case " $* " in
  *" review "*) printf 'review\\n' >> "${calls}"; printf 'No findings\\n'; git diff --name-only main...HEAD ;;
  *) exit 0 ;;
esac
`)
  yield* fs.chmod(reviewer, 0o700)
  yield* cli("scope-start", ["--scope-summary", "fixture", "--head", historicalHead, "--json"])
  const args = ["review", "native", "--repo", "fixture", "--repo-path", repository, "--branch", "fixture", "--target", "fixture", "--base", "main", "--codex-bin", reviewer]
  const launched = yield* invoke(args)
  const Receipt = Schema.fromJsonString(Schema.Struct({ reviewId: Schema.String, launched: Schema.Boolean, report: Schema.String }))
  const first = Schema.decodeUnknownSync(Receipt)(launched.split("\n")[0] ?? "")
  assert.strictEqual(first.launched, true)
  assert.include(yield* fs.readFileString(first.report), "No findings")
  assert.include(yield* fs.readFileString(first.report), "sample.txt")
  assert.include(yield* fs.readFileString(first.report), "second.txt")
  assert.notInclude(yield* fs.readFileString(first.report), "later.txt")
  assert.strictEqual(yield* git(["worktree", "list", "--porcelain"]), worktrees)
  const second = Schema.decodeUnknownSync(Receipt)((yield* invoke(args)).trim())
  assert.strictEqual(second.reviewId, first.reviewId)
  assert.strictEqual(second.launched, false)
  assert.strictEqual(yield* fs.readFileString(calls), "review\n")
  assert.strictEqual(decode(yield* cli("progress-status")).revision, 1)
  yield* invoke(["review", "finish", "--review", first.reviewId, "--outcome", "clean", "--evidence", first.report])
  const reserved = Schema.decodeUnknownSync(Schema.fromJsonString(Schema.Struct({ reviewId: Schema.String })))(yield* reviewStart())
  const external = Schema.decodeUnknownSync(Receipt)((yield* invoke(args)).trim())
  assert.strictEqual(external.reviewId, reserved.reviewId)
  assert.strictEqual(external.launched, false)
  assert.strictEqual(yield* fs.readFileString(calls), "review\n")
  yield* invoke(["review", "finish", "--review", reserved.reviewId, "--outcome", "blocked", "--evidence", "External invocation cancelled"])
  yield* fs.writeFileString(reviewer, "#!/bin/sh\nprintf 'review unavailable\n' >&2\nexit 9\n")
  const failed = yield* invoke(args).pipe(Effect.flip)
  assert.include(failed.stderr, "review unavailable")
  const sql = yield* SqliteClient.make({ filename: database })
  const latest = (yield* sql<{ readonly id: string }>`select id from review_invocations order by start_revision desc limit 1`)[0]
  if (latest === undefined) return assert.fail("Failed launch must remain inspectable")
  const status = Schema.decodeUnknownSync(Schema.fromJsonString(Schema.Struct({ status: Schema.String })))(yield* invoke(["review", "status", "--review", latest.id]))
  assert.strictEqual(status.status, "blocked")
}).pipe(Effect.scoped), { timeout: 60000 })

test.effect("old handles cannot write evidence into a new run with the same identity", () => Effect.gen(function*() {
  const { cli, invoke, reviewStart, database } = yield* fixture
  const scopeFlags = ["--scope-summary", "fixture", "--native-clean-target", "1", "--required-phase", "native", "--require-current-head", "--json"]
  yield* cli("scope-start", scopeFlags)
  const first = Schema.decodeUnknownSync(Schema.fromJsonString(Schema.Struct({ reviewId: Schema.String })))(yield* reviewStart())
  yield* invoke(["review", "finish", "--review", first.reviewId, "--outcome", "clean", "--evidence", "complete result"])
  yield* cli("scope-complete", ["--reason", "complete", "--json"])
  yield* cli("scope-start", scopeFlags)
  const denied = yield* invoke(["record-command", "--review", first.reviewId, "--command", "check", "--result", "pass", "--reason", "old evidence"]).pipe(Effect.flip)
  assert.include(denied.stderr, "different review run")
  const sql = yield* SqliteClient.make({ filename: database })
  assert.lengthOf(yield* sql`select id from commands`, 0)
}).pipe(Effect.scoped), { timeout: 60000 })

test.effect("CLI extends an expired existing run with a replayable receipt and preserves its history", () => Effect.gen(function*() {
  const { cli, progress, database } = yield* fixture
  const requestFlags = ["--request-id", "authorized-resume", "--additional-seconds", "7200", "--authorization", "Owner explicitly approves continuing the existing run"]
  const missing = yield* cli("budget-extend", ["--run-id", "missing", ...requestFlags]).pipe(Effect.flip)
  assert.notStrictEqual(missing.exitCode, 0)
  const started = decode(yield* cli("scope-start", ["--scope-summary", "fixture", "--native-clean-target", "1", "--required-phase", "native", "--required-phase", "cold", "--require-current-head", "--json"]))
  const request = ["--run-id", started.runId ?? "", ...requestFlags]
  yield* progress(0, "started")
  yield* progress(1, "clean")
  const sql = yield* SqliteClient.make({ filename: database })
  yield* sql`update review_runs set started_at = started_at - 28800`
  const before = yield* sql`select * from review_runs`
  const scopeBefore = yield* sql`select * from review_scope_budgets`
  const tables = yield* sql<{ readonly name: string }>`select name from sqlite_master where type = 'table' order by name`
  const beforeWrongRun = yield* Effect.forEach(tables, table => sql.unsafe(`select * from "${table.name}"`))
  const wrongRun = yield* cli("budget-extend", ["--run-id", "earlier-run", ...requestFlags]).pipe(Effect.flip)
  assert.include(wrongRun.stderr, "different review run")
  assert.deepStrictEqual(yield* Effect.forEach(tables, table => sql.unsafe(`select * from "${table.name}"`)), beforeWrongRun)
  const expired = yield* progress(2, "started", "cold").pipe(Effect.flip)
  assert.include(expired.stderr, "TIME_EXPIRED")
  const receiptSchema = Schema.fromJsonString(Schema.Struct({ requestId: Schema.String, oldDeadline: Schema.Number, newDeadline: Schema.Number, replayed: Schema.Boolean }))
  const first = Schema.decodeUnknownSync(receiptSchema)(yield* cli("budget-extend", request))
  assert.strictEqual(first.newDeadline - first.oldDeadline, 7200)
  assert.strictEqual(first.replayed, false)
  const replay = Schema.decodeUnknownSync(receiptSchema)(yield* cli("budget-extend", request))
  assert.deepStrictEqual(replay, { ...first, replayed: true })
  const changed = yield* cli("budget-extend", ["--run-id", started.runId ?? "", "--request-id", "authorized-resume", "--additional-seconds", "3600", "--authorization", "Different authorization"]).pipe(Effect.flip)
  assert.include(changed.stderr, "immutable")
  const noAuthority = yield* cli("budget-extend", ["--run-id", started.runId ?? "", "--request-id", "new", "--additional-seconds", "3600"]).pipe(Effect.flip)
  assert.notStrictEqual(noAuthority.exitCode, 0)
  assert.deepStrictEqual(yield* sql`select * from review_runs`, before)
  assert.deepStrictEqual(yield* sql`select * from review_scope_budgets`, scopeBefore)
  assert.lengthOf(yield* sql`select * from review_budget_extensions`, 1)
  const status = decode(yield* cli("progress-status"))
  assert.strictEqual(status.revision, 2)
  const samePhase = yield* progress(2, "started").pipe(Effect.flip)
  assert.include(samePhase.stderr, "PHASE_TARGET_MET")
  assert.strictEqual(decode(yield* progress(2, "started", "cold")).revision, 3)
}).pipe(Effect.scoped), { timeout: 60000 })

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
  const extended = decode(yield* cli("budget-extend", ["--run-id", baseline.runId ?? "", "--request-id", "more-time", "--additional-seconds", "3600", "--authorization", "Owner approved more review time only"]))
  assert.include(extended.limits.stoppingReasons, "REPAIR_CONSULT_REQUIRED")
  assert.strictEqual(extended.limits.startedAt, baseline.limits.startedAt)
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
  yield* fs.writeFileString(`${repository}/sample.txt`, "changed\nextra\nanother\n")
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
