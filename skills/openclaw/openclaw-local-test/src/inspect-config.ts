import { NodeRuntime, NodeServices } from "@effect/platform-node"
import * as Console from "effect/Console"
import * as Effect from "effect/Effect"
import * as FileSystem from "effect/FileSystem"
import * as Predicate from "effect/Predicate"
import * as Schema from "effect/Schema"
import { Argument, Command } from "effect/unstable/cli"

const ConfigJson = Schema.fromJsonString(Schema.Record(Schema.String, Schema.Unknown))
const secretKey = /(api[-_]?key|token|secret|password|credential|cookie|authorization|baseurl|endpoint|proxy)/iu
const isObject = Predicate.isObject
const objectAt = (value: unknown, key: string) => isObject(value) && isObject(value[key]) ? value[key] : {}
const redact = (value: unknown): unknown => Array.isArray(value)
  ? value.map(redact)
  : isObject(value)
  ? Object.fromEntries(Object.entries(value).map(([key, nested]) => [key, secretKey.test(key) ? "[redacted]" : redact(nested)]))
  : value

const command = Command.make("inspect-config", {
  path: Argument.string("path")
}, Effect.fn("inspectConfig.handler")(function*({ path }) {
  const fs = yield* FileSystem.FileSystem
  const config = yield* fs.readFileString(path).pipe(Effect.flatMap(Schema.decodeUnknownEffect(ConfigJson)))
  const gateway = objectAt(config, "gateway")
  const agents = objectAt(config, "agents")
  const defaults = objectAt(agents, "defaults")
  const entries = Object.fromEntries(Object.entries(objectAt(agents, "entries")).map(([id, value]) => {
    const agent = isObject(value) ? value : {}
    return [id, { default: agent.default, model: agent.model, workspace: agent.workspace, tools: redact(agent.tools) }]
  }))
  const plugins = objectAt(config, "plugins")
  yield* Console.log(JSON.stringify({
    configPath: path,
    gateway: { mode: gateway.mode, bind: gateway.bind, auth: redact(gateway.auth) },
    agents: { defaults: { model: defaults.model, models: redact(defaults.models), workspace: defaults.workspace }, entries },
    tools: redact(config.tools),
    plugins: { allow: plugins.allow, entries: redact(plugins.entries) }
  }, null, 2))
})).pipe(Command.withDescription("Print a redacted OpenClaw local-test configuration summary"))

command.pipe(Command.run({ version: "1.0.0" }),
  // @effect-diagnostics-next-line strictEffectProvide:off
  Effect.provide(NodeServices.layer), NodeRuntime.runMain)
