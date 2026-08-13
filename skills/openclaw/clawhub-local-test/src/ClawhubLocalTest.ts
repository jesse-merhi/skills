import { createConnection, type Socket } from "node:net"
import { randomBytes } from "node:crypto"
import { Config, Console, Effect, Exit, FileSystem, Option, Path } from "effect"
import { capture, encodeEnv, expandHome, LocalTestError, parseTtl, pidRunning, readEnv, readPid, run, startDetached, stopPid, waitForUrl } from "../../shared/LocalTest.ts"

export interface ConvexTarget { readonly kind: "local" | "dev"; readonly importDeployment: string }
export const publisherAbuseFixturesExist = (output: string) => {
  const count = Number(output.replace(/\D/gu, ""))
  return Number.isFinite(count) && count > 0
}
export const validateConvexTarget = (url: string, deployment: string): ConvexTarget => {
  const host = new URL(url).hostname
  const loopback = ["127.0.0.1", "localhost", "::1"].includes(host)
  if (/^(local:|anonymous:|anonymous-agent$)/u.test(deployment)) {
    if (!loopback) throw new Error(`refusing to import: local/anonymous CONVEX_DEPLOYMENT must use loopback VITE_CONVEX_URL (${url})`)
    return { kind: "local", importDeployment: "local" }
  }
  if (deployment.startsWith("dev:")) {
    const name = deployment.slice(4)
    if (loopback || name.length === 0 || host !== `${name}.convex.cloud`) throw new Error(`refusing to import: dev deployment ${name} does not match VITE_CONVEX_URL host ${host}`)
    return { kind: "dev", importDeployment: name }
  }
  throw new Error(`refusing to import into unapproved Convex deployment: ${deployment}`)
}

const portIsFree = (port: number) => Effect.callback<boolean>((resume) => {
  let socket: Socket | undefined
  const done = (free: boolean) => { socket?.destroy(); resume(Effect.succeed(free)) }
  socket = createConnection({ host: "127.0.0.1", port }).once("connect", () => done(false)).once("error", () => done(true))
  return Effect.sync(() => socket?.destroy())
})
const choosePort = Effect.fn("Clawhub.choosePort")(function*(start: number) {
  for (let port = start; port <= 65_535; port += 1) if (yield* portIsFree(port)) return port
  return yield* new LocalTestError({ message: `no free port at or above ${start}` })
})

export interface ClawhubOptions {
  readonly repo: string; readonly stateDir: string; readonly port: Option.Option<number>; readonly startPort: number
  readonly refresh: "auto" | "force" | "none"; readonly snapshotMaxAgeHours: number; readonly includeFileStorage: boolean
  readonly skipImport: boolean; readonly seedFixtures: boolean; readonly seedAbuseFixtures: boolean; readonly workers: boolean
  readonly open: boolean; readonly browser: string; readonly ttl: string; readonly dryRun: boolean; readonly action: "start" | "status" | "stop"
}

export const clawhubLocalTest = Effect.fn("Clawhub.localTest")(function*(raw: ClawhubOptions) {
  const fs = yield* FileSystem.FileSystem
  const paths = yield* Path.Path
  const repo = expandHome(raw.repo), stateDir = expandHome(raw.stateDir)
  const snapshots = paths.join(stateDir, "snapshots"), runDir = paths.join(stateDir, "run"), logs = paths.join(stateDir, "logs")
  const files = { app: paths.join(runDir, "app.pid"), convex: paths.join(runDir, "convex.pid"), watchdog: paths.join(runDir, "watchdog.pid"), instance: paths.join(runDir, "instance.env") }
  const formatLease = (value: string | undefined) => {
    const epoch = Number(value ?? 0)
    return Number.isFinite(epoch) && epoch > 0 ? new Date(epoch * 1_000).toISOString() : "none"
  }
  yield* fs.makeDirectory(snapshots, { recursive: true }); yield* fs.makeDirectory(runDir, { recursive: true }); yield* fs.makeDirectory(logs, { recursive: true })
  const stop = Effect.gen(function*() { yield* stopPid("watchdog", files.watchdog); yield* stopPid("app", files.app); yield* stopPid("convex", files.convex); yield* fs.remove(files.instance, { force: true }) })
  if (raw.action === "stop") return yield* stop
  if (raw.action === "status") {
    const source = yield* fs.readFileString(files.instance).pipe(Effect.option)
    if (source._tag === "None") return yield* Console.log(`No managed ClawHub local-test instance recorded at ${stateDir}`)
    const values = readEnv(source.value)
    const pids = { app: yield* readPid(files.app), convex: yield* readPid(files.convex), watchdog: yield* readPid(files.watchdog) }
    const states = { app: yield* pidRunning(pids.app), convex: yield* pidRunning(pids.convex), watchdog: yield* pidRunning(pids.watchdog) }
    return yield* Console.log([`state_dir: ${stateDir}`, `repo: ${values.REPO ?? ""}`, `url: ${values.URL ?? ""}`, `convex_url: ${values.VITE_CONVEX_URL ?? ""}`, `convex_deployment: ${values.CONVEX_DEPLOYMENT ?? ""}`, `convex_import_target: ${values.CONVEX_IMPORT_DEPLOYMENT ?? ""}`, `snapshot: ${values.SNAPSHOT ?? ""} (${values.SNAPSHOT_SOURCE ?? "unknown"})`, `dev_fixtures: ${values.DEV_FIXTURES ?? "unknown"}`, `publisher_abuse_fixtures: ${values.PUBLISHER_ABUSE_FIXTURES ?? "unknown"}`, `cloud_dev_auth: ${values.CLOUD_DEV_AUTH ?? "unknown"}`, `lease_expires: ${formatLease(values.EXPIRES_AT)}`, `app_pid: ${pids.app ?? "none"} (${states.app ? "running" : "stopped"})`, `convex_pid: ${pids.convex ?? "none"} (${states.convex ? "running" : "stopped"})`, `watchdog_pid: ${pids.watchdog ?? "none"} (${states.watchdog ? "running" : "stopped"})`, `logs:\n  app: ${logs}/app.log\n  app_err: ${logs}/app.err.log\n  convex: ${logs}/convex.log\n  convex_err: ${logs}/convex.err.log`, `status: clawhub-local-test --status`, `stop: clawhub-local-test --stop`].join("\n"))
  }
  if (!(yield* fs.exists(paths.join(repo, "package.json"))) || !(yield* fs.exists(paths.join(repo, "convex")))) return yield* new LocalTestError({ message: `not a ClawHub checkout: ${repo}` })
  if (!(yield* fs.exists(paths.join(repo, ".env.local"))) || !(yield* fs.exists(paths.join(repo, ".convex")))) yield* run("bun", ["run", "setup:worktree", "--", "--quiet"], repo)
  const envSource = yield* fs.readFileString(paths.join(repo, ".env.local")); const env = readEnv(envSource)
  const convexUrl = env.VITE_CONVEX_URL, deployment = env.CONVEX_DEPLOYMENT
  if (convexUrl === undefined || deployment === undefined) return yield* new LocalTestError({ message: ".env.local requires VITE_CONVEX_URL and CONVEX_DEPLOYMENT" })
  const target = yield* Effect.try({ try: () => validateConvexTarget(convexUrl, deployment), catch: (cause) => new LocalTestError({ message: "invalid Convex target", cause }) })
  const port = Option.isSome(raw.port) ? raw.port.value : yield* choosePort(raw.startPort)
  if (raw.dryRun) return yield* Console.log([`repo: ${repo}`, `state_dir: ${stateDir}`, `VITE_CONVEX_URL: ${convexUrl}`, `CONVEX_DEPLOYMENT: ${deployment}`, `convex_target_kind: ${target.kind}`, `convex_import_deployment: ${target.importDeployment}`, `refresh_mode: ${raw.refresh}`, `include_file_storage: ${Number(raw.includeFileStorage)}`, `skip_import: ${Number(raw.skipImport)}`, `seed_fixtures: ${Number(raw.seedFixtures)}`, `seed_abuse_fixtures: ${Number(raw.seedAbuseFixtures)}`, `port: ${port}`, `ttl: ${raw.ttl}`].join("\n"))
  const ttl = yield* Effect.try({ try: () => parseTtl(raw.ttl), catch: (cause) => new LocalTestError({ message: `invalid --ttl value: ${raw.ttl}`, cause }) })
  yield* stop
  const start = Effect.gen(function*() {
  const processEnv: Record<string, string> = { DEV_AUTH_ENABLED: "1", VITE_ENABLE_DEV_AUTH: "1", DEV_AUTH_CONVEX_DEPLOYMENT: deployment }
  if (target.kind === "dev") {
    const configuredSecret = yield* Config.option(Config.string("DEV_AUTH_SECRET"))
    const secret = Option.isSome(configuredSecret) && configuredSecret.value.length >= 32 ? configuredSecret.value : randomBytes(32).toString("hex")
    processEnv.DEV_AUTH_SECRET = secret; processEnv.DEV_AUTH_SITE_URL = `http://127.0.0.1:${port}`
    yield* run("bunx", ["convex", "env", "set", "DEV_AUTH_SECRET", "--deployment", target.importDeployment], repo, undefined, "bunx convex env set DEV_AUTH_SECRET [stdin]", secret)
    yield* run("bunx", ["convex", "env", "set", "DEV_AUTH_SITE_URL", processEnv.DEV_AUTH_SITE_URL, "--deployment", target.importDeployment], repo)
  }
  if (target.kind === "local") {
    const healthy = yield* Effect.tryPromise(() => fetch(convexUrl)).pipe(Effect.map((response) => response.ok), Effect.catch(() => Effect.succeed(false)))
    if (!healthy) {
      const pid = yield* startDetached("bunx", ["convex", "dev", "--typecheck=disable"], { cwd: repo, stdout: `${logs}/convex.log`, stderr: `${logs}/convex.err.log` })
      yield* fs.writeFileString(files.convex, `${pid}\n`); yield* waitForUrl(convexUrl)
    }
  }
  yield* run("bunx", ["convex", "dev", "--once", "--typecheck=disable"], repo)
  let snapshot = "", snapshotSource = "skipped"
  if (!raw.skipImport) {
    const entries = yield* fs.readDirectory(snapshots)
    const candidates = entries.filter((name) => /^clawhub-prod-.*\.zip$/u.test(name)).sort()
    const latest = candidates.at(-1)
    let refresh = raw.refresh === "force" || latest === undefined
    if (raw.refresh === "none" && latest === undefined) return yield* new LocalTestError({ message: `--no-refresh was passed but no cached snapshot exists in ${snapshots}` })
    if (raw.refresh === "auto" && latest !== undefined) { const info = yield* fs.stat(paths.join(snapshots, latest)); const modified = Option.getOrElse(info.mtime, () => new Date(0)); refresh = Date.now() - modified.getTime() > raw.snapshotMaxAgeHours * 3_600_000 }
    if (refresh) {
      snapshot = paths.join(snapshots, `clawhub-prod-${new Date().toISOString().replace(/[-:]/gu, "").replace(/\.\d{3}Z$/u, "Z")}${raw.includeFileStorage ? "-with-storage" : ""}.zip`)
      yield* run("bunx", ["convex", "export", "--prod", ...(raw.includeFileStorage ? ["--include-file-storage"] : []), "--path", snapshot], repo); snapshotSource = "fresh"
    } else { snapshot = paths.join(snapshots, latest ?? ""); snapshotSource = "cached" }
    yield* run("bunx", ["convex", "import", "--deployment", target.importDeployment, "--replace-all", "-y", snapshot], repo)
  }
  if (raw.seedFixtures) yield* run("bunx", ["convex", "run", "--deployment", target.importDeployment, "--no-push", "devSeed:seedLocalFixtures"], repo, processEnv)
  let abuseFixtureState = "skipped"
  if (raw.seedAbuseFixtures) {
    const existing = yield* capture("bunx", ["convex", "run", "--deployment", target.importDeployment, "--inline-query", "return (await ctx.db.query(\"publisherAbuseReviewNominations\").take(1)).length"], repo)
    if (publisherAbuseFixturesExist(existing)) abuseFixtureState = "existing"
    else {
      yield* run("bunx", ["convex", "run", "--deployment", target.importDeployment, "--no-push", "internal.publisherAbuseDevSeed.seed"], repo, processEnv)
      abuseFixtureState = "applied"
    }
  }
  const appPid = yield* startDetached("bun", ["scripts/dev-worktree.ts", "--port", String(port), ...(raw.workers ? [] : ["--no-workers"])], { cwd: repo, env: processEnv, stdout: `${logs}/app.log`, stderr: `${logs}/app.err.log` })
  yield* fs.writeFileString(files.app, `${appPid}\n`)
  const started = Math.floor(Date.now() / 1_000), expires = ttl === 0 ? 0 : started + ttl
  if (ttl > 0) { const self = new URL("../scripts/clawhub-local-test", import.meta.url).pathname; const pid = yield* startDetached("sh", ["-c", `sleep ${ttl}; exec \"$1\" --state-dir \"$2\" --stop`, "watchdog", self, stateDir], { stdout: `${logs}/watchdog.log`, stderr: `${logs}/watchdog.err.log` }); yield* fs.writeFileString(files.watchdog, `${pid}\n`) }
  const url = `http://127.0.0.1:${port}/`
  yield* fs.writeFileString(files.instance, encodeEnv({ REPO: repo, URL: url, VITE_CONVEX_URL: convexUrl, CONVEX_DEPLOYMENT: deployment, CONVEX_TARGET_KIND: target.kind, CONVEX_IMPORT_DEPLOYMENT: target.importDeployment, SNAPSHOT: snapshot, SNAPSHOT_SOURCE: snapshotSource, DEV_FIXTURES: raw.seedFixtures ? "applied" : "skipped", PUBLISHER_ABUSE_FIXTURES: abuseFixtureState, CLOUD_DEV_AUTH: target.kind === "dev" ? "configured" : "not_required", STARTED_AT: started, EXPIRES_AT: expires }), { mode: 0o600 })
  if (raw.open) yield* run("open", ["-a", raw.browser, url])
  yield* Console.log(`ClawHub local test is starting.\n\nURL: ${url}\nRepo: ${repo}\nConvex: ${convexUrl} (${deployment}, import target: ${target.importDeployment})\nSnapshot: ${snapshot || "not imported"} (${snapshotSource})\nDev fixtures: ${raw.seedFixtures ? "applied" : "skipped"}\nPublisher abuse fixtures: ${abuseFixtureState}\nCloud dev auth: ${target.kind === "dev" ? "configured" : "not_required"}\nLogs:\n  app: ${logs}/app.log\n  app_err: ${logs}/app.err.log\n  convex: ${logs}/convex.log\n  convex_err: ${logs}/convex.err.log\nLease expires: ${formatLease(String(expires))}\n\nStatus: clawhub-local-test --status\nStop:   clawhub-local-test --stop`)
  })
  return yield* start.pipe(Effect.onExit((exit) => Exit.isFailure(exit) ? stop : Effect.void))
})
