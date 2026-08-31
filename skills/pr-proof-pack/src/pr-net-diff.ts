import { NodeRuntime, NodeServices } from "@effect/platform-node"
import * as Cause from "effect/Cause"
import * as Console from "effect/Console"
import * as Effect from "effect/Effect"
import * as Option from "effect/Option"
import { Argument, CliError, Command, Flag } from "effect/unstable/cli"

import { buildNetDiff, renderMarkdown } from "./NetDiff.ts"

const command = Command.make("pr-net-diff", {
  paths: Argument.string("paths").pipe(Argument.variadic),
  base: Flag.optional(Flag.string("base")), head: Flag.optional(Flag.string("head")),
  markdown: Flag.boolean("markdown"), json: Flag.boolean("json"), proofPlan: Flag.boolean("proof-plan")
}, Effect.fn("prNetDiff.handler")(function*({ paths, base, head, markdown, json, proofPlan }) {
  const report = yield* buildNetDiff(paths.filter((path): path is string => typeof path === "string"), {
    ...(Option.isSome(base) ? { base: base.value } : {}),
    ...(Option.isSome(head) ? { head: head.value } : {})
  })
  yield* Console.log(json ? JSON.stringify(report, null, 2) : renderMarkdown(report, proofPlan || markdown))
})).pipe(Command.withDescription("Summarize the net PR diff from its merge base to the selected head"))

const bufferedLogs: Array<ReadonlyArray<unknown>> = []
const bufferedConsole: Console.Console = Object.assign(Object.create(globalThis.console), {
  log: (...args: ReadonlyArray<unknown>) => bufferedLogs.push(args)
})
const flushLogs = (destination: "stdout" | "stderr") => Effect.sync(() => {
  for (const args of bufferedLogs) {
    if (destination === "stdout") globalThis.console.log(...args)
    else globalThis.console.error(...args)
  }
})
const reportCause = (cause: Cause.Cause<unknown>) => {
  const error = Cause.squash(cause)
  if (CliError.isCliError(error)) {
    return error._tag === "ShowHelp" && error.errors.length === 0
      ? flushLogs("stdout")
      : flushLogs("stderr")
  }
  return Effect.andThen(flushLogs("stderr"), Console.error(error instanceof Error ? error.message : Cause.pretty(cause)))
}
const reportUnbufferedCause = (cause: Cause.Cause<unknown>) => {
  const error = Cause.squash(cause)
  return CliError.isCliError(error) ? Effect.void : Console.error(error instanceof Error ? error.message : Cause.pretty(cause))
}
const machineReadable = process.argv.includes("--json") && !process.argv.includes("--wizard")
const program = command.pipe(Command.run({ version: "2.0.0" }))
const outputProgram = machineReadable
  ? program.pipe(
    Effect.provideService(Console.Console, bufferedConsole),
    Effect.tap(() => flushLogs("stdout")),
    Effect.tapCause(reportCause)
  )
  : program.pipe(Effect.tapCause(reportUnbufferedCause))

outputProgram.pipe(
  // @effect-diagnostics-next-line strictEffectProvide:off
  Effect.provide(NodeServices.layer),
  NodeRuntime.runMain({ disableErrorReporting: true }))
