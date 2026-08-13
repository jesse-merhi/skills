import { NodeRuntime, NodeServices } from "@effect/platform-node"
import { Console, Effect, FileSystem, Option, Path } from "effect"
import { Command, Flag } from "effect/unstable/cli"
import { reviewIdentity, runNativeReview, selectReviewPlan, untilReviewStable, type ReviewMode } from "./NativeReview.ts"

// Environment defaults are captured once at the CLI boundary.
// @effect-diagnostics-next-line processEnv:off
const defaultOutput = Option.fromNullishOr(process.env.CODEX_REVIEW_OUTPUT)

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
  const plan = yield* selectReviewPlan(args.mode as ReviewMode, args.base, args.commit)
  yield* Console.log(`codex-review target: ${plan.label}`)
  for (const target of plan.targets) yield* Console.log(`review: ${args.codexBin} review ${target.args.join(" ")}`)
  if (args.dryRun) return
  const result = yield* untilReviewStable({
    identity: reviewIdentity(),
    operation: selectReviewPlan(args.mode as ReviewMode, args.base, args.commit).pipe(
      Effect.flatMap((currentPlan) => runNativeReview({ codexBin: args.codexBin, plan: currentPlan, testCommand: args.parallelTests }).pipe(
        Effect.map((output) => ({ output, plan: currentPlan }))
      ))
    ),
    onChange: () => Console.error("review target changed while the review was running; reviewing the latest state")
  })
  const output = result.value.output
  const outputPath = Option.orElse(args.output, () => defaultOutput)
  if (Option.isSome(outputPath)) {
    const fileSystem = yield* FileSystem.FileSystem
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
