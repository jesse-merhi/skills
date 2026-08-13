import { NodeRuntime, NodeServices } from "@effect/platform-node"
import { Console, Effect, Schema } from "effect"
import { Argument, Command, Flag } from "effect/unstable/cli"
import { ChildProcess, ChildProcessSpawner } from "effect/unstable/process"

const AtlassianSite = Schema.String.pipe(Schema.check(Schema.isPattern(/^https:\/\/[A-Za-z0-9.-]+\.atlassian\.net\/?$/u)))
const command = Command.make("rovodev-atlassian", {
  site: Flag.string("site").pipe(Flag.withSchema(AtlassianSite)),
  request: Argument.string("request").pipe(Argument.atLeast(1))
}, Effect.fn("rovodevAtlassian.handler")(function*({ site, request }) {
  const prompt = `Use the authenticated Atlassian MCP tools read-only on site_url exactly ${site}. Do not use another Atlassian site. ${request.join(" ")} Do not create, edit, delete, or comment on anything. Return the live Jira or Confluence result and include the JQL or CQL used when applicable.`
  const spawner = yield* ChildProcessSpawner.ChildProcessSpawner
  const process = ChildProcess.make("acli", ["rovodev", "legacy", prompt], { env: { NO_COLOR: "1", TERM: "dumb" }, extendEnv: true })
  const output = yield* spawner.string(process)
  yield* Console.log(output)
})).pipe(Command.withDescription("Run one read-only request through the authenticated Atlassian gateway"))

command.pipe(Command.run({ version: "2.0.0" }),
  // @effect-diagnostics-next-line strictEffectProvide:off
  Effect.provide(NodeServices.layer), NodeRuntime.runMain)
