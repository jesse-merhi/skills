import { NodeRuntime, NodeServices } from "@effect/platform-node"
import { Console, Effect, FileSystem, Option, Path, Schedule, Schema } from "effect"
// This file implements an HTTP/WebSocket server; Effect HttpClient is not a server replacement.
// @effect-diagnostics-next-line nodeBuiltinImport:off
import http, { type IncomingMessage, type ServerResponse } from "node:http"
import net from "node:net"
import type { Duplex } from "node:stream"

interface Route { readonly proxyPort: number; readonly targetHost: string; readonly targetPort: number; readonly gatewayPid: number; readonly filePath: string }
interface Running { readonly route: Route; readonly server: http.Server }
const routes = new Map<number, Running>()
const environment = process.env
const host = environment.OPENCLAW_SHARED_PROXY_HOST ?? "127.0.0.1"
const routeDir = environment.OPENCLAW_SHARED_PROXY_ROUTE_DIR
const idleExitMs = Number(environment.OPENCLAW_SHARED_PROXY_IDLE_EXIT_MS ?? 120_000)
class ProxyError extends Schema.TaggedError<ProxyError>()("ProxyError", { message: Schema.String }) {}

const pidAlive = (pid: number) => { try { process.kill(pid, 0); return true } catch { return false } }
const failDownstream = (response: ServerResponse, error: Error) => {
  if (response.destroyed) return
  if (response.headersSent || response.writableEnded) response.destroy(error)
  else { response.writeHead(502, { "content-type": "text/plain; charset=utf-8" }); response.end(`OpenClaw shared proxy error: ${error.message}\n`) }
}
const proxyHttp = (route: Route, request: IncomingMessage, response: ServerResponse) => {
  let upstreamResponse: IncomingMessage | undefined
  const upstream = http.request({ host: route.targetHost, port: route.targetPort, method: request.method, path: request.url, headers: { ...request.headers, host: `${route.targetHost}:${route.targetPort}` } }, (incoming) => {
    upstreamResponse = incoming; response.writeHead(incoming.statusCode ?? 502, incoming.statusMessage, incoming.headers)
    incoming.on("error", (error) => failDownstream(response, error)); incoming.pipe(response)
  })
  upstream.on("error", (error) => failDownstream(response, error)); request.on("aborted", () => upstream.destroy()); request.on("error", (error) => upstream.destroy(error))
  response.on("error", (error) => { upstreamResponse?.destroy(error); upstream.destroy(error) }); response.on("close", () => { if (!response.writableFinished) { upstreamResponse?.destroy(); upstream.destroy() } }); request.pipe(upstream)
}
const proxyUpgrade = (route: Route, request: IncomingMessage, socket: Duplex, head: Buffer) => {
  const upstream = net.connect(route.targetPort, route.targetHost, () => {
    const headers = { ...request.headers, host: `${route.targetHost}:${route.targetPort}` }
    let raw = `${request.method} ${request.url} HTTP/${request.httpVersion}\r\n`
    for (const [key, value] of Object.entries(headers)) if (Array.isArray(value)) for (const item of value) raw += `${key}: ${item}\r\n`; else if (value != null) raw += `${key}: ${value}\r\n`
    upstream.write(`${raw}\r\n`); if (head.length > 0) upstream.write(head); socket.pipe(upstream); upstream.pipe(socket)
  })
  upstream.on("error", () => socket.destroy()); socket.on("error", () => upstream.destroy())
}

const readRoutes = Effect.gen(function*() {
  const fs = yield* FileSystem.FileSystem, paths = yield* Path.Path
  if (routeDir === undefined) return yield* new ProxyError({ message: "missing OPENCLAW_SHARED_PROXY_ROUTE_DIR" })
  yield* fs.makeDirectory(routeDir, { recursive: true })
  const entries = yield* fs.readDirectory(routeDir), found = new Map<number, Route>()
  for (const entry of entries.filter((name) => name.endsWith(".json"))) {
    const filePath = paths.join(routeDir, entry)
    const parsed = yield* fs.readFileString(filePath).pipe(Effect.flatMap((source) => Effect.try(() => JSON.parse(source) as unknown)), Effect.option)
    if (Option.isNone(parsed) || typeof parsed.value !== "object" || parsed.value === null) continue
    const value = parsed.value as Record<string, unknown>, proxyPort = Number(value.proxyPort), targetPort = Number(value.targetPort), gatewayPid = Number(value.gatewayPid)
    if (!Number.isInteger(proxyPort) || !Number.isInteger(targetPort) || !pidAlive(gatewayPid)) { yield* fs.remove(filePath, { force: true }); continue }
    found.set(proxyPort, { proxyPort, targetPort, gatewayPid, targetHost: typeof value.targetHost === "string" ? value.targetHost : "127.0.0.1", filePath })
  }
  return found
})
const startServer = (route: Route) => Effect.callback<void, Error>((resume) => {
  const server = http.createServer((request, response) => proxyHttp(route, request, response)); server.on("upgrade", (request, socket, head) => proxyUpgrade(route, request, socket, head))
  server.once("error", (error) => resume(Effect.fail(error))); server.listen(route.proxyPort, host, () => { routes.set(route.proxyPort, { route, server }); resume(Effect.void) })
  return Effect.sync(() => server.close())
})
const closeServer = (port: number) => Effect.callback<void>((resume) => { const running = routes.get(port); if (running === undefined) return resume(Effect.void); running.server.close(() => { routes.delete(port); resume(Effect.void) }) })
let emptySince = Date.now()
const syncRoutes = Effect.gen(function*() {
  const next = yield* readRoutes
  for (const [port, current] of routes) { const route = next.get(port); if (route === undefined || route.targetHost !== current.route.targetHost || route.targetPort !== current.route.targetPort) yield* closeServer(port) }
  for (const route of next.values()) if (!routes.has(route.proxyPort)) yield* startServer(route)
  if (routes.size > 0) emptySince = Date.now()
  else if (Date.now() - emptySince >= idleExitMs) return yield* new ProxyError({ message: "no routes remain" })
})
const closeAll = Effect.forEach([...routes.keys()], closeServer, { discard: true })
const program = syncRoutes.pipe(Effect.andThen(Effect.repeat(syncRoutes, Schedule.spaced("500 millis"))), Effect.ensuring(closeAll), Effect.catch((error) => Console.error(`[openclaw-shared-proxy] ${error.message}`)))
program.pipe(
  // @effect-diagnostics-next-line strictEffectProvide:off
  Effect.provide(NodeServices.layer), NodeRuntime.runMain)
