import { NodeServices } from "@effect/platform-node"
import * as SqliteClient from "@effect/sql-sqlite-node/SqliteClient"
import { assert, layer } from "@effect/vitest"
import * as Effect from "effect/Effect"
import * as FileSystem from "effect/FileSystem"
import * as Layer from "effect/Layer"
import * as Path from "effect/Path"
import * as Schema from "effect/Schema"
import * as Stream from "effect/Stream"
import { ChildProcess, ChildProcessSpawner } from "effect/unstable/process"
import * as Reactivity from "effect/unstable/reactivity/Reactivity"

import { checkedText, checkedTrimmedText } from "../../../packages/effect-cli/CheckedProcess.ts"

const Output = Schema.fromJsonString(Schema.Struct({
  runId: Schema.optional(Schema.String),
  reviewId: Schema.optional(Schema.String),
  revision: Schema.optional(Schema.Number),
  status: Schema.optional(Schema.String),
  blocked: Schema.optional(Schema.Boolean),
  launched: Schema.optional(Schema.Boolean),
  report: Schema.optional(Schema.String),
  diagnosticWarnings: Schema.optional(Schema.Array(Schema.String)),
  resumed: Schema.optional(Schema.Boolean),
  identity: Schema.optional(Schema.Struct({ runId: Schema.String, repo: Schema.String, repoPath: Schema.String, branch: Schema.String, target: Schema.String, base: Schema.String, head: Schema.String })),
  scope: Schema.optional(Schema.Struct({ status: Schema.String, resumed: Schema.Boolean })),
  recording: Schema.optional(Schema.Struct({ schemaVersion: Schema.Number, command: Schema.String, matchCommand: Schema.String, schemaCommand: Schema.String })),
  limits: Schema.Struct({
    runId: Schema.String,
    consultCap: Schema.Number,
    openQuestionCount: Schema.Number,
    cleanTargets: Schema.Struct({ native: Schema.Number, cold: Schema.Number, clawsweeper: Schema.Number }),
    incompletePhases: Schema.Array(Schema.String),
    diagnosticWarnings: Schema.Array(Schema.String),
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
  const reviewStart = (extra: ReadonlyArray<string> = []) => invoke(["review", "start", "--repo", "fixture", "--repo-path", repository, "--branch", "fixture", "--target", "fixture", "--base", "main", "--phase", "native", "--evidence", "invocation", ...extra])
  return { directory, database, repository, git, cli, progress, invoke, reviewStart }

})

layer(Layer.mergeAll(NodeServices.layer, Reactivity.layer))("review limits CLI", test => {
test.effect("scope record commands reject checkout-local databases before creating them", () => Effect.gen(function*() {
  const { repository } = yield* fixture
  const fs = yield* FileSystem.FileSystem
  const database = `${repository}/reviews.sqlite`
  const identities = [
    ["--repo", "fixture", "--repo-path", repository, "--branch", "fixture", "--target", "fixture", "--base", "main"],
    ["--review", "unknown"]
  ]
  for (const identity of identities) {
    for (const command of [
      ["progress-record", "--expected-revision", "0", "--phase", "native", "--outcome", "started", "--evidence", "fixture"],
      ["coverage-record", "--review-id", "fixture", "--reviewer", "fixture", "--file", "sample.txt", "--change-id", "fixture"]
    ]) {
      yield* checkedText(process.execPath, [new URL("review-findings.ts", import.meta.url).pathname, ...command, "--db", database, ...identity]).pipe(Effect.flip)
      assert.isFalse(yield* fs.exists(database))
    }
  }
}).pipe(Effect.scoped), { timeout: 30000 })

for (const changeHead of [false, true]) {
test.effect(`native diagnostics survive successful output and changed target=${changeHead}`, () => Effect.gen(function*() {
  const { cli, directory, database, repository, git } = yield* fixture
  const fs = yield* FileSystem.FileSystem
  const home = `${directory}/codex-home`
  const day = new Date().toISOString().slice(0, 10).replaceAll("-", "/")
  const sessions = `${home}/sessions/${day}`
  const session = `${sessions}/rollout-fixture.jsonl`
  const reviewSession = `${sessions}/rollout-review.jsonl`
  yield* fs.makeDirectory(sessions, { recursive: true })
  const cwd = yield* fs.realPath(repository)
  yield* fs.writeFileString(session, JSON.stringify({ type: "session_meta", payload: { id: "fixture-session", cwd, source: "exec" } }) + "\n")
  yield* fs.writeFileString(reviewSession, JSON.stringify({ type: "session_meta", payload: { id: "fixture-review", cwd, source: { subagent: "review" }, parent_thread_id: "fixture-session" } }) + "\n")
  const calls = `${directory}/calls`
  const reviewer = `${directory}/reviewer`
  yield* fs.writeFileString(reviewer, `#!/bin/sh
case " $* " in
  *" review "*)
    touch "${session}" "${reviewSession}"
    printf 'review\\n' >> "${calls}"
    printf 'Original review output\\n'
    ${changeHead ? 'git -c core.hooksPath=/dev/null commit --allow-empty -m moved >/dev/null' : ':'}
    ;;
  *" archive "*) exit 9 ;;
  *) exit 0 ;;
esac
`)
  yield* fs.chmod(reviewer, 0o700)
  yield* cli("scope-start", ["--scope-summary", "fixture", "--json"])
  yield* fs.writeFileString(`${repository}/sample.txt`, "changed\nextra\nanother\n")
  yield* git(["-c", "core.hooksPath=/dev/null", "commit", "-am", "native growth diagnostic"])
  const spawner = yield* ChildProcessSpawner.ChildProcessSpawner
  const runNative = Effect.gen(function*() {
    const child = yield* spawner.spawn(ChildProcess.make(process.execPath, [
      new URL("review-findings.ts", import.meta.url).pathname, "review", "native", "--db", database,
      "--repo", "fixture", "--repo-path", repository, "--branch", "fixture", "--target", "fixture", "--base", "main", "--codex-bin", reviewer
    ], { env: { CODEX_HOME: home }, extendEnv: true }))
    return yield* Effect.all({ code: child.exitCode, stdout: Stream.mkString(Stream.decodeText(child.stdout)), stderr: Stream.mkString(Stream.decodeText(child.stderr)) }, { concurrency: "unbounded" })
  })
  const result = yield* runNative
  assert.strictEqual(result.code === 0, !changeHead, result.stderr + result.stdout)
  assert.include(result.stderr, "could not archive review session fixture-session")
  assert.strictEqual(yield* fs.readFileString(calls), "review\n")
  const responses = result.stdout.split("\n").filter(line => line.startsWith("{")).map(line => decode(line))
  const first = responses[0]
  if (first?.reviewId === undefined || first.report === undefined) return assert.fail("Native launch must return its review ID and report")
  assert.strictEqual(first.launched, true)
  assert.deepStrictEqual(first.limits.diagnosticWarnings, ["DIFF_GROWTH_EXCEEDED"])
  assert.deepStrictEqual(first.limits.stoppingReasons, [])
  assert.include(yield* fs.readFileString(first.report), "Original review output")
  if (changeHead) {
    const sql = yield* SqliteClient.make({ filename: database })
    assert.deepStrictEqual(yield* sql`select status from review_invocations`, [{ status: "blocked" }])
  } else {
    const awaiting = responses[1]
    if (awaiting === undefined) return assert.fail("Completed native launch must return its awaiting-findings status")
    assert.strictEqual(awaiting.status, "awaiting-findings")
    assert.deepStrictEqual(awaiting.limits.diagnosticWarnings, ["DIFF_GROWTH_EXCEEDED"])
    const resumed = yield* runNative
    assert.strictEqual(resumed.code, 0, resumed.stderr + resumed.stdout)
    const resumedResponse = decode(resumed.stdout.trim())
    assert.strictEqual(resumedResponse.reviewId, first.reviewId)
    assert.strictEqual(resumedResponse.launched, false)
    assert.deepStrictEqual(resumedResponse.limits.diagnosticWarnings, ["DIFF_GROWTH_EXCEEDED"])
    assert.strictEqual(yield* fs.readFileString(calls), "review\n")
  }
}).pipe(Effect.scoped), { timeout: 60000 })
}

test.effect("CLI records a whole report with a handle, repairs only after finish, and needs no JSON input files", () => Effect.gen(function*() {
  const { cli, invoke, reviewStart, database } = yield* fixture
  yield* cli("scope-start", ["--scope-summary", "fixture", "--json"])
  const receipt = Schema.decodeUnknownSync(Schema.fromJsonString(Schema.Struct({ reviewId: Schema.String, resumed: Schema.Boolean })))
  const started = receipt(yield* reviewStart())
  assert.deepStrictEqual(receipt(yield* reviewStart()), { ...started, resumed: true })
  const handle = ["--review", started.reviewId]
  const rejected = ["--decision-id", "D1", "--status", "rejected", "--source", "fixture", "--fingerprint", "candidate", "--summary", "Unsupported candidate", "--finding-kind", "maintenance", "--fix-scope", "local", "--handling", "reject", "--rejection-gate", "reality", "--decision", "No claimed duplicate"]
  const files = Schema.decodeUnknownSync(Schema.fromJsonString(Schema.Array(Schema.Struct({ path: Schema.String, changeId: Schema.String }))))(yield* cli("coverage-status", ["--json"]))
  for (const file of files) yield* invoke(["coverage-record", ...handle, "--reviewer", "fixture", "--file", file.path, "--change-id", file.changeId])
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

test.effect("managed review start initializes once and resumes with its identity and recording contract", () => Effect.gen(function*() {
  const { invoke, reviewStart, repository, database } = yield* fixture
  const started = decode(yield* reviewStart(["--scope-summary", "fixture review", "--native-clean-target", "1", "--cold-clean-target", "3", "--required-phase", "native", "--required-phase", "cold", "--require-current-head"]))
  if (started.reviewId === undefined || started.runId === undefined || started.identity === undefined || started.scope === undefined || started.recording === undefined) {
    return assert.fail("Managed review start must return reusable review context")
  }
  assert.deepStrictEqual(started.identity, { runId: started.runId, repo: "fixture", repoPath: repository, branch: "fixture", target: "fixture", base: "main", head: started.identity.head })
  assert.deepStrictEqual(started.scope, { status: "ok", resumed: false })
  assert.strictEqual(started.recording.schemaVersion, 8)
  assert.strictEqual(started.recording.command, `review-findings record --review ${started.reviewId}`)
  assert.include(started.recording.matchCommand, `--review ${started.reviewId} --match-of`)
  assert.strictEqual(started.recording.schemaCommand, "review-findings schema")
  assert.deepStrictEqual(started.limits.cleanTargets, { native: 1, cold: 3, clawsweeper: 2 })
  assert.deepStrictEqual(started.limits.incompletePhases, ["native", "cold"])
  assert.deepStrictEqual(started.limits.stoppingReasons, [])
  const sql = yield* SqliteClient.make({ filename: database })
  const persisted = yield* sql`select review_runs.id, review_invocations.evidence, review_run_limits.settings from review_runs join review_invocations on review_invocations.run_id = review_runs.id join review_run_limits on review_run_limits.run_id = review_runs.id`
  const resumed = decode(yield* reviewStart())
  assert.strictEqual(resumed.reviewId, started.reviewId)
  assert.strictEqual(resumed.runId, started.runId)
  assert.strictEqual(resumed.resumed, true)
  assert.deepStrictEqual(resumed.scope, { status: "ok", resumed: true })
  assert.deepStrictEqual(resumed.limits.cleanTargets, started.limits.cleanTargets)
  assert.deepStrictEqual(yield* sql`select review_runs.id, review_invocations.evidence, review_run_limits.settings from review_runs join review_invocations on review_invocations.run_id = review_runs.id join review_run_limits on review_run_limits.run_id = review_runs.id`, persisted)
  const status = decode(yield* invoke(["review", "status", "--review", started.reviewId]))
  assert.deepStrictEqual(status.identity, started.identity)
  assert.deepStrictEqual(status.recording, started.recording)
  const finished = decode(yield* invoke(["review", "finish", "--review", started.reviewId, "--outcome", "blocked", "--evidence", "fixture close"]))
  assert.strictEqual(finished.runId, started.runId)
}).pipe(Effect.scoped), { timeout: 60000 })

test.effect("managed review responses expose persisted growth diagnostics", () => Effect.gen(function*() {
  const { cli, invoke, reviewStart, repository, git } = yield* fixture
  yield* cli("scope-start", ["--scope-summary", "fixture", "--json"])
  const fs = yield* FileSystem.FileSystem
  yield* fs.writeFileString(`${repository}/sample.txt`, "changed\nextra\nanother\n")
  yield* git(["-c", "core.hooksPath=/dev/null", "commit", "-am", "managed review growth"])
  const started = decode(yield* reviewStart())
  if (started.reviewId === undefined) return assert.fail("Managed review start must return its review ID")
  assert.deepStrictEqual(started.limits.diagnosticWarnings, ["DIFF_GROWTH_EXCEEDED"])
  assert.deepStrictEqual(started.limits.stoppingReasons, [])
  const resumed = decode(yield* reviewStart())
  assert.strictEqual(resumed.reviewId, started.reviewId)
  assert.deepStrictEqual(resumed.limits.diagnosticWarnings, ["DIFF_GROWTH_EXCEEDED"])
  const status = decode(yield* invoke(["review", "status", "--review", started.reviewId]))
  assert.deepStrictEqual(status.limits.diagnosticWarnings, ["DIFF_GROWTH_EXCEEDED"])
  const finished = decode(yield* invoke(["review", "finish", "--review", started.reviewId, "--outcome", "blocked", "--evidence", "fixture close"]))
  assert.deepStrictEqual(finished.limits.diagnosticWarnings, ["DIFF_GROWTH_EXCEEDED"])
}).pipe(Effect.scoped), { timeout: 60000 })

test.effect("managed review start rejects a dirty checkout without stranding scope state", () => Effect.gen(function*() {
  const { reviewStart, repository, database } = yield* fixture
  const fs = yield* FileSystem.FileSystem
  yield* fs.writeFileString(`${repository}/untracked.txt`, "not part of the review\n")
  const rejected = yield* reviewStart().pipe(Effect.flip)
  assert.include(rejected.stderr, "clean committed worktree")
  const sql = yield* SqliteClient.make({ filename: database })
  assert.lengthOf(yield* sql`select id from review_runs`, 0)
  assert.lengthOf(yield* sql`select run_id from review_scope_budgets`, 0)
  assert.lengthOf(yield* sql`select id from review_invocations`, 0)
}).pipe(Effect.scoped), { timeout: 60000 })

test.effect("record errors show the accepted shape and do not write an invalid finding", () => Effect.gen(function*() {
  const { reviewStart, invoke, database } = yield* fixture
  const started = decode(yield* reviewStart())
  if (started.reviewId === undefined) return assert.fail("Managed review start must return its review ID")
  const rejected = yield* invoke(["record", "--review", started.reviewId, "--decision-id", "D1", "--status", "open", "--source", "fixture", "--fingerprint", "unsupported candidate", "--summary", "Unsupported candidate",
    "--finding-kind", "maintenance", "--maintenance-evidence", "A duplicate owner exists", "--present-cost", "Every change updates two owners",
    "--fix-scope", "local", "--handling", "reject", "--rejection-gate", "reality", "--decision", "The repair is disproportionate to the current cost"]).pipe(Effect.flip)
  assert.include(rejected.stderr, "disposition reject cannot use status open")
  assert.include(rejected.stderr, "accepted shape: --status rejected --handling reject --rejection-gate <reality|importance|contract|repair|duplicate> --decision <rationale>")
  assert.include(rejected.stderr, "--maintenance-evidence <current evidence> --present-cost <current cost>; omit repair fields")
  assert.include(rejected.stderr, "full contract: review-findings schema")
  const mixedKinds = yield* invoke(["record", "--review", started.reviewId, "--decision-id", "D2", "--status", "open", "--source", "fixture", "--fingerprint", "maintenance candidate", "--summary", "Maintenance candidate",
    "--finding-kind", "maintenance", "--likelihood", "unknown", "--maintenance-evidence", "Duplicate owner exists", "--present-cost", "Every change updates two owners",
    "--root-cause", "Duplicated ownership", "--recommended-fix", "Use the existing owner", "--intervention-justification", "Remove duplicated change cost", "--fix-scope", "local", "--handling", "fix"]).pipe(Effect.flip)
  assert.include(mixedKinds.stderr, "maintenance findings must omit runtime risk field --likelihood")
  assert.include(mixedKinds.stderr, "accepted shape: --status open --handling fix --root-cause")
  assert.include(mixedKinds.stderr, "--maintenance-evidence <current evidence> --present-cost <current cost>")
  assert.notInclude(mixedKinds.stderr, "runtime path")
  const sql = yield* SqliteClient.make({ filename: database })
  assert.lengthOf(yield* sql`select id from issues`, 0)
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
  const reviewCwd = `${directory}/review-cwd`
  yield* fs.writeFileString(reviewer, `#!/bin/sh
case " $* " in
  *" review "*) pwd > "${reviewCwd}"; printf 'review\\n' >> "${calls}"; printf 'No findings\\n'; git diff --name-only main...HEAD ;;
  *) exit 0 ;;
esac
`)
  yield* fs.chmod(reviewer, 0o700)
  const args = ["review", "native", "--repo", "fixture", "--repo-path", repository, "--branch", "fixture", "--target", "fixture", "--base", "main", "--head", historicalHead, "--scope-summary", "fixture", "--codex-bin", reviewer]
  const launched = yield* invoke(args)
  const Receipt = Schema.fromJsonString(Schema.Struct({ reviewId: Schema.String, launched: Schema.Boolean, report: Schema.String }))
  const first = Schema.decodeUnknownSync(Receipt)(launched.split("\n")[0] ?? "")
  assert.strictEqual(first.launched, true)
  assert.include(yield* fs.readFileString(first.report), "No findings")
  assert.include(yield* fs.readFileString(first.report), "sample.txt")
  assert.include(yield* fs.readFileString(first.report), "second.txt")
  assert.notInclude(yield* fs.readFileString(first.report), "later.txt")
  assert.strictEqual(yield* git(["worktree", "list", "--porcelain"]), worktrees)
  const paths = yield* Path.Path
  assert.isFalse(yield* fs.exists(paths.dirname((yield* fs.readFileString(reviewCwd)).trim())))
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
  assert.include(failed.message, "review unavailable")
  const sql = yield* SqliteClient.make({ filename: database })
  const latest = (yield* sql<{ readonly id: string }>`select id from review_invocations order by start_revision desc limit 1`)[0]
  if (latest === undefined) return assert.fail("Failed launch must remain inspectable")
  const status = Schema.decodeUnknownSync(Schema.fromJsonString(Schema.Struct({ status: Schema.String })))(yield* invoke(["review", "status", "--review", latest.id]))
  assert.strictEqual(status.status, "blocked")
}).pipe(Effect.scoped), { timeout: 60000 })

test.effect("old handles cannot write evidence into a new run with the same identity", () => Effect.gen(function*() {
  const { cli, invoke, reviewStart, database } = yield* fixture
  const scopeFlags = ["--scope-summary", "fixture", "--native-clean-target", "1", "--required-phase", "native", "--require-current-head", "--json"]
  const firstScope = decode(yield* cli("scope-start", scopeFlags))
  if (firstScope.runId === undefined) return assert.fail("First scope must return its run ID")
  const first = decode(yield* reviewStart())
  if (first.reviewId === undefined) return assert.fail("Review start must return its review ID")
  const finished = decode(yield* invoke(["review", "finish", "--review", first.reviewId, "--outcome", "clean", "--evidence", "complete result"]))
  assert.strictEqual(finished.limits.runId, firstScope.runId)
  yield* cli("scope-complete", ["--reason", "complete", "--json"])
  const secondScope = decode(yield* cli("scope-start", scopeFlags))
  assert.notStrictEqual(secondScope.runId, firstScope.runId)
  const oldStatus = decode(yield* invoke(["review", "status", "--review", first.reviewId]))
  assert.strictEqual(oldStatus.status, "finished")
  assert.strictEqual(oldStatus.limits.runId, firstScope.runId)
  const replay = decode(yield* invoke(["review", "finish", "--review", first.reviewId, "--outcome", "clean", "--evidence", "complete result"]))
  assert.strictEqual(replay.status, "finished")
  assert.strictEqual(replay.limits.runId, firstScope.runId)
  const denied = yield* invoke(["record-command", "--review", first.reviewId, "--command", "check", "--result", "pass", "--reason", "old evidence"]).pipe(Effect.flip)
  assert.include(denied.stderr, "different review run")
  const sql = yield* SqliteClient.make({ filename: database })
  assert.lengthOf(yield* sql`select id from commands`, 0)
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

test.effect("CLI stops at the consult cap, appends matches once, and accepts owner decisions", () => Effect.gen(function*() {
  const { cli, progress } = yield* fixture
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
  const resolved = decode(yield* cli("record", [...card, "--status", "fixed", "--owner-resolution", "approved", "--decision", "Keep the fixture repair", "--json"]))
  assert.strictEqual(resolved.limits.openQuestionCount, 0)
  assert.strictEqual(resolved.limits.cleanTargets.cold, 3)
  const terminalMatch = yield* cli("record", ["--match-of", "D1", "--source", "fixture-pass3", "--match-note", "Same cause", "--evidence", "synthetic-pass3"]).pipe(Effect.flip)
  assert.include(terminalMatch.stderr, "existing open finding")
  yield* cli("record-command", ["--command", "fixture-check", "--result", "passed", "--reason", "late result"])
}).pipe(Effect.scoped), { timeout: 60000 })

test.effect("CLI gates evidenced repair failures and accepts a scoped owner decision without resetting limits", () => Effect.gen(function*() {
  const { cli, progress } = yield* fixture
  yield* cli("scope-start", ["--scope-summary", "fixture", "--json"])
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
  assert.strictEqual(authorized.limits.consultCap, 5)
  yield* progress(5, "started")
}).pipe(Effect.scoped), { timeout: 60000 })

test.effect("CLI reports diff growth as a diagnostic and starts review without scope authorization", () => Effect.gen(function*() {
  const { cli, repository, git } = yield* fixture
  yield* cli("scope-start", ["--scope-summary", "fixture", "--json"])
  const fs = yield* FileSystem.FileSystem
  yield* fs.writeFileString(`${repository}/sample.txt`, "changed\nextra\nanother\n")
  yield* git(["-c", "core.hooksPath=/dev/null", "commit", "-am", "synthetic scope expansion"])
  const head = yield* git(["rev-parse", "HEAD"])
  const startArgs = ["--head", head, "--expected-revision", "0", "--phase", "native", "--outcome", "started", "--evidence", "synthetic pass"]
  const check = decode(yield* cli("scope-check", ["--reason", "inspect whether the expanded approach remains coherent", "--json"]))
  assert.strictEqual(check.status, "ok")
  assert.strictEqual(check.blocked, false)
  assert.deepStrictEqual(check.diagnosticWarnings, ["DIFF_GROWTH_EXCEEDED"])
  assert.deepStrictEqual(check.limits.diagnosticWarnings, ["DIFF_GROWTH_EXCEEDED"])
  assert.notInclude(check.limits.stoppingReasons, "DIFF_GROWTH_EXCEEDED")
  assert.strictEqual(decode(yield* cli("progress-record", startArgs)).revision, 1)
}).pipe(Effect.scoped), { timeout: 60000 })

test.effect("CLI records explicitly approved same-base scope updates independently of growth warnings", () => Effect.gen(function*() {
  const { cli, repository, git } = yield* fixture
  yield* cli("scope-start", ["--scope-summary", "fixture", "--json"])
  const approvedBaseline = yield* cli("scope-authorize", ["--authorization", "Owner explicitly approves the current fixture", "--scope-summary", "approved fixture"])
  assert.include(approvedBaseline, "SCOPE BUDGET READY")
  assert.include(approvedBaseline, "scope=approved fixture")
  assert.include(approvedBaseline, "authorization=Owner explicitly approves the current fixture")
  const fs = yield* FileSystem.FileSystem
  yield* fs.writeFileString(`${repository}/sample.txt`, "changed\nextra\nanother\n")
  yield* git(["-c", "core.hooksPath=/dev/null", "commit", "-am", "synthetic scope expansion"])
  yield* cli("scope-check", ["--reason", "inspect the coherent scope expansion", "--json"])
  const authorized = yield* cli("scope-authorize", ["--authorization", "Owner explicitly approves the expanded fixture", "--scope-summary", "expanded fixture"])
  assert.include(authorized, "SCOPE BUDGET READY")
  assert.include(authorized, "baseline=4 current=4 growth=0 allowed-growth=2 maximum=6")
  assert.include(authorized, "scope=expanded fixture")
  assert.include(authorized, "authorization=Owner explicitly approves the expanded fixture")
}).pipe(Effect.scoped), { timeout: 60000 })
})
