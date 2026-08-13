import { Console, Effect, FileSystem, Schedule, Schema } from "effect"
// Persistent detached daemons outlive an Effect scope, so this boundary uses Node's unref API.
// @effect-diagnostics-next-line nodeBuiltinImport:off
import { spawn } from "node:child_process"
// File descriptors must be opened before spawning so detached stdout/stderr remain valid.
// @effect-diagnostics-next-line nodeBuiltinImport:off
import { closeSync, openSync } from "node:fs"

import { checkedInherit, checkedTrimmedText } from "../../../packages/effect-cli/CheckedProcess.ts"

// Home expansion is a pure CLI-boundary default.
// @effect-diagnostics-next-line processEnv:off
const userHome = process.env.HOME ?? "~"
export const expandHome = (value: string) => value === "~" ? userHome : value.startsWith("~/") ? `${userHome}/${value.slice(2)}` : value
export class LocalTestError extends Schema.TaggedError<LocalTestError>()("LocalTestError", { message: Schema.String, cause: Schema.optional(Schema.Unknown) }) {}
export const parseTtl = (value: string) => {
  if (["", "0", "none", "never", "off"].includes(value)) return 0
  const match = /^(\d+)([smhd]?)$/u.exec(value)
  if (match === null) throw new Error(`invalid --ttl value: ${value}`)
  const amount = Number(match[1])
  return amount * ({ "": 1, s: 1, m: 60, h: 3_600, d: 86_400 }[match[2] ?? ""] ?? 1)
}
export const readEnv = (source: string) => Object.fromEntries(source.split(/\r?\n/u).flatMap((line) => {
  const match = /^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/u.exec(line.trim())
  if (match === null) return []
  return [[match[1], (match[2] ?? "").trim().replace(/^['"]|['"]$/gu, "")]]
}))
export const encodeEnv = (values: Record<string, string | number>) => Object.entries(values).map(([key, value]) => `${key}=${JSON.stringify(String(value))}`).join("\n") + "\n"
export const pidRunning = (pid: number | undefined) => Effect.sync(() => {
  if (pid === undefined) return false
  try { process.kill(pid, 0); return true } catch { return false }
})
export const readPid = Effect.fn("LocalTest.readPid")(function*(path: string) {
  const fs = yield* FileSystem.FileSystem
  const source = yield* fs.readFileString(path).pipe(Effect.option)
  if (source._tag === "None") return undefined
  const pid = Number(source.value.trim())
  return Number.isSafeInteger(pid) && pid > 0 ? pid : undefined
})
export const stopPid = Effect.fn("LocalTest.stopPid")(function*(label: string, path: string) {
  const fs = yield* FileSystem.FileSystem
  const pid = yield* readPid(path)
  if (pid === process.pid) return yield* fs.remove(path, { force: true })
  if (yield* pidRunning(pid)) {
    yield* Console.error(`stopping ${label} pid ${pid}`)
    yield* Effect.sync(() => { try { process.kill(-(pid ?? 0), "SIGTERM") } catch { try { process.kill(pid ?? 0, "SIGTERM") } catch { /* already stopped */ } } })
    for (let attempt = 0; attempt < 40 && (yield* pidRunning(pid)); attempt += 1) yield* Effect.sleep("100 millis")
    if (yield* pidRunning(pid)) {
      yield* Console.error(`forcing ${label} pid ${pid} to stop`)
      yield* Effect.sync(() => { try { process.kill(-(pid ?? 0), "SIGKILL") } catch { try { process.kill(pid ?? 0, "SIGKILL") } catch { /* already stopped */ } } })
    }
  }
  yield* fs.remove(path, { force: true })
})
export const capture = (command: string, args: ReadonlyArray<string>, cwd?: string, env?: Record<string, string>) =>
  checkedTrimmedText(command, args, { ...(cwd === undefined ? {} : { cwd }), ...(env === undefined ? {} : { env, extendEnv: true }) })
export const run = (command: string, args: ReadonlyArray<string>, cwd?: string, env?: Record<string, string>, displayCommand?: string, stdin?: string) =>
  checkedInherit(command, args, { ...(cwd === undefined ? {} : { cwd }), ...(env === undefined ? {} : { env, extendEnv: true }), ...(displayCommand === undefined ? {} : { displayCommand }), ...(stdin === undefined ? {} : { stdin }) })
export const startDetached = Effect.fn("LocalTest.startDetached")(function*(command: string, args: ReadonlyArray<string>, options: { readonly cwd?: string; readonly env?: Record<string, string>; readonly stdout: string; readonly stderr: string }) {
  return yield* Effect.sync(() => {
    const stdout = openSync(options.stdout, "a", 0o600)
    const stderr = openSync(options.stderr, "a", 0o600)
    try {
      const child = spawn(command, [...args], { cwd: options.cwd, env: options.env === undefined ? process.env : { ...process.env, ...options.env }, detached: true, stdio: ["ignore", stdout, stderr] })
      child.unref()
      if (child.pid === undefined) throw new LocalTestError({ message: `failed to start ${command}` })
      return child.pid
    } finally { closeSync(stdout); closeSync(stderr) }
  })
})
export const waitForUrl = (url: string, attempts = 120) => Effect.tryPromise({ try: async () => {
  const response = await fetch(url)
  if (!response.ok) throw new LocalTestError({ message: `${url} returned ${response.status}` })
}, catch: (cause) => new LocalTestError({ message: `waiting for ${url}`, cause }) }).pipe(Effect.retry({ times: attempts, schedule: Schedule.spaced("1 second") }))

export const portOwnedByPid = Effect.fn("LocalTest.portOwnedByPid")(function*(port: number, ownerPid: number) {
  const listeners = yield* capture("lsof", ["-nP", `-iTCP:${port}`, "-sTCP:LISTEN", "-t"])
  const ownerGroup = (yield* capture("ps", ["-o", "pgid=", "-p", String(ownerPid)])).trim()
  if (ownerGroup.length === 0) return false
  for (const listener of listeners.split(/\s+/u).filter(Boolean)) {
    const listenerGroup = yield* capture("ps", ["-o", "pgid=", "-p", listener]).pipe(Effect.orElseSucceed(() => ""))
    if (listenerGroup.trim() === ownerGroup) return true
  }
  return false
})
