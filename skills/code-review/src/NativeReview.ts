import { Effect, Option, Schema } from "effect"
import { checkedText, checkedTrimmedText } from "../../../packages/effect-cli/CheckedProcess.ts"

export type ReviewMode = "auto" | "whole" | "local" | "uncommitted" | "branch" | "commit"

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

const capture = checkedTrimmedText

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
  if (mode === "auto" && dirty) {
    return {
      label: `current branch against ${base}, including uncommitted changes`,
      targets: [branch, { label: "uncommitted overlay", args: ["--uncommitted"] }]
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
  return yield* git(["symbolic-ref", "--quiet", "--short", "HEAD"])
})

export const selectReviewPlan = Effect.fn("NativeReview.selectReviewPlan")(function*(mode: ReviewMode, base: Option.Option<string>, commit: string) {
  const needsBase = mode !== "commit" && mode !== "uncommitted" && mode !== "local"
  const selectedBase = Option.isSome(base) ? base.value : needsBase ? yield* discoverReviewBase() : "HEAD"
  if (needsBase) yield* git(["rev-parse", "--verify", `${selectedBase}^{commit}`])
  const dirty = mode === "auto" && (yield* git(["status", "--porcelain"])) .length > 0
  return planReview(mode, selectedBase, commit, dirty)
})

export const reviewIdentity = Effect.fn("NativeReview.reviewIdentity")(function*() {
  const [head, status, diff, untracked] = yield* Effect.all([
    git(["rev-parse", "HEAD"]),
    git(["status", "--porcelain=v1", "-z"]),
    git(["diff", "--binary", "HEAD"]),
    git(["ls-files", "--others", "--exclude-standard", "-z"])
  ])
  const paths = untracked.length === 0 ? [] : untracked.split("\0").filter((path) => path.length > 0)
  const hashes = yield* Effect.forEach(paths, (path) => git(["hash-object", "--", path]))
  return JSON.stringify({ head, status, diff, untracked: paths.map((path, index) => [path, hashes[index]]) })
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
  const reviews = Effect.forEach(options.plan.targets, (target) => checkedText(options.codexBin, ["review", ...target.args]).pipe(
    Effect.map((output) => options.plan.targets.length === 1 ? output : `[${target.label}]\n${output}`)
  )).pipe(Effect.map((outputs) => outputs.join("\n\n")))
  if (Option.isNone(options.testCommand)) return yield* reviews
  const test = checkedText("sh", ["-lc", options.testCommand.value])
  const [output] = yield* Effect.all([reviews, test], { concurrency: "unbounded" })
  return output
})
