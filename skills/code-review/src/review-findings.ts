import { NodeRuntime, NodeServices } from "@effect/platform-node"
import * as SqliteClient from "@effect/sql-sqlite-node/SqliteClient"
import { Cause, Console, Effect, FileSystem, Layer, Option, Path } from "effect"
import { Argument, Command, Flag } from "effect/unstable/cli"
import { buildCloseout, initialize, MissingReviewRun, printCloseout, printQueryResults, pruneFindings, queryFindings, recordCommand, recordFinding, type ReviewRun } from "./ReviewFindings.ts"
import { ChildProcess, ChildProcessSpawner } from "effect/unstable/process"

// Environment defaults are resolved once at the CLI boundary before effects run.
// @effect-diagnostics-next-line processEnv:off
const defaultDb = () => process.env.AGENT_REVIEW_FINDINGS_DB ?? `${process.env.HOME ?? "."}/.local/state/agent-review-findings/reviews.sqlite`
const db = Flag.string("db").pipe(Flag.withDefault(defaultDb()))
const optionalString = (name: string) => Flag.optional(Flag.string(name))
const commonRun = {
  repo: Flag.string("repo"), repoPath: Flag.string("repo-path"), branch: Flag.string("branch").pipe(Flag.withDefault("")),
  target: Flag.string("target"), base: Flag.string("base").pipe(Flag.withDefault("")), head: Flag.string("head").pipe(Flag.withDefault(""))
}
const toRun = (args: typeof commonRun extends infer _ ? { readonly repo: string; readonly repoPath: string; readonly branch: string; readonly target: string; readonly base: string; readonly head: string } : never): ReviewRun => ({ ...args, status: "active", decisionLog: "" })
const withDb = <A, E, R>(path: string, effect: Effect.Effect<A, E, R>) => {
  return Effect.gen(function*() {
    const fs = yield* FileSystem.FileSystem
    const paths = yield* Path.Path
    yield* fs.makeDirectory(paths.dirname(path), { recursive: true })
    // Dynamic database selection is the application boundary for this command.
    // @effect-diagnostics-next-line strictEffectProvide:off
    return yield* effect.pipe(Effect.provide(SqliteClient.layer({ filename: path })))
  })
}

const init = Command.make("init", { db }, ({ db }) => withDb(db, initialize()).pipe(Effect.andThen(Console.log(db))))
const pathCommand = Command.make("path", { db }, ({ db }) => Console.log(db))
const record = Command.make("record", {
  db, ...commonRun, runStatus: Flag.string("run-status").pipe(Flag.withDefault("active")), decisionLog: Flag.string("decision-log").pipe(Flag.withDefault("")),
  decisionId: Flag.string("decision-id"), status: Flag.string("status"), source: Flag.string("source"), fingerprint: Flag.string("fingerprint"), summary: Flag.string("summary"),
  impact: Flag.string("impact").pipe(Flag.withDefault("")), priority: Flag.string("priority").pipe(Flag.withDefault("")), material: Flag.boolean("material"),
  userImpact: Flag.string("user-impact").pipe(Flag.withDefault("")), decision: Flag.string("decision").pipe(Flag.withDefault("")), text: Flag.string("text").pipe(Flag.withDefault(""))
}, (args) => withDb(args.db, Effect.gen(function*() {
  yield* initialize()
  const result = yield* recordFinding({ ...toRun(args), status: args.runStatus, decisionLog: args.decisionLog }, args)
  yield* Console.log(`recorded run=${result.runId} issue=${result.issueId} decision=${args.decisionId} db=${args.db}`)
})))
const recordCommandCli = Command.make("record-command", {
  db, ...commonRun, command: Flag.string("command"), result: Flag.string("result"), reason: Flag.string("reason"), decisionId: Flag.string("decision-id").pipe(Flag.withDefault(""))
}, (args) => withDb(args.db, Effect.gen(function*() {
  yield* initialize()
  const result = yield* recordCommand(toRun(args), args)
  yield* Console.log(`recorded command=${result.commandId} run=${result.runId} db=${args.db}`)
})))
const closeout = Command.make("closeout", {
  db, repo: Flag.string("repo"), repoPath: optionalString("repo-path"), branch: optionalString("branch"), target: optionalString("target"), base: optionalString("base"), material: Flag.boolean("material"), json: Flag.boolean("json")
}, (args) => withDb(args.db, Effect.gen(function*() {
  yield* initialize()
  const closeout = yield* buildCloseout({ repo: args.repo, ...(Option.isSome(args.repoPath) ? { repoPath: args.repoPath.value } : {}), ...(Option.isSome(args.branch) ? { branch: args.branch.value } : {}), ...(Option.isSome(args.target) ? { target: args.target.value } : {}), ...(Option.isSome(args.base) ? { base: args.base.value } : {}) })
  yield* printCloseout(closeout, args.json, args.material)
})))
const inferGit = Effect.fn("ReviewFindings.inferGit")(function*(args: ReadonlyArray<string>) {
  const spawner = yield* ChildProcessSpawner.ChildProcessSpawner
  return yield* spawner.string(ChildProcess.make("git", args)).pipe(Effect.map((output) => output.trim()), Effect.option)
})
const query = Command.make("query", {
  db, query: Argument.string("query"), limit: Flag.integer("limit").pipe(Flag.withDefault(8)), repo: optionalString("repo"), repoPath: optionalString("repo-path"), branch: optionalString("branch"), target: optionalString("target"),
  allRepos: Flag.boolean("all-repos"), allBranches: Flag.boolean("all-branches"), status: optionalString("status"), showPaths: Flag.boolean("show-paths"), json: Flag.boolean("json")
}, (args) => withDb(args.db, Effect.gen(function*() {
  yield* initialize()
  const root = yield* inferGit(["rev-parse", "--show-toplevel"])
  const inferredRepo = Option.map(root, (value) => value.split("/").at(-1) ?? value)
  const inferredBranch = yield* inferGit(["branch", "--show-current"])
  const repo = args.allRepos ? Option.getOrUndefined(args.repo) : Option.getOrUndefined(Option.orElse(args.repo, () => inferredRepo))
  const branch = args.allBranches ? Option.getOrUndefined(args.branch) : Option.getOrUndefined(Option.orElse(args.branch, () => inferredBranch))
  const results = yield* queryFindings(args.query, { limit: args.limit, ...(repo === undefined ? {} : { repo }), ...(Option.isSome(args.repoPath) ? { repoPath: args.repoPath.value } : {}), ...(branch === undefined ? {} : { branch }), ...(Option.isSome(args.target) ? { target: args.target.value } : {}), ...(Option.isSome(args.status) ? { status: args.status.value } : {}) })
  yield* printQueryResults(results, args.json, args.showPaths)
})))
const prune = Command.make("prune", {
  db, olderThanDays: Flag.float("older-than-days").pipe(Flag.withDefault(90)), minSeenCount: Flag.integer("min-seen-count").pipe(Flag.withDefault(1)), repo: optionalString("repo"), repoPath: optionalString("repo-path"), branch: optionalString("branch"), includeOpen: Flag.boolean("include-open"), dryRun: Flag.boolean("dry-run")
}, (args) => withDb(args.db, Effect.gen(function*() {
  yield* initialize()
  const count = yield* pruneFindings({ olderThanDays: args.olderThanDays, minSeenCount: args.minSeenCount, ...(Option.isSome(args.repo) ? { repo: args.repo.value } : {}), ...(Option.isSome(args.repoPath) ? { repoPath: args.repoPath.value } : {}), ...(Option.isSome(args.branch) ? { branch: args.branch.value } : {}), includeOpen: args.includeOpen, dryRun: args.dryRun })
  yield* Console.log(`${args.dryRun ? "would prune" : "pruned"} findings=${count} db=${args.db}`)
})))

const command = Command.make("review-findings").pipe(Command.withDescription("Local SQLite registry for review findings"), Command.withSubcommands([init, record, recordCommandCli, query, closeout, prune, pathCommand]))
const Live = Layer.mergeAll(NodeServices.layer)
command.pipe(Command.run({ version: "2.0.0" }),
  // @effect-diagnostics-next-line strictEffectProvide:off
  Effect.provide(Live), Effect.tapError((error) => error instanceof MissingReviewRun ? Console.error(error.message) : Effect.void), Effect.tapCause((cause) => {
  const error = Cause.squash(cause)
  return error instanceof MissingReviewRun ? Console.error(error.message) : Effect.void
}), NodeRuntime.runMain({ disableErrorReporting: true }))
