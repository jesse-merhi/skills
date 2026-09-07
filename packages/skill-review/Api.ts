import * as Schema from "effect/Schema"

import { buildCatalog } from "./Catalog.ts"
import { Position, SaveRequest, type SourceBundle } from "./Model.ts"
import { ReviewError, type ReviewStore } from "./Store.ts"

const PreviewRequest = Schema.Struct({ text: Schema.String.check(Schema.isMaxLength(4_000_000)) })
const readPayload = async <Codec extends Schema.ConstraintDecoder<unknown>>(request: Request, codec: Codec): Promise<Codec["Type"]> => {
  const text = await request.text()
  if (text.length > 8_000_000) throw new ReviewError({ status: 413, message: "Draft is too large" })
  const result = Schema.decodeUnknownExit(Schema.fromJsonString(codec))(text)
  if (result._tag === "Failure") throw new ReviewError({ status: 400, message: "Invalid request; the saved draft was not changed" })
  return result.value
}

export function createRoutes(options: {
  store: ReviewStore
  origin: string
  stateDirectory: string
  currentSource: (name: string) => SourceBundle | undefined
  includeSource?: (source: SourceBundle) => boolean
  renderMarkdown: (text: string) => string
  backup: () => Promise<string>
}) {
  const { store } = options
  const protect = (handler: (request: Request) => Promise<Response>) => async (request: Request): Promise<Response> => {
    const origin = request.headers.get("origin")
    const host = request.headers.get("host")
    if (host !== new URL(options.origin).host || (origin !== null && origin !== options.origin)
      || request.headers.get("sec-fetch-site") === "cross-site"
      || (request.method !== "GET" && (origin !== options.origin || !request.headers.get("content-type")?.startsWith("application/json")))) {
      return Response.json({ message: "Only this local editor can access review data" }, { status: 403 })
    }
    try {
      const response = await handler(request)
      response.headers.set("Cache-Control", "no-store")
      response.headers.set("X-Content-Type-Options", "nosniff")
      return response
    } catch (error) {
      if (error instanceof ReviewError) return Response.json({ message: error.message }, { status: error.status })
      console.error(error)
      return Response.json({ message: "The operation failed. Keep this tab open; unconfirmed edits remain in its recovery buffer." }, { status: 500 })
    }
  }
  const skillName = (request: Request) => new URL(request.url).searchParams.get("name") ?? ""

  return {
    "/api/catalog": { GET: protect(async () => {
      const records = (await store.list()).filter((record) => options.includeSource?.(record.source) ?? true)
      return Response.json({
        skills: buildCatalog(records.map((record) => record.source), new Map(records.map((record) => [record.source.name, record.draft])))
          .map((skill) => ({ ...skill, sourceAvailable: options.currentSource(skill.name) !== undefined })),
        position: await store.position(),
        stateDirectory: options.stateDirectory
      })
    }) },
    "/api/skill": { GET: protect(async (request) => {
      const record = await store.get(skillName(request))
      const current = options.currentSource(record.source.name)
      const currentFiles = new Set(current?.files.map((file) => file.path))
      const removedFiles = current === undefined ? [] : record.source.files.filter((file) => !currentFiles.has(file.path)).map((file) => file.path)
      const originalPaths = new Set(record.source.files.map((file) => file.path))
      const addedFiles = current?.files.filter((file) => !originalPaths.has(file.path)) ?? []
      return Response.json({ ...record, sourceChanged: current?.fingerprint !== record.source.fingerprint, sourceAvailable: current !== undefined, removedFiles, addedFiles })
    }) },
    "/api/save": { POST: protect(async (request) => {
      const payload = await readPayload(request, SaveRequest)
      const result = await store.save(payload, options.currentSource(payload.name))
      return Response.json(result, { status: result.outcome === "conflict" ? 409 : 200 })
    }) },
    "/api/history": { GET: protect(async (request) => Response.json(await store.history(skillName(request)))) },
    "/api/position": { POST: protect(async (request) => {
      await store.setPosition(await readPayload(request, Position))
      return Response.json({ saved: true })
    }) },
    "/api/preview": { POST: protect(async (request) => {
      const payload = await readPayload(request, PreviewRequest)
      return Response.json({ html: options.renderMarkdown(payload.text) })
    }) },
    "/api/export": { GET: protect(async () => new Response(JSON.stringify(await store.export(), null, 2), {
      headers: { "Content-Type": "application/json", "Content-Disposition": 'attachment; filename="skill-review-backup.json"' }
    })) },
    "/api/backup": { POST: protect(async () => Response.json({ path: await options.backup() })) }
  }
}
