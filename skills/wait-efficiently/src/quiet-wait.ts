import { NodeRuntime, NodeServices } from "@effect/platform-node"
import { Clock, Console, Effect } from "effect"
import { Argument, Command } from "effect/unstable/cli"
import { parseWaitDuration, WaitDurationError } from "./Wait.ts"

const quietWait = Command.make(
  "quiet-wait",
  { duration: Argument.string("duration").pipe(Argument.withDescription("Duration such as 300, 30s, 5m, or 1h")) },
  Effect.fn("quietWait.handler")(function*({ duration }) {
    const requestedMilliseconds = yield* parseWaitDuration(duration)
    const started = yield* Clock.currentTimeMillis
    yield* Effect.sleep(requestedMilliseconds)
    const elapsed = yield* Clock.currentTimeMillis
    yield* Console.log(JSON.stringify({
      requested_seconds: requestedMilliseconds / 1_000,
      elapsed_seconds: Math.round(elapsed - started) / 1_000,
      status: "elapsed"
    }))
  })
).pipe(Command.withDescription("Sleep silently for a validated duration and print one completion record"))

quietWait.pipe(
  Command.run({ version: "1.0.0" }),
  // @effect-diagnostics-next-line strictEffectProvide:off
  Effect.provide(NodeServices.layer),
  Effect.tapError((error) => error instanceof WaitDurationError ? Console.error(error.message) : Effect.void),
  NodeRuntime.runMain({ disableErrorReporting: true })
)
