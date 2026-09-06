import * as Schema from "effect/Schema"
import { Database } from "bun:sqlite"
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs"
import os from "node:os"
import path from "node:path"
import { parseArgs } from "node:util"

import { createRoutes } from "./Api.ts"
import { Archive, SourceBundle } from "./Model.ts"
import { createStore } from "./Store.ts"
import { capturePersonalRoots, captureRepository, captureSkill, repositoryKey } from "./source.mjs"

const { values } = parseArgs({ options: {
  root: { type: "string", default: path.resolve(import.meta.dirname, "../..") },
  state: { type: "string" }, port: { type: "string", default: "4317" },
  "sqlite-library": { type: "string" },
  personal: { type: "boolean", default: false },
  export: { type: "string" }, restore: { type: "string" }, help: { type: "boolean" }
} })
if (values.help) {
  console.log("bun run review:skills [--root REPO] [--state DIRECTORY] [--port 4317]\n  --export FILE   Save a complete portable JSON archive and exit\n  --restore FILE  Restore into an empty --state directory and exit")
  process.exit(0)
}
const root = path.resolve(values.root)
if (process.platform === "darwin" || values["sqlite-library"]) {
  const library = values["sqlite-library"] ?? ["/opt/homebrew/opt/sqlite/lib/libsqlite3.dylib", "/usr/local/opt/sqlite/lib/libsqlite3.dylib"].find(existsSync)
  if (!library) throw new Error("The Effect SQLite driver needs a full SQLite library on macOS. Pass --sqlite-library PATH to an existing installation.")
  Database.setCustomSQLite(library)
}
const stateDirectory = path.resolve(values.state ?? path.join(os.homedir(), ".local/share/skill-review", repositoryKey(root)))
mkdirSync(stateDirectory, { recursive: true, mode: 0o700 })
const store = createStore(path.join(stateDirectory, "review.sqlite"))
await store.initialize
if (values.restore) {
  await store.restore(Schema.decodeUnknownSync(Schema.fromJsonString(Archive))(readFileSync(values.restore, "utf8")))
  await store.dispose()
  console.log(`Restored into ${stateDirectory}. Original state was not changed.`)
  process.exit(0)
}
const preparationPath = path.join(stateDirectory, "master-preparation.json")
const preparations = existsSync(preparationPath)
  ? Schema.decodeUnknownSync(Schema.fromJsonString(Schema.Array(Schema.Struct({ name: Schema.String, fingerprint: Schema.String, preparation: SourceBundle.fields.preparation }))))(readFileSync(preparationPath, "utf8"))
  : []
const repositorySources = captureRepository(root)
const personalSources = values.personal ? capturePersonalRoots([
  path.join(os.homedir(), ".codex/skills"),
  path.join(os.homedir(), ".claude/skills"),
  path.join(os.homedir(), ".agents/skills")
], repositorySources) : []
const sources = [...repositorySources, ...personalSources].map((source) => {
  const prepared = preparations.find((item) => item.name === source.name && item.fingerprint === source.fingerprint)
  return prepared?.preparation ? { ...source, preparation: prepared.preparation } : source
})
await store.seed(sources)
if (values.export) {
  writeFileSync(values.export, JSON.stringify(await store.export(), null, 2), { flag: "wx", mode: 0o600 })
  await store.dispose()
  console.log(`Exported complete review to ${path.resolve(values.export)}`)
  process.exit(0)
}
const backup = async () => {
  const destination = path.join(stateDirectory, `backup-${new Date().toISOString().replaceAll(":", "-")}-${crypto.randomUUID().slice(0, 8)}.sqlite`)
  await store.backup(destination)
  return destination
}
await backup()
const port = Schema.decodeUnknownSync(Schema.Number.check(Schema.isInt(), Schema.isBetween({ minimum: 1024, maximum: 65535 })))(Number(values.port))
const origin = `http://127.0.0.1:${port}`
const build = await Bun.build({ entrypoints: [path.join(import.meta.dirname, "web/app.ts")], target: "browser", minify: true })
if (!build.success) throw new Error(build.logs.join("\n"))
const javascript = await build.outputs[0].text()
const contentSecurityPolicy = "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; frame-src 'self'; object-src 'none'; base-uri 'none'; frame-ancestors 'none'; connect-src 'self'"
const asset = (filename, type) => new Response(readFileSync(path.join(import.meta.dirname, "web", filename)), {
  headers: { "Content-Type": type, "Content-Security-Policy": contentSecurityPolicy, "X-Content-Type-Options": "nosniff", "Cache-Control": "no-store" }
})
const routes = createRoutes({
  store, origin, stateDirectory, backup,
  includeSource: (source) => values.personal || source.directory.startsWith(path.join(root, "skills") + path.sep),
  currentSource: (name) => {
    const source = sources.find((source) => source.name === name)
    if (!source) return undefined
    try { return captureSkill(source, source.head) } catch { return undefined }
  },
  renderMarkdown: (text) => Bun.markdown.html(text, { tagFilter: true })
})
const server = Bun.serve({
  hostname: "127.0.0.1", port, maxRequestBodySize: 8_000_000,
  routes: {
    ...routes,
    "/": asset("index.html", "text/html; charset=utf-8"),
    "/tooling": new Response(`<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>Skill tooling changes</title><style>body{max-width:1000px;margin:40px auto;padding:0 24px;font:16px/1.6 system-ui;color:#26382e;background:#f8f8f3}table{border-collapse:collapse;display:block;overflow:auto}td,th{padding:12px;border:1px solid #cdd4c8;text-align:left;vertical-align:top}code{font-size:.85em;overflow-wrap:anywhere}a{color:#79402d}</style><a href="/">Back to skill review</a>${Bun.markdown.html(readFileSync(path.join(import.meta.dirname, "TOOLING-CHANGES.md"), "utf8"), { tagFilter: true })}</html>`, {
      headers: { "Content-Type": "text/html; charset=utf-8", "Content-Security-Policy": contentSecurityPolicy, "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" }
    }),
    "/favicon.svg": new Response('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><rect width="32" height="32" rx="7" fill="#38463b"/><text x="9" y="24" font-family="serif" font-size="27" fill="white">s</text></svg>', { headers: { "Content-Type": "image/svg+xml" } }),
    "/style.css": asset("style.css", "text/css; charset=utf-8"),
    "/app.js": new Response(javascript, { headers: { "Content-Type": "text/javascript; charset=utf-8", "Cache-Control": "no-store" } })
  },
  fetch: () => new Response("Not found", { status: 404 })
})
let stopping = false
const shutdown = async () => {
  if (stopping) return
  stopping = true
  await server.stop(false)
  await store.dispose()
}
process.on("SIGTERM", shutdown)
process.on("SIGINT", shutdown)
console.log(`Skill review: ${origin}\nDurable state: ${stateDirectory}\n${sources.length} source skills captured. No source or installed skill files are modified.`)
