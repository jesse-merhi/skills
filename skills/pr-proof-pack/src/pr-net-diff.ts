import { NodeRuntime, NodeServices } from "@effect/platform-node"
import { Console, Effect } from "effect"
import { Argument, Command, Flag } from "effect/unstable/cli"

import { buildNetDiff, renderMarkdown } from "./NetDiff.ts"

const command = Command.make("pr-net-diff", {
  paths: Argument.string("paths").pipe(Argument.variadic),
  markdown: Flag.boolean("markdown"), json: Flag.boolean("json"), proofPlan: Flag.boolean("proof-plan")
}, Effect.fn("prNetDiff.handler")(function*({ paths, markdown, json, proofPlan }) {
  const report = yield* buildNetDiff(paths.filter((path): path is string => typeof path === "string"))
  yield* Console.log(json ? JSON.stringify(report, null, 2) : renderMarkdown(report, proofPlan || markdown))
})).pipe(Command.withDescription("Summarize the net PR diff from its merge base to HEAD"))

command.pipe(Command.run({ version: "2.0.0" }),
  // @effect-diagnostics-next-line strictEffectProvide:off
  Effect.provide(NodeServices.layer), NodeRuntime.runMain)
