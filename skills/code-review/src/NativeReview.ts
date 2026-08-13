import { Effect, Option, Schema } from "effect"
import { ChildProcess, ChildProcessSpawner } from "effect/unstable/process"

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

const capture = Effect.fn("NativeReview.capture")(function*(command: string, args: ReadonlyArray<string>) {
  const spawner = yield* ChildProcessSpawner.ChildProcessSpawner
  return yield* spawner.string(ChildProcess.make(command, args)).pipe(Effect.map((output) => output.trim()))
})

const git = (args: ReadonlyArray<string>) => capture("git", args)
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

export const selectReviewPlan = Effect.fn("NativeReview.selectReviewPlan")(function*(mode: ReviewMode, base: Option.Option<string>, commit: string) {
  const selectedBase = Option.getOrElse(base, () => "origin/main")
  if (mode !== "commit" && mode !== "uncommitted" && mode !== "local") yield* git(["rev-parse", "--verify", `${selectedBase}^{commit}`])
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
  const spawner = yield* ChildProcessSpawner.ChildProcessSpawner
  const reviews = Effect.forEach(options.plan.targets, (target) => spawner.string(ChildProcess.make(options.codexBin, ["review", ...target.args])).pipe(
    Effect.map((output) => options.plan.targets.length === 1 ? output : `[${target.label}]\n${output}`)
  )).pipe(Effect.map((outputs) => outputs.join("\n\n")))
  if (Option.isNone(options.testCommand)) return yield* reviews
  const test = spawner.string(ChildProcess.make("sh", ["-lc", options.testCommand.value]))
  const [output] = yield* Effect.all([reviews, test], { concurrency: "unbounded" })
  return output
})
