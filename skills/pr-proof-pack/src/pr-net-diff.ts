import { NodeRuntime, NodeServices } from "@effect/platform-node"
import * as Cause from "effect/Cause"
import * as Console from "effect/Console"
import * as Effect from "effect/Effect"
import * as Option from "effect/Option"
import { Argument, Command, Flag } from "effect/unstable/cli"

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

command.pipe(Command.run({ version: "2.0.0" }),
  // @effect-diagnostics-next-line strictEffectProvide:off
  Effect.provide(NodeServices.layer),
  Effect.tapCause((cause) => Console.error(Cause.pretty(cause))),
  NodeRuntime.runMain({ disableErrorReporting: true }))
