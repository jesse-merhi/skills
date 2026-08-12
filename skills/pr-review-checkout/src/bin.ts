import { NodeRuntime, NodeServices } from "@effect/platform-node"
import { Cause, Console, Effect, Layer } from "effect"
import { Argument, Command } from "effect/unstable/cli"
import { checkoutForReview, ExternalToolError, PullRequestNumber, ReviewTools } from "./PrReview.ts"
import { ReviewToolsLive } from "./ReviewToolsLive.ts"

const prReview = Command.make(
  "pr-review.sh",
  { prNumber: Argument.integer("pr-number").pipe(Argument.withSchema(PullRequestNumber)) },
  Effect.fn("prReview.handler")(function*({ prNumber }) {
    const result = yield* checkoutForReview(prNumber)
    yield* Console.log(result.lines.join("\n"))
    const tools = yield* ReviewTools
    yield* tools.openEditor(result.worktree)
  })
).pipe(Command.withDescription("Open a GitHub pull request in a local-backed VS Code review worktree"))

const Live = ReviewToolsLive.pipe(Layer.provideMerge(NodeServices.layer))

const externalErrorMessage = (error: ExternalToolError) => {
  const stderr = error.stderr?.trimEnd()
  if (stderr !== undefined && stderr.length > 0) {
    return stderr
  }
  return error.cause instanceof Error ? error.cause.message : error.operation
}

prReview.pipe(
  Command.run({ version: "1.0.0" }),
  // @effect-diagnostics-next-line strictEffectProvide:off
  Effect.provide(Live),
  Effect.tapCause((cause) => {
    const failure = Cause.squash(cause)
    return Console.error(
      failure instanceof ExternalToolError ? externalErrorMessage(failure) : Cause.pretty(cause)
    )
  }),
  NodeRuntime.runMain({ disableErrorReporting: true })
)
