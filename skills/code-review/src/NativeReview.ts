import * as Console from "effect/Console"
import * as Effect from "effect/Effect"
import * as FileSystem from "effect/FileSystem"
import * as Option from "effect/Option"
import * as Path from "effect/Path"
import * as Schema from "effect/Schema"

import { checkedInherit, type CheckedProcessOptions, checkedText, checkedTrimmedText } from "../../../packages/effect-cli/CheckedProcess.ts"

export type ReviewMode = "auto" | "whole" | "local" | "uncommitted" | "branch" | "commit"

export interface ReviewTarget {
  readonly label: string
  readonly args: ReadonlyArray<string>
  readonly snapshot?: boolean
}

export interface ReviewPlan {
  readonly label: string
  readonly targets: ReadonlyArray<ReviewTarget>
}

export class ReviewTargetChangedError extends Schema.TaggedError<ReviewTargetChangedError>()("ReviewTargetChangedError", {
  runs: Schema.Number
}) {}
export class ReviewSnapshotError extends Schema.TaggedError<ReviewSnapshotError>()("ReviewSnapshotError", { message: Schema.String }) {}

// Explicit tool overrides are trusted user configuration; defaults are resolved outside the checkout.
// @effect-diagnostics-next-line processEnv:off
const toolEnvironment = { CODEX_BIN: process.env.CODEX_BIN, GH_BIN: process.env.GH_BIN, GIT_BIN: process.env.GIT_BIN, PATH: process.env.PATH ?? "" }
export const trustedExecutable = Effect.fn("NativeReview.trustedExecutable")(function*(name: string, reviewedRepoPath = process.cwd()) {
  const explicit = name === "git" ? toolEnvironment.GIT_BIN : name === "gh" ? toolEnvironment.GH_BIN : name === "codex" ? toolEnvironment.CODEX_BIN : undefined
  if (explicit !== undefined && explicit.length > 0) return explicit
  const fs = yield* FileSystem.FileSystem
  const paths = yield* Path.Path
  let cursor = paths.resolve(reviewedRepoPath)
  let repo: string | undefined
  while (repo === undefined) {
    if (yield* fs.exists(paths.join(cursor, ".git"))) repo = yield* fs.realPath(cursor).pipe(Effect.orElseSucceed(() => cursor))
    else {
      const parent = paths.dirname(cursor)
      if (parent === cursor) break
      cursor = parent
    }
  }
  for (const entry of toolEnvironment.PATH.split(":")) {
    if (entry.length === 0 || !paths.isAbsolute(entry)) continue
    const candidate = paths.join(entry, name)
    if (!(yield* fs.exists(candidate))) continue
    const resolved = yield* fs.realPath(candidate).pipe(Effect.orElseSucceed(() => paths.resolve(candidate)))
    const info = yield* fs.stat(resolved).pipe(Effect.option)
    if (Option.isNone(info) || info.value.type !== "File" || (info.value.mode & 0o111) === 0) continue
    const relative = repo === undefined ? undefined : paths.relative(repo, resolved)
    const insideRepo = relative !== undefined && (relative === "" || (!paths.isAbsolute(relative) && relative !== ".." && !relative.startsWith(`..${paths.sep}`)))
    if (!insideRepo) return resolved
  }
  return yield* new ReviewSnapshotError({ message: `could not resolve trusted ${name} executable outside the reviewed checkout; use the explicit tool override` })
})
const capture = (executable: string, args: ReadonlyArray<string>, options?: CheckedProcessOptions) =>
  (executable.includes("/") ? Effect.succeed(executable) : trustedExecutable(executable)).pipe(Effect.flatMap((resolved) => checkedTrimmedText(resolved, args, options)))

const git = (args: ReadonlyArray<string>) => capture("git", args)
const optionalCapture = (executable: string, args: ReadonlyArray<string>) => capture(executable, args).pipe(Effect.option)
const branchTarget = (base: string, mode: "whole" | "branch" = "branch") => ({
  label: `${mode} against ${base}`,
  args: ["--base", base]
}) satisfies ReviewTarget

export const planReview = (mode: ReviewMode, base: string, commit: string, dirty: boolean): ReviewPlan => {
  if (mode === "commit") return { label: `commit ${commit}`, targets: [{ label: `commit ${commit}`, args: ["--commit", commit] }] }
  if (mode === "uncommitted" || mode === "local") return { label: mode, targets: [{ label: mode, args: ["--uncommitted"] }] }
  const branch = branchTarget(base, mode === "whole" ? "whole" : "branch")
  if ((mode === "auto" || mode === "whole") && dirty) {
    return {
      label: `current branch against ${base}, including uncommitted changes`,
      targets: [{ ...branch, snapshot: true }]
    }
  }
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

export const selectReviewPlan = Effect.fn("NativeReview.selectReviewPlan")(function*(mode: ReviewMode, base: Option.Option<string>, commit: string, refresh = true) {
  const needsBase = mode !== "commit" && mode !== "uncommitted" && mode !== "local"
  const selectedBase = Option.isSome(base) ? base.value : needsBase ? yield* discoverReviewBase() : "HEAD"
  if (needsBase) {
    if (refresh) yield* refreshReviewBase(selectedBase)
    yield* git(["rev-parse", "--verify", `${selectedBase}^{commit}`])
  }
  const dirty = (mode === "auto" || mode === "whole") && (yield* git(["status", "--porcelain"])).length > 0
  return planReview(mode, selectedBase, commit, dirty)
})

export interface ReviewIdentityOptions {
  readonly baseRefs?: ReadonlyArray<string>
  readonly commitRefs?: ReadonlyArray<string>
  readonly includeHead?: boolean
  readonly includeWorkingTree?: boolean
}

export const reviewIdentity = Effect.fn("NativeReview.reviewIdentity")(function*(options: ReviewIdentityOptions = {}) {
  const repo = yield* git(["rev-parse", "--show-toplevel"])
  const fromRoot = (args: ReadonlyArray<string>) => capture("git", args, { cwd: repo })
  const includeHead = options.includeHead ?? true
  const includeWorkingTree = options.includeWorkingTree ?? true
  const branch = includeHead ? yield* fromRoot(["symbolic-ref", "--quiet", "--short", "HEAD"]).pipe(Effect.orElseSucceed(() => "HEAD")) : undefined
  const head = includeHead ? yield* fromRoot(["rev-parse", "HEAD"]) : undefined
  const status = includeWorkingTree ? yield* fromRoot(["status", "--porcelain=v1", "-z"]) : ""
  const diff = includeWorkingTree ? yield* fromRoot(["diff", "--binary", "HEAD"]) : ""
  const untracked = includeWorkingTree ? yield* fromRoot(["ls-files", "--others", "--exclude-standard", "-z"]) : ""
  const paths = untracked.length === 0 ? [] : untracked.split("\0").filter((path) => path.length > 0)
  const fs = yield* FileSystem.FileSystem
  const pathService = yield* Path.Path
  const hashes = yield* Effect.forEach(paths, (path) => fs.readLink(pathService.resolve(repo, path)).pipe(
    Effect.map((target) => `symlink:${target}`),
    Effect.catch(() => fromRoot(["hash-object", "--", path]))
  ))
  const resolveRefs = (refs: ReadonlyArray<string>) => Effect.forEach(refs, (ref) => fromRoot(["rev-parse", "--verify", `${ref}^{commit}`]).pipe(Effect.map((oid) => [ref, oid] as const)))
  const bases = yield* resolveRefs(options.baseRefs ?? [])
  const commits = yield* resolveRefs(options.commitRefs ?? [])
  return JSON.stringify({ bases, commits, branch, head, status, diff, untracked: paths.map((path, index) => [path, hashes[index]]) })
})

const withReviewSnapshot = <A, E, R>(use: (cwd: string) => Effect.Effect<A, E, R>) => Effect.scoped(Effect.gen(function*() {
  const fs = yield* FileSystem.FileSystem
  const paths = yield* Path.Path
  const repo = yield* git(["rev-parse", "--show-toplevel"])
  const gitTool = yield* trustedExecutable("git")
  const root = yield* fs.makeTempDirectoryScoped({ prefix: "review-snapshot." })
  const snapshot = paths.join(root, "worktree")
  const cleanup = checkedInherit(gitTool, ["worktree", "remove", "--force", snapshot], { cwd: repo }).pipe(Effect.ignore)
  const lifecycle = Effect.gen(function*() {
    yield* checkedInherit(gitTool, ["worktree", "add", "--detach", snapshot, "HEAD"], { cwd: repo })
    for (const args of [["diff", "--binary", "--cached"], ["diff", "--binary"]]) {
      const patch = yield* checkedText(gitTool, args, { cwd: repo })
      if (patch.length > 0) yield* checkedInherit(gitTool, ["apply", "--whitespace=nowarn", "-"], { cwd: snapshot, stdin: patch })
    }
    const untracked = yield* checkedText(gitTool, ["ls-files", "--others", "--exclude-standard", "-z"], { cwd: repo })
    for (const file of untracked.split("\0").filter(Boolean)) {
      const source = paths.resolve(repo, file)
      const destination = paths.resolve(snapshot, file)
      if (!destination.startsWith(`${snapshot}${paths.sep}`)) return yield* new ReviewSnapshotError({ message: `refusing to copy untracked path outside snapshot: ${file}` })
      yield* fs.makeDirectory(paths.dirname(destination), { recursive: true })
      const linkTarget = yield* fs.readLink(source).pipe(Effect.option)
      if (Option.isSome(linkTarget)) yield* fs.symlink(linkTarget.value, destination)
      else yield* fs.copy(source, destination, { overwrite: true, preserveTimestamps: true })
    }
    yield* checkedInherit(gitTool, ["add", "-A"], { cwd: snapshot })
    yield* checkedInherit(gitTool, ["-c", "user.name=Review Snapshot", "-c", "user.email=review-snapshot@example.invalid", "commit", "--quiet", "--no-verify", "-m", "review snapshot"], { cwd: snapshot })
    return yield* use(snapshot)
  })
  return yield* lifecycle.pipe(Effect.ensuring(cleanup))
}))

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
  const execute = (snapshotCwd?: string) => {
    const reviews = Effect.forEach(options.plan.targets, (target) => checkedText(reviewer, ["review", ...target.args], snapshotCwd === undefined || !target.snapshot ? undefined : { cwd: snapshotCwd }).pipe(
      Effect.map((output) => options.plan.targets.length === 1 ? output : `[${target.label}]\n${output}`)
    )).pipe(Effect.map((outputs) => outputs.join("\n\n")))
    if (Option.isNone(options.testCommand)) return reviews
    const test = checkedText(shell, ["-lc", options.testCommand.value], { cwd: snapshotCwd ?? repo })
    return Effect.all([reviews, test], { concurrency: "unbounded" }).pipe(Effect.map(([output]) => output))
  }
  return yield* (options.plan.targets.some((target) => target.snapshot) ? withReviewSnapshot(execute) : execute())
})
