import { NodeRuntime, NodeServices } from "@effect/platform-node"
import * as Effect from "effect/Effect"
import * as Option from "effect/Option"
import * as Runtime from "effect/Runtime"
import { Command, Flag } from "effect/unstable/cli"

import { openclawLocalTest } from "./OpenclawLocalTest.ts"

// Environment defaults are captured once at the CLI boundary.
const environment = process.env
const isTruthy = (value: string | undefined) => value !== undefined && !["", "0", "false", "no", "off"].includes(value.toLowerCase())
const optionalEnvironment = (value: string | undefined) => value === undefined || value.length === 0 ? Option.none<string>() : Option.some(value)
const optionalEnvironmentPort = (value: string | undefined) => {
  const port = Number(value)
  return value !== undefined && /^\d+$/u.test(value) && Number.isSafeInteger(port) && port > 0 && port <= 65_535 ? Option.some(port) : Option.none<number>()
}
const command = Command.make("openclaw-local-test", {
  repo: Flag.string("repo").pipe(Flag.withDefault(environment.OPENCLAW_LOCAL_TEST_REPO ?? "")), stateDir: Flag.string("state-dir").pipe(Flag.withDefault(environment.OPENCLAW_LOCAL_TEST_STATE_DIR ?? "~/.openclaw-local-test")),
  baseConfig: Flag.optional(Flag.string("base-config")), runtime: Flag.string("runtime").pipe(Flag.withDefault(environment.OPENCLAW_LOCAL_TEST_RUNTIME ?? "auto")), inspect: Flag.boolean("inspect"),
  port: Flag.optional(Flag.integer("port")), proxyPort: Flag.optional(Flag.integer("proxy-port")), model: Flag.optional(Flag.string("model")), browser: Flag.string("browser").pipe(Flag.withDefault(environment.OPENCLAW_LOCAL_TEST_BROWSER ?? "Google Chrome")),
  open: Flag.boolean("open"), noOpen: Flag.boolean("no-open"), ttl: Flag.string("ttl").pipe(Flag.withDefault(environment.OPENCLAW_LOCAL_TEST_TTL ?? "8h")), noTtl: Flag.boolean("no-ttl"),
  noChannels: Flag.boolean("no-channels"), foreground: Flag.boolean("foreground"), status: Flag.boolean("status"), stop: Flag.boolean("stop")
}, Effect.fn("Openclaw.cli")(function*(args) {
  yield* openclawLocalTest({ ...args, baseConfig: Option.orElse(args.baseConfig, () => optionalEnvironment(environment.OPENCLAW_LOCAL_TEST_BASE_CONFIG)), model: Option.orElse(args.model, () => optionalEnvironment(environment.OPENCLAW_LOCAL_TEST_MODEL)), proxyPort: Option.orElse(args.proxyPort, () => optionalEnvironmentPort(environment.OPENCLAW_LOCAL_TEST_PROXY_PORT)), open: args.open && !args.noOpen, ttl: args.noTtl ? "0" : args.ttl, skipChannels: args.noChannels, startPort: Number(environment.OPENCLAW_LOCAL_TEST_PORT ?? 19010), gatewayPort: args.port, proxyDir: environment.OPENCLAW_LOCAL_TEST_PROXY_DIR ?? "~/.openclaw-local-test-proxy", startLockDir: environment.OPENCLAW_LOCAL_TEST_LOCK_DIR ?? "~/.openclaw-local-test-start.lock", keepSessions: isTruthy(environment.OPENCLAW_LOCAL_TEST_KEEP_SESSIONS), action: args.inspect ? "inspect" : args.stop ? "stop" : args.status ? "status" : "start" })
})).pipe(Command.withDescription("Manage an isolated OpenClaw gateway using an existing Codex or Claude login"))

let receivedSigterm = false
process.once("SIGTERM", () => { receivedSigterm = true })
command.pipe(Command.run({ version: "2.0.0" }),
  // @effect-diagnostics-next-line strictEffectProvide:off
  Effect.provide(NodeServices.layer), NodeRuntime.runMain({
  disableErrorReporting: false,
  teardown: (exit, onExit) => receivedSigterm ? onExit(143) : Runtime.defaultTeardown(exit, onExit)
}))
