import * as Console from "effect/Console"
import * as Effect from "effect/Effect"
import * as Exit from "effect/Exit"
import * as FileSystem from "effect/FileSystem"
import * as Option from "effect/Option"
import * as Path from "effect/Path"
import * as Schedule from "effect/Schedule"
import * as Schema from "effect/Schema"
import { createConnection, type Socket } from "node:net"

import { capture, encodeEnv, expandHome, LocalTestError, parseTtl, pidRunning, portOwnedByPid, readEnv, readPid, run, startDetached, stopPid, waitForUrl } from "../../shared/LocalTest.ts"

const RuntimeProfile = Schema.Struct({ id: Schema.String, auth: Schema.String, route: Schema.String, model: Schema.String, modelRef: Schema.String, runtimeId: Schema.String, pluginId: Schema.String })
type RuntimeProfile = typeof RuntimeProfile.Type
const WizardStart = Schema.Union([
  Schema.Struct({ done: Schema.Literal(true), status: Schema.Literal("done") }),
  Schema.Struct({ done: Schema.Literal(false), status: Schema.Literal("running"), sessionId: Schema.String })
])
const WizardStatus = Schema.Struct({ status: Schema.Literal("running") })
const WizardCancel = Schema.Struct({ status: Schema.Literal("cancelled") })
const UnknownJson = Schema.fromJsonString(Schema.Unknown)
const portIsFree = (port: number) => Effect.callback<boolean>((resume) => { let socket: Socket | undefined; const done = (free: boolean) => { socket?.destroy(); resume(Effect.succeed(free)) }; socket = createConnection({ host: "127.0.0.1", port }).once("connect", () => done(false)).once("error", () => done(true)); return Effect.sync(() => socket?.destroy()) })
export const choosePorts = Effect.fn("Openclaw.choosePorts")(function*(start: number, gateway: Option.Option<number>, proxy: Option.Option<number>) {
  let candidate = Option.getOrElse(gateway, () => start)
  while (candidate < 65_533) {
    const proxyPort = Option.getOrElse(proxy, () => candidate + 1)
    const portsDistinct = candidate !== proxyPort && candidate + 2 !== proxyPort
    const [gatewayFree, proxyFree, companionFree] = yield* Effect.all([portIsFree(candidate), portIsFree(proxyPort), portIsFree(candidate + 2)])
    if (portsDistinct && gatewayFree && proxyFree && companionFree) return { gateway: candidate, proxy: proxyPort }
    if (Option.isSome(proxy) && !proxyFree) return yield* new LocalTestError({ message: `requested proxy port is busy: ${proxyPort}` })
    if (Option.isSome(gateway)) return yield* new LocalTestError({ message: `requested port range is busy: gateway=${candidate} proxy=${proxyPort}` })
    candidate += 10
  }
  return yield* new LocalTestError({ message: "no free three-port range" })
})
const health = (url: string) => Effect.tryPromise(() => fetch(url)).pipe(Effect.map((response) => response.ok), Effect.catch(() => Effect.succeed(false)))
const waitForPortFree = (port: number) => portIsFree(port).pipe(Effect.flatMap((free) => free ? Effect.void : new LocalTestError({ message: `port ${port} is still busy` })), Effect.retry({ times: 50, schedule: Schedule.spaced("100 millis") }))

export interface OpenclawOptions {
  readonly repo: string; readonly stateDir: string; readonly baseConfig: Option.Option<string>; readonly runtime: string; readonly model: Option.Option<string>
  readonly startPort: number; readonly gatewayPort: Option.Option<number>; readonly proxyPort: Option.Option<number>; readonly browser: string; readonly ttl: string
  readonly open: boolean; readonly foreground: boolean; readonly skipChannels: boolean; readonly action: "start" | "status" | "stop" | "inspect"
  readonly proxyDir: string; readonly startLockDir: string; readonly keepSessions: boolean
}

export const openclawLocalTest = Effect.fn("Openclaw.localTest")(function*(raw: OpenclawOptions) {
  const fs = yield* FileSystem.FileSystem, paths = yield* Path.Path
  const repo = expandHome(raw.repo), state = expandHome(raw.stateDir), proxyRoot = expandHome(raw.proxyDir), startLockDir = expandHome(raw.startLockDir)
  const runDir = paths.join(state, "run"), logs = paths.join(state, "logs"), workspace = paths.join(state, "workspace"), config = paths.join(state, "openclaw.json")
  const routes = paths.join(proxyRoot, "routes"), proxyLogs = paths.join(proxyRoot, "logs")
  const files = { gateway: paths.join(runDir, "gateway.pid"), watchdog: paths.join(runDir, "watchdog.pid"), ports: paths.join(runDir, "ports.env"), instance: paths.join(runDir, "instance.env"), sharedProxy: paths.join(proxyRoot, "shared-browser-proxy.pid"), sharedProxyVersion: paths.join(proxyRoot, "shared-browser-proxy.version"), lockOwner: paths.join(startLockDir, "owner.env") }
  const profileScript = new URL("../scripts/runtime-profile.mjs", import.meta.url).pathname
  const proxyScript = new URL("./shared-browser-proxy.ts", import.meta.url).pathname
  yield* Effect.forEach([state, workspace, runDir, logs, routes, proxyLogs], (directory) => fs.makeDirectory(directory, { recursive: true, mode: 0o700 }), { discard: true })
  const removeRoute = Effect.gen(function*() { const ports = yield* fs.readFileString(files.ports).pipe(Effect.map(readEnv), Effect.option); if (Option.isSome(ports) && ports.value.OPENCLAW_LOCAL_TEST_PROXY_PORT !== undefined) { const port = Number(ports.value.OPENCLAW_LOCAL_TEST_PROXY_PORT); yield* fs.remove(paths.join(routes, `${port}.json`), { force: true }); yield* waitForPortFree(port).pipe(Effect.ignore) } })
  const stop = Effect.gen(function*() { const ports = yield* fs.readFileString(files.ports).pipe(Effect.map(readEnv), Effect.option); yield* stopPid("gateway", files.gateway); if (Option.isSome(ports) && ports.value.OPENCLAW_LOCAL_TEST_GATEWAY_PORT !== undefined) yield* waitForPortFree(Number(ports.value.OPENCLAW_LOCAL_TEST_GATEWAY_PORT)).pipe(Effect.ignore); yield* removeRoute; yield* stopPid("watchdog", files.watchdog); yield* fs.remove(files.instance, { force: true }) })
  const acquireStartLock = Effect.gen(function*() {
    yield* fs.makeDirectory(paths.dirname(startLockDir), { recursive: true })
    for (let attempt = 0; attempt < 600; attempt += 1) {
      const creation = yield* Effect.exit(fs.makeDirectory(startLockDir, { mode: 0o700 }))
      if (Exit.isSuccess(creation)) {
        yield* fs.writeFileString(files.lockOwner, encodeEnv({ pid: process.pid, state_dir: state, started_at: Math.floor(Date.now() / 1_000) }), { mode: 0o600 })
        return
      }
      if (!(yield* fs.exists(startLockDir))) return yield* Effect.failCause(creation.cause)
      const owner = yield* fs.readFileString(files.lockOwner).pipe(Effect.map(readEnv), Effect.option)
      const ownerPid = Option.isSome(owner) ? Number(owner.value.pid) : undefined
      if (!(yield* pidRunning(Number.isSafeInteger(ownerPid) ? ownerPid : undefined))) {
        yield* fs.remove(files.lockOwner, { force: true })
        yield* fs.remove(startLockDir, { recursive: false }).pipe(Effect.ignore)
        continue
      }
      if (attempt === 0) yield* Console.error(`waiting for OpenClaw startup lock: ${startLockDir}`)
      yield* Effect.sleep("500 millis")
    }
    return yield* new LocalTestError({ message: `timed out waiting for OpenClaw startup lock: ${startLockDir}` })
  })
  const releaseStartLock = fs.remove(startLockDir, { recursive: true, force: true }).pipe(Effect.ignore)
  const rotateAgentSessions = Effect.gen(function*() {
    if (raw.keepSessions) return
    const agents = paths.join(state, "agents")
    if (!(yield* fs.exists(agents))) return
    const agentNames = yield* fs.readDirectory(agents)
    const stamp = new Date().toISOString().replace(/:/gu, "-").replace(/\.\d{3}Z$/u, "Z")
    yield* Effect.forEach(agentNames, (agent) => Effect.gen(function*() {
      const sessions = paths.join(agents, agent, "sessions")
      if (!(yield* fs.exists(sessions)) || (yield* fs.readDirectory(sessions)).length === 0) return
      let backup = `${sessions}.bak.${stamp}`
      for (let suffix = 1; yield* fs.exists(backup); suffix += 1) backup = `${sessions}.bak.${stamp}.${suffix}`
      yield* fs.rename(sessions, backup)
    }), { discard: true })
  })
  if (raw.action === "stop") return yield* stop
  const status = Effect.gen(function*() {
    const ports = yield* fs.readFileString(files.ports).pipe(Effect.map(readEnv), Effect.option), gatewayPid = yield* readPid(files.gateway), proxyPid = yield* readPid(files.sharedProxy)
    const gatewayPort = Option.isSome(ports) ? ports.value.OPENCLAW_LOCAL_TEST_GATEWAY_PORT : undefined, proxyPort = Option.isSome(ports) ? ports.value.OPENCLAW_LOCAL_TEST_PROXY_PORT : undefined
    const gatewayOk = gatewayPort === undefined ? false : yield* health(`http://127.0.0.1:${gatewayPort}/healthz`), proxyOk = proxyPort === undefined ? false : yield* health(`http://127.0.0.1:${proxyPort}/healthz`)
    yield* Console.log([`State: ${state}`, ...(Option.isSome(ports) ? Object.entries(ports.value).map(([key, value]) => `Port: ${key}=${value}`) : []), `Gateway: ${(yield* pidRunning(gatewayPid)) ? `running pid ${gatewayPid}` : "stopped"}`, `Gateway health: ${gatewayOk ? `healthy http://127.0.0.1:${gatewayPort}/healthz` : "unhealthy"}`, `browser proxy: ${(yield* pidRunning(proxyPid)) ? `running shared daemon pid ${proxyPid} route port ${proxyPort}` : "stopped"}`, `browser proxy health: ${proxyOk ? `healthy http://127.0.0.1:${proxyPort}/healthz` : "unhealthy"}`].join("\n"))
  })
  if (raw.action === "status") return yield* status
  const profileArgs = [raw.action === "inspect" ? "inspect" : "configure", "--runtime", raw.runtime, ...(Option.isSome(raw.model) ? ["--model", raw.model.value] : [])]
  if (raw.action === "inspect") { const output = yield* capture(process.execPath, [profileScript, ...profileArgs]); return yield* Console.log(output) }
  if (repo.length === 0 || (!(yield* fs.exists(paths.join(repo, "openclaw.mjs"))) && !(yield* fs.exists(paths.join(repo, "dist/index.js"))))) return yield* new LocalTestError({ message: `not an OpenClaw checkout: ${repo}` })
  const ttl = yield* Effect.try({ try: () => parseTtl(raw.ttl), catch: (cause) => new LocalTestError({ message: `invalid --ttl value: ${raw.ttl}`, cause }) })
  const startup = Effect.gen(function*() {
  yield* stop
  yield* rotateAgentSessions
  const ports = yield* choosePorts(raw.startPort, raw.gatewayPort, raw.proxyPort)
  profileArgs.push("--config-out", config, "--state-dir", state, "--workspace-dir", workspace, "--gateway-port", String(ports.gateway), "--proxy-port", String(ports.proxy), ...(Option.isSome(raw.baseConfig) ? ["--base-config", expandHome(raw.baseConfig.value)] : []))
  const profile = yield* capture(process.execPath, [profileScript, ...profileArgs]).pipe(Effect.flatMap(Schema.decodeUnknownEffect(Schema.fromJsonString(RuntimeProfile))))
  yield* fs.writeFileString(files.ports, encodeEnv({ OPENCLAW_LOCAL_TEST_GATEWAY_PORT: ports.gateway, OPENCLAW_LOCAL_TEST_PROXY_PORT: ports.proxy, OPENCLAW_LOCAL_TEST_RUNTIME: profile.id, OPENCLAW_LOCAL_TEST_PROVIDER_ID: profile.modelRef.split("/")[0] ?? "", OPENCLAW_LOCAL_TEST_MODEL_ID: profile.model, OPENCLAW_LOCAL_TEST_MODEL_REF: profile.modelRef, OPENCLAW_LOCAL_TEST_BROWSER: raw.browser }), { mode: 0o600 })
  const sharedProxyVersion = "2026-08-13.1"
  const sharedPid = yield* readPid(files.sharedProxy)
  const installedVersion = yield* fs.readFileString(files.sharedProxyVersion).pipe(Effect.map((value) => value.trim()), Effect.option)
  const proxyCurrent = (yield* pidRunning(sharedPid)) && Option.isSome(installedVersion) && installedVersion.value === sharedProxyVersion
  if (!proxyCurrent) {
    yield* stopPid("shared browser proxy", files.sharedProxy)
    const pid = yield* startDetached(process.execPath, [proxyScript], { env: { OPENCLAW_SHARED_PROXY_HOST: "127.0.0.1", OPENCLAW_SHARED_PROXY_ROUTE_DIR: routes }, stdout: `${proxyLogs}/shared-browser-proxy.log`, stderr: `${proxyLogs}/shared-browser-proxy.err.log` })
    yield* fs.writeFileString(files.sharedProxy, `${pid}\n`)
    yield* fs.writeFileString(files.sharedProxyVersion, `${sharedProxyVersion}\n`, { mode: 0o600 })
  }
  const entrypoint = (yield* fs.exists(paths.join(repo, "scripts/run-node.mjs"))) ? paths.join(repo, "scripts/run-node.mjs") : (yield* fs.exists(paths.join(repo, "openclaw.mjs"))) ? paths.join(repo, "openclaw.mjs") : paths.join(repo, "dist/index.js")
  const gatewayEnv = { OPENCLAW_STATE_DIR: state, OPENCLAW_CONFIG_PATH: config, OPENCLAW_GATEWAY_PORT: String(ports.gateway), ...(raw.skipChannels ? { OPENCLAW_SKIP_CHANNELS: "1" } : {}) }
  const gatewayArgs = [entrypoint, "gateway", "run", "--port", String(ports.gateway), "--bind", "loopback"]
  if (raw.foreground) return yield* run(process.execPath, gatewayArgs, repo, gatewayEnv)
  const start = Effect.gen(function*() {
    const pid = yield* startDetached(process.execPath, gatewayArgs, { cwd: repo, env: gatewayEnv, stdout: `${logs}/gateway.log`, stderr: `${logs}/gateway.err.log` }); yield* fs.writeFileString(files.gateway, `${pid}\n`)
    const routeFile = paths.join(routes, `${ports.proxy}.json`); yield* fs.writeFileString(routeFile, JSON.stringify({ proxyPort: ports.proxy, targetHost: "127.0.0.1", targetPort: ports.gateway, gatewayPid: pid, stateDir: state, updatedAt: new Date().toISOString() }, null, 2) + "\n", { mode: 0o600 })
    yield* waitForUrl(`http://127.0.0.1:${ports.gateway}/healthz`, 200); yield* waitForUrl(`http://127.0.0.1:${ports.proxy}/healthz`, 200)
    if (!(yield* portOwnedByPid(ports.gateway, pid))) return yield* new LocalTestError({ message: `gateway port ${ports.gateway} is not owned by process ${pid}` })
    const proxyPid = yield* readPid(files.sharedProxy)
    if (proxyPid === undefined || !(yield* portOwnedByPid(ports.proxy, proxyPid))) return yield* new LocalTestError({ message: `browser proxy port ${ports.proxy} is not owned by the shared proxy process` })
    const cliArgs = [entrypoint, "gateway", "call"]
    const rpc = (method: string, params: object) => capture(process.execPath, [...cliArgs, method, "--params", JSON.stringify(params), "--timeout", "5000", "--json"], repo, gatewayEnv).pipe(
      Effect.flatMap((output) => Schema.decodeUnknownEffect(UnknownJson)(output).pipe(
        Effect.mapError((cause) => new LocalTestError({ message: `${method} returned invalid JSON`, cause }))
      ))
    )
    const started = yield* rpc("wizard.start", { mode: "local" }).pipe(Effect.flatMap(Schema.decodeUnknownEffect(WizardStart)))
    if (!started.done) {
      const sessionId = started.sessionId
      if (sessionId.trim().length === 0) return yield* new LocalTestError({ message: "wizard readiness probe returned an empty session" })
      const cancel = rpc("wizard.cancel", { sessionId }).pipe(Effect.flatMap(Schema.decodeUnknownEffect(WizardCancel)))
      yield* rpc("wizard.status", { sessionId }).pipe(
        Effect.flatMap(Schema.decodeUnknownEffect(WizardStatus)),
        Effect.tapError(() => Console.error(`wizard readiness probe could not verify session ${sessionId}`)),
        Effect.ensuring(cancel.pipe(Effect.orDie))
      )
    }
    const now = Math.floor(Date.now() / 1_000), expires = ttl === 0 ? 0 : now + ttl
    yield* fs.writeFileString(files.instance, encodeEnv({ OPENCLAW_LOCAL_TEST_STATE_DIR: state, OPENCLAW_LOCAL_TEST_GATEWAY_PORT: ports.gateway, OPENCLAW_LOCAL_TEST_PROXY_PORT: ports.proxy, OPENCLAW_LOCAL_TEST_PROVIDER_ID: profile.modelRef.split("/")[0] ?? "", OPENCLAW_LOCAL_TEST_MODEL_ID: profile.model, OPENCLAW_LOCAL_TEST_BROWSER: raw.browser, OPENCLAW_LOCAL_TEST_TTL: raw.ttl, OPENCLAW_LOCAL_TEST_STARTED_AT: now, OPENCLAW_LOCAL_TEST_EXPIRES_AT: expires }), { mode: 0o600 })
    if (ttl > 0) { const self = new URL("../scripts/openclaw-local-test", import.meta.url).pathname; const watchdog = yield* startDetached("sh", ["-c", `sleep ${ttl}; exec \"$1\" --state-dir \"$2\" --stop`, "watchdog", self, state], { stdout: `${logs}/watchdog.log`, stderr: `${logs}/watchdog.err.log` }); yield* fs.writeFileString(files.watchdog, `${watchdog}\n`) }
    if (raw.open) yield* run("open", ["-a", raw.browser, `http://localhost:${ports.proxy}/`])
  }).pipe(Effect.onExit((exit) => Exit.isFailure(exit) ? stop : Effect.void))
  yield* start
  yield* status
  return profile satisfies RuntimeProfile
  })
  return yield* Effect.acquireUseRelease(acquireStartLock, () => startup, () => releaseStartLock)
})
