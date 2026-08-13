import { NodeRuntime, NodeServices } from "@effect/platform-node"
import { Cause, Console, Effect, Layer } from "effect"
import { Argument, CliError, Command } from "effect/unstable/cli"
import { checkoutForReview, ExternalToolError, PullRequestNumber, ReviewTools } from "./PrReview.ts"
import { ReviewToolsLive } from "./ReviewToolsLive.ts"

const prReview = Command.make(
  "pr-review",
  { prNumber: Argument.integer("pr-number").pipe(Argument.withSchema(PullRequestNumber)) },
  Effect.fn("prReview.handler")(function*({ prNumber }) {
    const result = yield* checkoutForReview(prNumber)
    yield* Console.log(result.lines.join("\n"))
    const tools = yield* ReviewTools
    yield* tools.openEditor(result.worktree)
  })
).pipe(Command.withDescription("Open a GitHub pull request in a local-backed VS Code review worktree"))

const Live = ReviewToolsLive.pipe(Layer.provideMerge(NodeServices.layer))

const reportExternalError = (error: ExternalToolError) => error.stderr !== undefined
  ? Effect.sync(() => globalThis.process.stderr.write(error.stderr ?? ""))
  : Console.error(error.cause instanceof Error ? error.cause.message : error.operation)

prReview.pipe(
  Command.run({ version: "1.0.0" }),
  // @effect-diagnostics-next-line strictEffectProvide:off
  Effect.provide(Live),
  Effect.tapCause((cause) => {
    const failure = Cause.squash(cause)
    if (CliError.isCliError(failure)) {
      return Effect.void
    }
    return failure instanceof ExternalToolError
      ? reportExternalError(failure)
      : Console.error(Cause.pretty(cause))
  }),
  NodeRuntime.runMain({ disableErrorReporting: true })
)
