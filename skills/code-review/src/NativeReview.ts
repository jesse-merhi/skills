import * as Console from "effect/Console"
import * as DateTime from "effect/DateTime"
import * as Effect from "effect/Effect"
import * as FileSystem from "effect/FileSystem"
import * as Option from "effect/Option"
import * as Path from "effect/Path"
import * as Schema from "effect/Schema"
import * as Stream from "effect/Stream"

import { checkedInherit, type CheckedProcessOptions, checkedText, checkedTrimmedText } from "../../../packages/effect-cli/CheckedProcess.ts"
import { ReviewSnapshotError, trustedExecutable } from "./ReviewEnvironment.ts"
import { measureScopeDiff } from "./ReviewScope.ts"

export { ReviewSnapshotError, trustedExecutable } from "./ReviewEnvironment.ts"

export type ReviewMode = "auto" | "whole" | "branch" | "commit"

export interface ReviewTarget {
  readonly label: string
  readonly args: ReadonlyArray<string>
}

export interface ReviewPlan {
  readonly label: string
  readonly targets: ReadonlyArray<ReviewTarget>
}

export class ReviewTargetChangedError extends Schema.TaggedError<ReviewTargetChangedError>()("ReviewTargetChangedError", {
  runs: Schema.Number
}) {}
export class CodexAuthenticationError extends Schema.TaggedError<CodexAuthenticationError>()("CodexAuthenticationError", { message: Schema.String }) {}
export class CodexLivePreflightError extends Schema.TaggedError<CodexLivePreflightError>()("CodexLivePreflightError", { message: Schema.String }) {}

const CodexDoctorReport = Schema.fromJsonString(Schema.Struct({
  checks: Schema.Struct({
    "auth.credentials": Schema.Struct({ status: Schema.String })
  })
}))

const capture = (executable: string, args: ReadonlyArray<string>, options?: CheckedProcessOptions) =>
  (executable.includes("/") ? Effect.succeed(executable) : trustedExecutable(executable)).pipe(Effect.flatMap((resolved) => checkedTrimmedText(resolved, args, options)))

const git = (args: ReadonlyArray<string>) => capture("git", args)
const optionalCapture = (executable: string, args: ReadonlyArray<string>) => capture(executable, args).pipe(Effect.option)
const branchTarget = (base: string, mode: "whole" | "branch" = "branch") => ({
  label: `${mode} against ${base}`,
  args: ["--base", base]
}) satisfies ReviewTarget

export const planReview = (mode: ReviewMode, base: string, commit: string): ReviewPlan => {
  if (mode === "commit") return { label: `commit ${commit}`, targets: [{ label: `commit ${commit}`, args: ["--commit", commit] }] }
  const branch = branchTarget(base, mode === "whole" ? "whole" : "branch")
  return { label: branch.label, targets: [branch] }
}

export const reviewBaseCandidates = (prBase: string | undefined, remoteHead: string | undefined) => [
  ...(prBase === undefined || prBase.length === 0 ? [] : [`origin/${prBase}`, prBase]),
  ...(remoteHead === undefined || remoteHead.length === 0 ? [] : [remoteHead]),
  "origin/main", "origin/master", "main", "master"
].filter((candidate, index, all) => all.indexOf(candidate) === index)

export const discoverReviewBase = Effect.fn("NativeReview.discoverBase")(function*() {
  const prBase = yield* optionalCapture("gh", ["pr", "view", "--json", "baseRefName", "--jq", ".baseRefName"])
  const remoteHead = yield* optionalCapture("git", ["symbolic-ref", "--quiet", "--short", "refs/remotes/origin/HEAD"])
  for (const candidate of reviewBaseCandidates(Option.getOrUndefined(prBase), Option.getOrUndefined(remoteHead))) {
    if (Option.isSome(yield* optionalCapture("git", ["rev-parse", "--verify", `${candidate}^{commit}`]))) return candidate
  }
  return yield* new ReviewSnapshotError({ message: "could not discover a review base; pass --base <ref> explicitly" })
})

export const refreshReviewBase = Effect.fn("NativeReview.refreshBase")(function*(base: string) {
  const separator = base.indexOf("/")
  if (separator <= 0 || separator === base.length - 1) return
  const remote = base.slice(0, separator)
  const branch = base.slice(separator + 1)
  if (Option.isNone(yield* optionalCapture("git", ["remote", "get-url", remote]))) return
  const gitTool = yield* trustedExecutable("git")
  yield* checkedInherit(gitTool, ["fetch", "--quiet", remote, `+refs/heads/${branch}:refs/remotes/${remote}/${branch}`]).pipe(
    Effect.catch((error) => Console.error(`warning: could not refresh ${base}; reviewing the existing local ref (${error.message})`))
  )
})

const authenticationFailure = () => new CodexAuthenticationError({
  message: "Codex authentication preflight failed for the current runtime identity. Restore that identity's expected Codex binary and auth file, then retry. In OpenClaw, reuse the shared host Codex auth path; do not create a separate OpenClaw login."
})
const livePreflightFailure = () => new CodexLivePreflightError({
  message: "Codex reached the live preflight but the request failed. Retry once, then use `codex exec --ephemeral` under the same runtime identity to diagnose rejected or expired credentials, network, rate-limit, model, or configuration errors. In OpenClaw, repair rejected credentials through the shared host auth path; do not create a separate OpenClaw login."
})

export const preflightCodexAuthentication = Effect.fn("NativeReview.preflightCodexAuthentication")(function*(codexBin: string) {
  const fs = yield* FileSystem.FileSystem
  const paths = yield* Path.Path
  const reviewer = codexBin.includes("/") ? paths.resolve(codexBin) : yield* trustedExecutable(codexBin)

  // This command reads a cache in some installations. Keep it informational so
  // stale state cannot override the redacted diagnostic and live provider checks.
  yield* checkedTrimmedText(reviewer, ["login", "status"]).pipe(
    Effect.timeout("10 seconds"),
    Effect.ignore
  )

  // Doctor returns JSON with exit 1 when a diagnostic check reports `fail`.
  // Keep that stdout available for typed decoding while older unsupported
  // commands and other exit codes continue to the live capability check.
  const report = yield* checkedTrimmedText(reviewer, ["doctor", "--json"], { allowedExitCodes: [1] }).pipe(
    Effect.timeout("20 seconds"),
    Effect.flatMap(Schema.decodeUnknownEffect(CodexDoctorReport)),
    Effect.option
  )
  if (Option.isSome(report) && ["error", "fail"].includes(report.value.checks["auth.credentials"].status)) return yield* authenticationFailure()

  yield* Effect.scoped(Effect.gen(function*() {
    const probeDirectory = yield* fs.makeTempDirectoryScoped({ prefix: "codex-auth-preflight." })
    yield* checkedTrimmedText(reviewer, [
      "exec",
      "--ephemeral",
      "--skip-git-repo-check",
      "--sandbox",
      "read-only",
      "Authentication preflight only. Reply with exactly: ok. Do not use tools."
    ], { cwd: probeDirectory }).pipe(
      Effect.timeout("60 seconds"),
      Effect.mapError(livePreflightFailure)
    )
  }))
})

export const requireCleanReviewTree = Effect.fn("NativeReview.requireCleanReviewTree")(function*(repoPath = process.cwd()) {
  const gitTool = yield* trustedExecutable("git", repoPath)
  const head = yield* checkedTrimmedText(gitTool, ["rev-parse", "--verify", "HEAD^{commit}"], { cwd: repoPath }).pipe(
    Effect.mapError(() => new ReviewSnapshotError({ message: "code review requires a committed HEAD" }))
  )
  const status = yield* checkedText(gitTool, ["-c", "core.hooksPath=/dev/null", "status", "--porcelain=v1", "--untracked-files=normal"], { cwd: repoPath })
  if (status.length > 0) return yield* new ReviewSnapshotError({ message: "code review requires a clean committed worktree; commit or discard staged, unstaged, and untracked changes before review" })
  const measurement = yield* measureScopeDiff(repoPath, head, head, true)
  if (measurement.changedPaths.length > 0) return yield* new ReviewSnapshotError({ message: "code review requires a clean committed worktree; commit or discard staged, unstaged, untracked, and index-hidden changes before review" })
  return head
})

export const selectReviewPlan = Effect.fn("NativeReview.selectReviewPlan")(function*(mode: ReviewMode, base: Option.Option<string>, commit: string, refresh = true) {
  yield* requireCleanReviewTree()
  const needsBase = mode !== "commit"
  const selectedBase = Option.isSome(base) ? base.value : needsBase ? yield* discoverReviewBase() : "HEAD"
  if (needsBase) {
    if (refresh) yield* refreshReviewBase(selectedBase)
    yield* git(["rev-parse", "--verify", `${selectedBase}^{commit}`])
  }
  return planReview(mode, selectedBase, commit)
})

export interface ReviewIdentityOptions {
  readonly baseRefs?: ReadonlyArray<string>
  readonly commitRefs?: ReadonlyArray<string>
  readonly includeHead?: boolean
}

export const reviewIdentity = Effect.fn("NativeReview.reviewIdentity")(function*(options: ReviewIdentityOptions = {}) {
  const repo = yield* git(["rev-parse", "--show-toplevel"])
  const fromRoot = (args: ReadonlyArray<string>) => capture("git", args, { cwd: repo })
  const cleanHead = yield* requireCleanReviewTree(repo)
  const includeHead = options.includeHead ?? true
  const branch = includeHead ? yield* fromRoot(["symbolic-ref", "--quiet", "--short", "HEAD"]).pipe(Effect.orElseSucceed(() => "HEAD")) : undefined
  const head = includeHead ? cleanHead : undefined
  const resolveRefs = (refs: ReadonlyArray<string>) => Effect.forEach(refs, (ref) => fromRoot(["rev-parse", "--verify", `${ref}^{commit}`]).pipe(Effect.map((oid) => [ref, oid] as const)))
  const bases = yield* resolveRefs(options.baseRefs ?? [])
  const commits = yield* resolveRefs(options.commitRefs ?? [])
  return JSON.stringify({ bases, commits, branch, head })
})

const SessionMetaLine = Schema.fromJsonString(Schema.Struct({
  type: Schema.Literal("session_meta"),
  payload: Schema.Struct({
    id: Schema.String,
    cwd: Schema.String,
    source: Schema.Unknown,
    parent_thread_id: Schema.optionalKey(Schema.String)
  })
}))

const isReviewSource = Schema.is(Schema.Struct({ subagent: Schema.Literal("review") }))

// @effect-diagnostics-next-line processEnv:off
const sessionEnvironment = { CODEX_HOME: process.env.CODEX_HOME, HOME: process.env.HOME }

const sessionDay = (date: Date) => date.toISOString().slice(0, 10).replaceAll("-", "/")

const readSessionHead = Effect.fn("NativeReview.readSessionHead")(function*(path: string) {
  const fs = yield* FileSystem.FileSystem
  const firstLine = yield* fs.stream(path).pipe(Stream.decodeText(), Stream.splitLines, Stream.runHead, Effect.orElseSucceed(() => Option.none()))
  if (Option.isNone(firstLine)) return Option.none()
  return yield* Schema.decodeUnknownEffect(SessionMetaLine)(firstLine.value).pipe(Effect.option)
})

export const archiveReviewSessions = Effect.fn("NativeReview.archiveReviewSessions")(function*(options: {
  readonly reviewer: string
  readonly reviewCwds: ReadonlyArray<string>
  readonly since: Date
  readonly sessionsRoot?: string
}) {
  const fs = yield* FileSystem.FileSystem
  const paths = yield* Path.Path
  const codexHome = options.sessionsRoot !== undefined
    ? undefined
    : sessionEnvironment.CODEX_HOME !== undefined && sessionEnvironment.CODEX_HOME.length > 0
    ? sessionEnvironment.CODEX_HOME
    : sessionEnvironment.HOME !== undefined && sessionEnvironment.HOME.length > 0
    ? paths.join(sessionEnvironment.HOME, ".codex")
    : undefined
  const root = options.sessionsRoot ?? (codexHome === undefined ? undefined : paths.join(codexHome, "sessions"))
  if (root === undefined || !(yield* fs.exists(root))) return []
  const cwds = new Set<string>()
  for (const cwd of options.reviewCwds) {
    const resolved = paths.resolve(cwd)
    cwds.add(resolved)
    cwds.add(yield* fs.realPath(resolved).pipe(Effect.orElseSucceed(() => resolved)))
  }
  // Session directories are named by date; one day of margin covers timezone
  // skew between the directory name and the run window.
  const cutoffDay = sessionDay(new Date(options.since.getTime() - 24 * 60 * 60 * 1000))
  const cutoffTime = options.since.getTime() - 1000
  const listDirectories = (path: string) => fs.readDirectory(path).pipe(Effect.orElseSucceed((): Array<string> => []))
  const drivers: Array<string> = []
  const children: Array<{ readonly id: string; readonly parent: string; readonly path: string }> = []
  for (const year of yield* listDirectories(root)) {
    for (const month of yield* listDirectories(paths.join(root, year))) {
      for (const day of yield* listDirectories(paths.join(root, year, month))) {
        if (`${year}/${month}/${day}` < cutoffDay) continue
        for (const name of yield* listDirectories(paths.join(root, year, month, day))) {
          if (!name.startsWith("rollout-") || !name.endsWith(".jsonl")) continue
          const path = paths.join(root, year, month, day, name)
          const info = yield* fs.stat(path).pipe(Effect.option)
          if (Option.isNone(info)) continue
          const mtime = Option.getOrUndefined(info.value.mtime)
          if (mtime === undefined || mtime.getTime() < cutoffTime) continue
          const meta = yield* readSessionHead(path)
          if (Option.isNone(meta) || !cwds.has(meta.value.payload.cwd)) continue
          const { id, parent_thread_id: parent, source } = meta.value.payload
          if (parent !== undefined) {
            if (isReviewSource(source)) children.push({ id, parent, path })
            continue
          }
          if (source === "exec") drivers.push(id)
        }
      }
    }
  }
  // A native review is an exec driver paired with a review-source child.
  // Neither an exec session alone nor an arbitrary spawned child identifies it.
  const reviewParents = new Set(children.map((child) => child.parent))
  const driverIds = new Set(drivers.filter((id) => reviewParents.has(id)))
  const archived: Array<string> = []
  const archive = Effect.fn("NativeReview.archiveSession")(function*(id: string) {
    const result = yield* checkedTrimmedText(options.reviewer, ["archive", id]).pipe(Effect.timeout("30 seconds"), Effect.option)
    if (Option.isSome(result)) archived.push(id)
    return Option.isSome(result)
  })
  for (const id of driverIds) {
    if (!(yield* archive(id))) yield* Console.error(`warning: could not archive review session ${id}`)
  }
  // Archiving a driver moves its subagent thread too, so only sweep the ones
  // still sitting in the sessions directory afterwards.
  for (const child of children) {
    if (!driverIds.has(child.parent) || (yield* fs.exists(child.path).pipe(Effect.orElseSucceed(() => false))) === false) continue
    if (!(yield* archive(child.id))) yield* Console.error(`warning: could not archive review subagent session ${child.id}`)
  }
  return archived
})

export const untilReviewStable = <A, E, R, E2, R2>(options: {
  readonly identity: Effect.Effect<string, E, R>
  readonly operation: Effect.Effect<A, E2, R2>
  readonly maxRuns?: number
  readonly onChange?: (run: number) => Effect.Effect<void>
}) => Effect.gen(function*() {
  const maxRuns = options.maxRuns ?? 3
  for (let run = 1; run <= maxRuns; run += 1) {
    const before = yield* options.identity
    const value = yield* options.operation
    const after = yield* options.identity
    if (before === after) return { value, runs: run }
    if (run < maxRuns && options.onChange !== undefined) yield* options.onChange(run)
  }
  return yield* new ReviewTargetChangedError({ runs: maxRuns })
})

export const runNativeReview = Effect.fn("NativeReview.run")(function*(options: {
  readonly codexBin: string
  readonly plan: ReviewPlan
  readonly testCommand: Option.Option<string>
}) {
  const repo = yield* git(["rev-parse", "--show-toplevel"])
  const paths = yield* Path.Path
  const reviewer = options.codexBin.includes("/") ? paths.resolve(options.codexBin) : yield* trustedExecutable(options.codexBin)
  const shell = yield* trustedExecutable("sh")
  // Each `codex review` run persists a rollout session under CODEX_HOME. Once
  // the review output is captured the session is no longer needed for findings,
  // so archive it to keep the resume picker and session search lean.
  const reviewTarget = Effect.fn("NativeReview.reviewTarget")(function*(target: ReviewTarget) {
    const startedAt = yield* DateTime.now
    const output = yield* checkedText(reviewer, ["review", ...target.args])
    yield* archiveReviewSessions({
      reviewer,
      reviewCwds: [process.cwd(), repo],
      since: DateTime.toDate(startedAt)
    }).pipe(Effect.catch((error) => Console.error(`warning: review session archiving failed (${String(error)})`)))
    return options.plan.targets.length === 1 ? output : `[${target.label}]\n${output}`
  })
  const execute = () => {
    const reviews = Effect.forEach(options.plan.targets, reviewTarget).pipe(Effect.map((outputs) => outputs.join("\n\n")))
    if (Option.isNone(options.testCommand)) return reviews
    const test = checkedText(shell, ["-lc", options.testCommand.value], { cwd: repo })
    return Effect.all([reviews, test], { concurrency: "unbounded" }).pipe(Effect.map(([output]) => output))
  }
  return yield* execute()
})
