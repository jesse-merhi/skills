import { NodeRuntime, NodeServices } from "@effect/platform-node"
import * as Console from "effect/Console"
import * as Effect from "effect/Effect"
import * as FileSystem from "effect/FileSystem"
import * as Option from "effect/Option"
import * as Path from "effect/Path"
import { Command, Flag } from "effect/unstable/cli"

import { reviewIdentity, runNativeReview, selectReviewPlan, untilReviewStable } from "./NativeReview.ts"

// Environment defaults are captured once at the CLI boundary.
// @effect-diagnostics-next-line processEnv:off
const defaultOutput = Option.fromNullishOr(process.env.CODEX_REVIEW_OUTPUT).pipe(Option.filter((path) => path.length > 0))

const review = Command.make("codex-review", {
  mode: Flag.choice("mode", ["auto", "whole", "local", "uncommitted", "branch", "commit"] as const).pipe(Flag.withDefault("auto")),
  base: Flag.optional(Flag.string("base")),
  commit: Flag.string("commit").pipe(Flag.withDefault("HEAD")),
  // Environment defaults are read at the CLI boundary.
  // @effect-diagnostics-next-line processEnv:off
  codexBin: Flag.string("codex-bin").pipe(Flag.withDefault(process.env.CODEX_BIN ?? "codex")),
  output: Flag.optional(Flag.string("output")),
  parallelTests: Flag.optional(Flag.string("parallel-tests")),
  dryRun: Flag.boolean("dry-run")
}, Effect.fn("codexReview.handler")(function*(args) {
  const outputPath = Option.orElse(args.output, () => defaultOutput)
  const fileSystem = yield* FileSystem.FileSystem
  if (!args.dryRun && Option.isSome(outputPath)) yield* fileSystem.remove(outputPath.value, { force: true })
  const plan = yield* selectReviewPlan(args.mode, args.base, args.commit, !args.dryRun)
  yield* Console.log(`codex-review target: ${plan.label}`)
  if (plan.targets.some((target) => target.snapshot)) yield* Console.log("snapshot: temporary worktree with local overlay")
  for (const target of plan.targets) yield* Console.log(`review: ${args.codexBin} review ${target.args.join(" ")}`)
  if (args.dryRun) return
  const currentIdentity = selectReviewPlan(args.mode, args.base, args.commit).pipe(Effect.flatMap((currentPlan) => {
    const refsFor = (flag: "--base" | "--commit") => currentPlan.targets.flatMap((target) => {
      const index = target.args.indexOf(flag)
      return index < 0 ? [] : [target.args[index + 1] ?? ""]
    }).filter((ref) => ref.length > 0)
    const commitRefs = refsFor("--commit")
    const includeWorkingTree = currentPlan.targets.some((target) => target.snapshot || target.args.includes("--uncommitted"))
    return reviewIdentity({
      baseRefs: refsFor("--base"),
      commitRefs,
      includeHead: commitRefs.length === 0,
      includeWorkingTree
    })
  }))
  const result = yield* untilReviewStable({
    identity: currentIdentity,
    operation: selectReviewPlan(args.mode, args.base, args.commit).pipe(
      Effect.flatMap((currentPlan) => runNativeReview({ codexBin: args.codexBin, plan: currentPlan, testCommand: args.parallelTests }).pipe(
        Effect.map((output) => ({ output, plan: currentPlan }))
      ))
    ),
    onChange: () => Console.error("review target changed while the review was running; reviewing the latest state")
  })
  const output = result.value.output
  if (Option.isSome(outputPath)) {
    const paths = yield* Path.Path
    yield* fileSystem.makeDirectory(paths.dirname(outputPath.value), { recursive: true })
    yield* fileSystem.writeFileString(outputPath.value, output)
  }
  if (output.length > 0) yield* Console.log(output)
  yield* Console.log(`codex-review complete${result.runs > 1 ? ` after ${result.runs} runs` : ""}`)
})).pipe(Command.withDescription("Run the native Codex review command against a resolved Git target"))

review.pipe(Command.run({ version: "2.0.0" }),
  // @effect-diagnostics-next-line strictEffectProvide:off
  Effect.provide(NodeServices.layer), NodeRuntime.runMain)
