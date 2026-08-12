import { NodeRuntime, NodeServices } from "@effect/platform-node"
import { Cause, Console, Effect, Layer } from "effect"
import { Argument, Command } from "effect/unstable/cli"
import { checkoutForReview, PullRequestNumber } from "./PrReview.ts"
import { ReviewToolsLive } from "./ReviewToolsLive.ts"

const prReview = Command.make(
  "pr-review.sh",
  { prNumber: Argument.integer("pr-number").pipe(Argument.withSchema(PullRequestNumber)) },
  Effect.fn("prReview.handler")(function*({ prNumber }) {
    const result = yield* checkoutForReview(prNumber)
    yield* Console.log(result.lines.join("\n"))
  })
).pipe(Command.withDescription("Open a GitHub pull request in a local-backed VS Code review worktree"))

const Live = ReviewToolsLive.pipe(Layer.provideMerge(NodeServices.layer))

prReview.pipe(
  Command.run({ version: "1.0.0" }),
  // @effect-diagnostics-next-line strictEffectProvide:off
  Effect.provide(Live),
  Effect.tapCause((cause) => Console.error(Cause.pretty(cause))),
  NodeRuntime.runMain({ disableErrorReporting: true })
)
