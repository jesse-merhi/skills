import { NodeRuntime, NodeServices } from "@effect/platform-node"
import * as SqliteClient from "@effect/sql-sqlite-node/SqliteClient"
import * as Cause from "effect/Cause"
import * as Console from "effect/Console"
import * as Effect from "effect/Effect"
import * as FileSystem from "effect/FileSystem"
import * as Layer from "effect/Layer"
import * as Option from "effect/Option"
import * as Path from "effect/Path"
import * as Schema from "effect/Schema"
import { Argument, Command, Flag } from "effect/unstable/cli"

import { checkedTrimmedText } from "../../../packages/effect-cli/CheckedProcess.ts"
import { trustedExecutable } from "./NativeReview.ts"
import { ActiveScopeBudgetExists, authorizeScopeBudget, buildCloseout, checkScopeBudget, completeScopeBudget, FINDING_FIX_SCOPES, FINDING_HANDLINGS, FINDING_KINDS, FINDING_STATUSES, formatFindingSchema, formatReadyScopeBudget, formatReviewFileCoverage, formatScopeBudgetCheck, formatScopeBudgetStatus, getReviewFileCoverage, getScopeBudget, initialize, InvalidFinding, InvalidReviewCoverage, InvalidScopeBudget, MissingReviewRun, MissingScopeBudget, printCloseout, printQueryResults, pruneFindings, queryFindings, recordCommand, recordFinding, recordReviewedFiles, type ReviewRun, ScopeBudgetAlreadyStarted, ScopeBudgetBlocked, startScopeBudget } from "./ReviewFindings.ts"
import { recordFindingMatch, reviewLimits, reviewProgress } from "./ReviewFindings.ts"
import { DEFAULT_REVIEW_LIMITS, readReviewLimits, ReviewLimitsBlocked } from "./ReviewLimits.ts"
import { PROGRESS_OUTCOMES, ProgressEvent } from "./ReviewProgress.ts"
import { UnsupportedHistoricalGitVersion } from "./ReviewScope.ts"

class QueryScopeError extends Schema.TaggedError<QueryScopeError>()("QueryScopeError", { message: Schema.String }) {}
class CloseoutOptionError extends Schema.TaggedError<CloseoutOptionError>()("CloseoutOptionError", { message: Schema.String }) {}
class ScopeDatabaseError extends Schema.TaggedError<ScopeDatabaseError>()("ScopeDatabaseError", { message: Schema.String }) {}

// Environment defaults are resolved once at the CLI boundary before effects run.
// @effect-diagnostics-next-line processEnv:off
const defaultDb = () => process.env.AGENT_REVIEW_FINDINGS_DB ?? `${process.env.HOME ?? "."}/.local/state/agent-review-findings/reviews.sqlite`
const expandHomePath = (value: string) => {
  // Environment path expansion is a CLI-boundary concern.
  // @effect-diagnostics-next-line processEnv:off
  const home = process.env.HOME
  return home !== undefined && (value === "~" || value.startsWith("~/")) ? `${home}${value.slice(1)}` : value
}
const db = Flag.string("db").pipe(Flag.withDefault(defaultDb()))
const optionalString = (name: string) => Flag.optional(Flag.string(name))
const commonRun = {
  repo: Flag.string("repo"), repoPath: Flag.string("repo-path"), branch: Flag.string("branch").pipe(Flag.withDefault("")),
  target: Flag.string("target"), base: Flag.string("base").pipe(Flag.withDefault("")), head: Flag.string("head").pipe(Flag.withDefault(""))
}
const scopeSummary = Flag.string("scope-summary")
const toRun = (args: typeof commonRun extends infer _ ? { readonly repo: string; readonly repoPath: string; readonly branch: string; readonly target: string; readonly base: string; readonly head: string } : never): ReviewRun => ({ ...args, status: "active", decisionLog: "" })
const withDb = <A, E, R>(path: string, effect: Effect.Effect<A, E, R>) => {
  return Effect.gen(function*() {
    const fs = yield* FileSystem.FileSystem
    const paths = yield* Path.Path
    const expandedPath = expandHomePath(path)
    yield* fs.makeDirectory(paths.dirname(expandedPath), { recursive: true })
    // Dynamic database selection is the application boundary for this command.
    // @effect-diagnostics-next-line strictEffectProvide:off
    return yield* effect.pipe(Effect.provide(SqliteClient.layer({ filename: expandedPath })))
  })
}
const withScopeDb = <A, E, R>(dbPath: string, repoPath: string, effect: Effect.Effect<A, E, R>) => Effect.gen(function*() {
  const fs = yield* FileSystem.FileSystem
  const paths = yield* Path.Path
  const canonicalizeCandidate = (candidate: string) => Effect.gen(function*() {
    let ancestor = paths.resolve(candidate)
    const missing: Array<string> = []
    while (!(yield* fs.exists(ancestor))) {
      const parent = paths.dirname(ancestor)
      if (parent === ancestor) break
      missing.unshift(paths.basename(ancestor))
      ancestor = parent
    }
    const canonicalAncestor = yield* fs.realPath(ancestor).pipe(Effect.orElseSucceed(() => ancestor))
    return paths.join(canonicalAncestor, ...missing)
  })
  const canonicalRepo = yield* canonicalizeCandidate(repoPath)
  const canonicalDb = yield* canonicalizeCandidate(expandHomePath(dbPath))
  const relative = paths.relative(canonicalRepo, canonicalDb)
  const insideRepo = relative === "" || (!paths.isAbsolute(relative) && relative !== ".." && !relative.startsWith(`..${paths.sep}`))
  if (insideRepo) return yield* new ScopeDatabaseError({ message: "scope database must be outside the reviewed repository so it cannot contaminate diff measurement" })
  return yield* withDb(canonicalDb, effect)
})

const init = Command.make("init", { db }, ({ db }) => withDb(db, initialize()).pipe(Effect.andThen(Console.log(db))))
const pathCommand = Command.make("path", { db }, ({ db }) => Console.log(expandHomePath(db)))
const findingSchema = Command.make("schema", {}, () => Console.log(formatFindingSchema())).pipe(Command.withDescription("Print the authoritative record schema and consistency rules"))
const record = Command.make("record", {
  db, ...commonRun, decisionLog: Flag.string("decision-log").pipe(Flag.withDefault("")),
  decisionId: Flag.string("decision-id").pipe(Flag.withDefault("")), status: Flag.choice("status", FINDING_STATUSES).pipe(Flag.withDefault("")), source: Flag.string("source"), fingerprint: Flag.string("fingerprint").pipe(Flag.withDefault("")), summary: Flag.string("summary").pipe(Flag.withDefault("")),
  matchOf: Flag.string("match-of").pipe(Flag.withDefault("")), matchNote: Flag.string("match-note").pipe(Flag.withDefault("")), evidence: Flag.string("evidence").pipe(Flag.withDefault("")), json: Flag.boolean("json"),
  area: Flag.string("area").pipe(Flag.withDefault("")), impact: Flag.string("impact").pipe(Flag.withDefault("")), material: Flag.boolean("material"),
  userImpact: Flag.string("user-impact").pipe(Flag.withDefault("")), decision: Flag.string("decision").pipe(Flag.withDefault("")), text: Flag.string("text").pipe(Flag.withDefault("")),
  findingKind: Flag.choice("finding-kind", FINDING_KINDS).pipe(Flag.withDefault("")), productionPath: Flag.string("production-path").pipe(Flag.withDefault("")),
  reachabilityEvidence: Flag.string("reachability-evidence").pipe(Flag.withDefault("")), likelihood: Flag.string("likelihood").pipe(Flag.withDefault("")),
  actualConsequence: Flag.string("actual-consequence").pipe(Flag.withDefault("")),
  maintenanceEvidence: Flag.string("maintenance-evidence").pipe(Flag.withDefault("")), presentCost: Flag.string("present-cost").pipe(Flag.withDefault("")),
  contractEvidence: Flag.string("contract-evidence").pipe(Flag.withDefault("")),
  rootCause: Flag.string("root-cause").pipe(Flag.withDefault("")),
  recommendedFix: Flag.string("recommended-fix").pipe(Flag.withDefault("")),
  interventionJustification: Flag.string("intervention-justification").pipe(Flag.withDefault("")),
  rejectionGate: Flag.string("rejection-gate").pipe(Flag.withDefault("")),
  fixScope: Flag.choice("fix-scope", FINDING_FIX_SCOPES).pipe(Flag.withDefault("")),
  handling: Flag.choice("handling", FINDING_HANDLINGS).pipe(Flag.withDefault("")),
  ownerResolution: Flag.string("owner-resolution").pipe(Flag.withDefault(""))
}, (args) => withDb(args.db, Effect.gen(function*() {
  yield* initialize()
  if (args.matchOf.length > 0 && (args.decisionId.length > 0 || args.status.length > 0 || args.ownerResolution.length > 0 || args.handling.length > 0)) return yield* Effect.fail(new InvalidFinding("--match-of appends evidence only; omit decision/status/handling/owner-resolution fields"))
  if (args.matchOf.length === 0 && (args.matchNote.length > 0 || args.evidence.length > 0)) return yield* Effect.fail(new InvalidFinding("--match-note and --evidence require --match-of"))
  const result = args.matchOf.length > 0
    ? yield* recordFindingMatch(toRun(args), args)
    : yield* recordFinding({ ...toRun(args), decisionLog: args.decisionLog }, args)
  const limits = yield* readReviewLimits(result.runId, args.head)
  yield* Console.log(args.json ? JSON.stringify({ ...result, limits }) : `recorded run=${result.runId} issue=${result.issueId} decision=${args.matchOf || args.decisionId} db=${args.db}\n${JSON.stringify({ limits })}`)
})))
const recordCommandCli = Command.make("record-command", {
  db, ...commonRun, command: Flag.string("command"), result: Flag.string("result"), reason: Flag.string("reason"), decisionId: Flag.string("decision-id").pipe(Flag.withDefault(""))
}, (args) => withDb(args.db, Effect.gen(function*() {
  yield* initialize()
  const result = yield* recordCommand(toRun(args), args)
  yield* Console.log(`recorded command=${result.commandId} run=${result.runId} db=${args.db}`)
})))
const closeout = Command.make("closeout", {
  db, repo: Flag.string("repo"), repoPath: optionalString("repo-path"), branch: optionalString("branch"), target: optionalString("target"), base: optionalString("base"), material: Flag.boolean("material"), summary: Flag.boolean("summary"), summaryLimit: Flag.integer("summary-limit").pipe(Flag.withDefault(12)), json: Flag.boolean("json")
}, (args) => withDb(args.db, Effect.gen(function*() {
  yield* initialize()
  if (args.material && args.summary) return yield* new CloseoutOptionError({ message: "closeout accepts either --material or --summary, not both" })
  if (args.summaryLimit < 0) return yield* new CloseoutOptionError({ message: "closeout --summary-limit must be a non-negative integer" })
  const closeout = yield* buildCloseout({ repo: args.repo, ...(Option.isSome(args.repoPath) ? { repoPath: args.repoPath.value } : {}), ...(Option.isSome(args.branch) ? { branch: args.branch.value } : {}), ...(Option.isSome(args.target) ? { target: args.target.value } : {}), ...(Option.isSome(args.base) ? { base: args.base.value } : {}) })
  yield* printCloseout(closeout, args.json, args.summary ? "summary" : args.material ? "material" : "full", args.summaryLimit)
})))
const inferGit = Effect.fn("ReviewFindings.inferGit")(function*(args: ReadonlyArray<string>) {
  const git = yield* trustedExecutable("git")
  return yield* checkedTrimmedText(git, args).pipe(Effect.option, Effect.map(Option.filter((value) => value.length > 0)))
})
const query = Command.make("query", {
  db, query: Argument.string("query"), limit: Flag.integer("limit").pipe(Flag.withDefault(8)), repo: optionalString("repo"), repoPath: optionalString("repo-path"), branch: optionalString("branch"), target: optionalString("target"),
  allRepos: Flag.boolean("all-repos"), allBranches: Flag.boolean("all-branches"), status: optionalString("status"), showPaths: Flag.boolean("show-paths"), json: Flag.boolean("json")
}, (args) => withDb(args.db, Effect.gen(function*() {
  yield* initialize()
  if (args.limit < 0) return yield* new QueryScopeError({ message: "query --limit must be a non-negative integer" })
  const root = yield* inferGit(["rev-parse", "--show-toplevel"])
  const inferredRepo = Option.map(root, (value) => value.split("/").at(-1) ?? value)
  const inferredBranch = yield* inferGit(["branch", "--show-current"])
  if (!args.allRepos && Option.isNone(args.repo) && Option.isNone(args.repoPath) && Option.isNone(inferredRepo)) return yield* new QueryScopeError({ message: "query needs --repo, --repo-path, a Git repository, or --all-repos" })
  if (!args.allBranches && Option.isNone(args.branch) && Option.isNone(inferredBranch)) return yield* new QueryScopeError({ message: "query needs --branch, a Git branch, or --all-branches" })
  const repo = args.allRepos ? Option.getOrUndefined(args.repo) : Option.getOrUndefined(Option.orElse(args.repo, () => inferredRepo))
  const branch = args.allBranches ? Option.getOrUndefined(args.branch) : Option.getOrUndefined(Option.orElse(args.branch, () => inferredBranch))
  const inferredRepoPath = !args.allRepos && Option.isNone(args.repoPath) && Option.isSome(root) && Option.isSome(inferredRepo) && repo === inferredRepo.value ? root.value : undefined
  const repoPath = Option.isSome(args.repoPath) ? args.repoPath.value : inferredRepoPath
  const results = yield* queryFindings(args.query, { limit: args.limit, ...(repo === undefined ? {} : { repo }), ...(repoPath === undefined ? {} : { repoPath }), ...(branch === undefined ? {} : { branch }), ...(Option.isSome(args.target) ? { target: args.target.value } : {}), ...(Option.isSome(args.status) ? { status: args.status.value } : {}) })
  yield* printQueryResults(results, args.json, args.showPaths)
})))
const prune = Command.make("prune", {
  db, olderThanDays: Flag.float("older-than-days").pipe(Flag.withDefault(90)), minSeenCount: Flag.integer("min-seen-count").pipe(Flag.withDefault(1)), repo: optionalString("repo"), repoPath: optionalString("repo-path"), branch: optionalString("branch"), includeOpen: Flag.boolean("include-open"), dryRun: Flag.boolean("dry-run")
}, (args) => withDb(args.db, Effect.gen(function*() {
  yield* initialize()
  const count = yield* pruneFindings({ olderThanDays: args.olderThanDays, minSeenCount: args.minSeenCount, ...(Option.isSome(args.repo) ? { repo: args.repo.value } : {}), ...(Option.isSome(args.repoPath) ? { repoPath: args.repoPath.value } : {}), ...(Option.isSome(args.branch) ? { branch: args.branch.value } : {}), includeOpen: args.includeOpen, dryRun: args.dryRun })
  yield* Console.log(`${args.dryRun ? "would prune" : "pruned"} findings=${count} db=${args.db}`)
})))
const scopeStart = Command.make("scope-start", {
  db, ...commonRun, scopeSummary, json: Flag.boolean("json"),
  timeBudgetHours: Flag.float("time-budget-hours").pipe(Flag.withDefault(DEFAULT_REVIEW_LIMITS.timeBudgetHours)),
  consultCap: Flag.integer("consult-cap").pipe(Flag.withDefault(DEFAULT_REVIEW_LIMITS.consultCap)),
  coldCleanTarget: Flag.integer("cold-clean-target").pipe(Flag.withDefault(DEFAULT_REVIEW_LIMITS.coldCleanTarget))
}, (args) => withScopeDb(args.db, args.repoPath, Effect.gen(function*() {
  yield* initialize()
  const budget = yield* startScopeBudget(toRun(args), { scopeSummary: args.scopeSummary, limits: { timeBudgetHours: args.timeBudgetHours, consultCap: args.consultCap, coldCleanTarget: args.coldCleanTarget } })
  const limits = yield* reviewLimits(toRun(args))
  yield* Console.log(args.json ? JSON.stringify({ ...budget, limits }) : `${formatReadyScopeBudget(budget)}\n${JSON.stringify({ limits })}`)
}))).pipe(Command.withDescription("Freeze the review scope and deterministic diff-growth baseline"))
const scopeCheck = Command.make("scope-check", {
  db, ...commonRun, reason: Flag.string("reason"), json: Flag.boolean("json")
}, (args) => withScopeDb(args.db, args.repoPath, Effect.gen(function*() {
  yield* initialize()
  const check = yield* checkScopeBudget(toRun(args), args.reason)
  const limits = yield* reviewLimits(toRun(args))
  if (check.blocked) {
    if (args.json) return yield* new ReviewLimitsBlocked({ message: JSON.stringify({ ...check, limits }), report: limits })
    return yield* Effect.fail(new ScopeBudgetBlocked(check))
  }
  yield* Console.log(args.json ? JSON.stringify({ ...check, limits }) : `${formatScopeBudgetCheck(check)}\n${JSON.stringify({ limits })}`)
}))).pipe(Command.withDescription("Block review work that exceeds the frozen scope budget"))
const scopeAuthorize = Command.make("scope-authorize", {
  db, ...commonRun, scopeSummary, authorization: Flag.string("authorization")
}, (args) => withScopeDb(args.db, args.repoPath, Effect.gen(function*() {
  yield* initialize()
  const budget = yield* authorizeScopeBudget(toRun(args), { scopeSummary: args.scopeSummary, authorization: args.authorization })
  yield* Console.log(formatReadyScopeBudget(budget))
}))).pipe(Command.withDescription("Reset a blocked baseline after explicit user authorization"))
const scopeStatus = Command.make("scope-status", {
  db, ...commonRun, json: Flag.boolean("json")
}, (args) => withScopeDb(args.db, args.repoPath, Effect.gen(function*() {
  yield* initialize()
  const budget = yield* getScopeBudget(toRun(args))
  const limits = yield* reviewLimits(toRun(args))
  yield* Console.log(args.json ? JSON.stringify({ ...budget, limits }) : `${formatScopeBudgetStatus(budget)}\n${JSON.stringify({ limits })}`)
}))).pipe(Command.withDescription("Show the persisted review scope budget"))
const scopeComplete = Command.make("scope-complete", {
  db, ...commonRun, reason: Flag.string("reason"), json: Flag.boolean("json")
}, (args) => withScopeDb(args.db, args.repoPath, Effect.gen(function*() {
  yield* initialize()
  const budget = yield* completeScopeBudget(toRun(args), args.reason)
  const limits = yield* reviewLimits(toRun(args))
  yield* Console.log(args.json ? JSON.stringify({ ...budget, limits }) : `${formatScopeBudgetStatus(budget)}\n${JSON.stringify({ limits })}`)
}))).pipe(Command.withDescription("Close a clean scope budget so a later review can start"))

const coverageRecord = Command.make("coverage-record", {
  db, ...commonRun, reviewId: Flag.string("review-id"), reviewer: Flag.string("reviewer"), file: Flag.string("file").pipe(Flag.atLeast(1)), changeId: Flag.string("change-id").pipe(Flag.atLeast(1))
}, (args) => withScopeDb(args.db, args.repoPath, Effect.gen(function*() {
  yield* initialize()
  if (args.file.length !== args.changeId.length) return yield* Effect.fail(new InvalidReviewCoverage("coverage-record requires one --change-id for each --file, in the same order"))
  const files = args.file.map((path, index) => ({ path, changeId: args.changeId[index] ?? "" }))
  const result = yield* recordReviewedFiles(toRun(args), { reviewId: args.reviewId, reviewer: args.reviewer, files })
  yield* Console.log(`recorded reviewed-files=${result.recordedFiles} review=${result.reviewId} run=${result.runId} db=${args.db}`)
}))).pipe(Command.withDescription("Record one reviewer's changed-file coverage in a single batch"))

const coverageStatus = Command.make("coverage-status", {
  db, ...commonRun, json: Flag.boolean("json")
}, (args) => withScopeDb(args.db, args.repoPath, Effect.gen(function*() {
  yield* initialize()
  const coverage = yield* getReviewFileCoverage(toRun(args))
  yield* Console.log(args.json ? JSON.stringify(coverage, null, 2) : formatReviewFileCoverage(coverage))
}))).pipe(Command.withDescription("Rank current changed files by valid independent review count"))

const progressStatus = Command.make("progress-status", { db, ...commonRun, phase: Flag.choice("phase", ["native", "cold", "clawsweeper"]).pipe(Flag.optional) }, args => withScopeDb(args.db, args.repoPath, Effect.gen(function*() {
  yield* initialize()
  const progress = yield* reviewProgress(toRun(args))
  const limits = yield* reviewLimits(toRun(args), Option.getOrUndefined(args.phase) ?? progress?.phase)
  yield* Console.log(JSON.stringify({ ...(progress ?? { revision: 0 }), limits }))
})))
const progressRecord = Command.make("progress-record", {
  db, ...commonRun, revision: Flag.integer("expected-revision"), phase: Flag.choice("phase", ["native", "cold", "clawsweeper"]),
  outcome: Flag.choice("outcome", PROGRESS_OUTCOMES), evidence: Flag.string("evidence"),
  findingId: optionalString("finding-id"), repairAttempt: optionalString("repair-attempt"), authorization: optionalString("authorization")
}, args => withScopeDb(args.db, args.repoPath, Effect.gen(function*() {
  yield* initialize()
  const event = yield* Schema.decodeUnknownEffect(ProgressEvent)({ expectedRevision: args.revision, phase: args.phase, head: args.head, outcome: args.outcome, evidence: args.evidence,
    ...(Option.isSome(args.findingId) ? { findingId: args.findingId.value } : {}),
    ...(Option.isSome(args.repairAttempt) ? { repairAttempt: args.repairAttempt.value } : {}),
    ...(Option.isSome(args.authorization) ? { authorization: args.authorization.value } : {})
  })
  const progress = yield* reviewProgress(toRun(args), event)
  yield* Console.log(JSON.stringify({ ...progress, limits: yield* reviewLimits(toRun(args), event.phase) }))
})))

const command = Command.make("review-findings").pipe(Command.withDescription("Local SQLite registry for review findings"), Command.withSubcommands([init, findingSchema, record, recordCommandCli, query, closeout, prune, scopeStart, scopeCheck, scopeAuthorize, scopeStatus, scopeComplete, coverageRecord, coverageStatus, progressStatus, progressRecord, pathCommand]))
const Live = Layer.mergeAll(NodeServices.layer)
const rootDb = process.argv[2]
if (rootDb === "--db" && process.argv[3] !== undefined && process.argv[4] !== undefined) {
  process.argv.splice(2, 3, process.argv[4], "--db", process.argv[3])
} else if (rootDb?.startsWith("--db=") && process.argv[3] !== undefined) {
  process.argv.splice(2, 2, process.argv[3], rootDb)
}
command.pipe(Command.run({ version: "3.2.0" }),
  // @effect-diagnostics-next-line strictEffectProvide:off
  Effect.provide(Live), Effect.tapCause((cause) => {
    const error = Cause.squash(cause)
    return Console.error(error instanceof ReviewLimitsBlocked || error instanceof ActiveScopeBudgetExists || error instanceof MissingReviewRun || error instanceof MissingScopeBudget || error instanceof ScopeBudgetAlreadyStarted || error instanceof ScopeBudgetBlocked || error instanceof InvalidFinding || error instanceof InvalidReviewCoverage || error instanceof InvalidScopeBudget || error instanceof QueryScopeError || error instanceof CloseoutOptionError || error instanceof ScopeDatabaseError || error instanceof UnsupportedHistoricalGitVersion ? error.message : Cause.pretty(cause))
  }), NodeRuntime.runMain({ disableErrorReporting: true }))
