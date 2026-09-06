import * as SqliteClient from "@effect/sql-sqlite-node/SqliteClient"
import * as Effect from "effect/Effect"
import * as ManagedRuntime from "effect/ManagedRuntime"
import * as Schema from "effect/Schema"

import { Archive, DraftContent, History, initialDraft, isEditableFile, Position, SaveRequest, SourceBundle, StoredDraft } from "./Model.ts"

export class ReviewError extends Schema.TaggedError<ReviewError>()("ReviewError", {
  message: Schema.String,
  status: Schema.Number
}) {}

const encodeDraft = Schema.encodeSync(Schema.fromJsonString(StoredDraft))
const decodeDraft = Schema.decodeUnknownSync(Schema.fromJsonString(StoredDraft))
const encodeSource = Schema.encodeSync(Schema.fromJsonString(SourceBundle))
const decodeSource = Schema.decodeUnknownSync(Schema.fromJsonString(SourceBundle))
const encodeRequest = Schema.encodeSync(Schema.fromJsonString(SaveRequest))

export function createStore(database: string) {
  const runtime = ManagedRuntime.make(SqliteClient.layer({ filename: database }))
  const initialize = runtime.runPromise(Effect.gen(function*() {
    const sql = yield* SqliteClient.SqliteClient
    yield* sql`PRAGMA synchronous = FULL`
    yield* sql`PRAGMA foreign_keys = ON`
    yield* sql`CREATE TABLE IF NOT EXISTS skills (name TEXT PRIMARY KEY, source TEXT NOT NULL, draft TEXT NOT NULL)`
    yield* sql`CREATE TABLE IF NOT EXISTS revisions (skill TEXT NOT NULL REFERENCES skills(name), revision INTEGER NOT NULL, draft TEXT NOT NULL, operation TEXT UNIQUE, request TEXT, PRIMARY KEY(skill, revision))`
    yield* sql`CREATE TABLE IF NOT EXISTS recoveries (operation TEXT PRIMARY KEY, skill TEXT NOT NULL REFERENCES skills(name), request TEXT NOT NULL, saved_at TEXT NOT NULL)`
    yield* sql`CREATE TABLE IF NOT EXISTS settings (key TEXT PRIMARY KEY, value TEXT NOT NULL)`
  }))

  const record = Effect.fn("SkillReview.record")(function*(name: string) {
    const sql = yield* SqliteClient.SqliteClient
    const rows = yield* sql<{ source: string; draft: string }>`SELECT source, draft FROM skills WHERE name = ${name}`
    const row = rows[0]
    if (row === undefined) return yield* new ReviewError({ status: 404, message: "Skill not found" })
    return { source: decodeSource(row.source), draft: decodeDraft(row.draft) }
  })

  const history = Effect.fn("SkillReview.history")(function*(name: string) {
    yield* record(name)
    const sql = yield* SqliteClient.SqliteClient
    const revisions = yield* sql<{ draft: string; request: string | null }>`SELECT draft, request FROM revisions WHERE skill = ${name} ORDER BY revision DESC`
    const recoveries = yield* sql<{ request: string; saved_at: string }>`SELECT request, saved_at FROM recoveries WHERE skill = ${name} ORDER BY saved_at DESC`
    return Schema.decodeUnknownSync(History)({
      revisions: revisions.map((row) => ({ ...decodeDraft(row.draft), ...(row.request === null ? {} : { request: Schema.decodeUnknownSync(Schema.fromJsonString(SaveRequest))(row.request) }) })),
      recoveries: recoveries.map((row) => ({ request: Schema.decodeUnknownSync(Schema.fromJsonString(SaveRequest))(row.request), savedAt: row.saved_at }))
    })
  })

  const position = Effect.gen(function*() {
    const sql = yield* SqliteClient.SqliteClient
    const rows = yield* sql<{ value: string }>`SELECT value FROM settings WHERE key = 'position'`
    return rows[0] === undefined ? { active: "", tabs: [] } : Schema.decodeUnknownSync(Schema.fromJsonString(Position))(rows[0].value)
  })

  const save = Effect.fn("SkillReview.save")(function*(request: SaveRequest, currentSource?: SourceBundle) {
    const sql = yield* SqliteClient.SqliteClient
    return yield* sql.withTransaction(Effect.gen(function*() {
      const payload = encodeRequest(request)
      const previous = yield* sql<{ draft: string; request: string }>`SELECT draft, request FROM revisions WHERE operation = ${request.operation}`
      if (previous[0] !== undefined) {
        if (previous[0].request !== payload) return yield* new ReviewError({ status: 400, message: "Save identifier reused with different content" })
        return { outcome: "saved" as const, draft: decodeDraft(previous[0].draft) }
      }
      const recovered = yield* sql<{ request: string }>`SELECT request FROM recoveries WHERE operation = ${request.operation}`
      if (recovered[0] !== undefined && recovered[0].request !== payload) return yield* new ReviewError({ status: 400, message: "Recovery identifier reused with different content" })
      const current = yield* record(request.name)
      const editable = new Set([
        ...[...current.source.files, ...(currentSource?.files ?? [])].filter(isEditableFile).map((file) => file.path),
        ...Object.keys(current.draft.content.files)
      ])
      if (Object.keys(request.content.files).some((file) => !editable.has(file))) {
        return yield* new ReviewError({ status: 400, message: "Draft contains an unknown or read-only file" })
      }
      const now = new Date().toISOString()
      if (current.draft.revision !== request.expectedRevision) {
        yield* sql`INSERT OR IGNORE INTO recoveries (operation, skill, request, saved_at) VALUES (${request.operation}, ${request.name}, ${payload}, ${now})`
        return { outcome: "conflict" as const, draft: current.draft }
      }
      const draft: StoredDraft = { content: request.content, revision: current.draft.revision + 1, savedAt: now }
      const serialized = encodeDraft(draft)
      yield* sql`UPDATE skills SET draft = ${serialized} WHERE name = ${request.name}`
      yield* sql`INSERT INTO revisions (skill, revision, draft, operation, request) VALUES (${request.name}, ${draft.revision}, ${serialized}, ${request.operation}, ${payload})`
      return { outcome: "saved" as const, draft }
    }))
  })

  return {
    initialize,
    dispose: () => runtime.dispose(),
    seed: (sources: ReadonlyArray<SourceBundle>) => runtime.runPromise(Effect.gen(function*() {
      const sql = yield* SqliteClient.SqliteClient
      yield* sql.withTransaction(Effect.forEach(sources, (source) => Effect.gen(function*() {
        const draft = encodeDraft(initialDraft(source))
        yield* sql`INSERT OR IGNORE INTO skills (name, source, draft) VALUES (${source.name}, ${encodeSource(source)}, ${draft})`
        yield* sql`INSERT OR IGNORE INTO revisions (skill, revision, draft) VALUES (${source.name}, 0, ${draft})`
      }), { discard: true }))
    })),
    list: () => runtime.runPromise(Effect.gen(function*() {
      const sql = yield* SqliteClient.SqliteClient
      const rows = yield* sql<{ source: string; draft: string }>`SELECT source, draft FROM skills ORDER BY name`
      return rows.map((row) => ({ source: decodeSource(row.source), draft: decodeDraft(row.draft) }))
    })),
    get: (name: string) => runtime.runPromise(record(name)),
    save: (request: SaveRequest, currentSource?: SourceBundle) => runtime.runPromise(save(request, currentSource)),
    history: (name: string) => runtime.runPromise(history(name)),
    position: () => runtime.runPromise(position),
    setPosition: (value: typeof Position.Type) => runtime.runPromise(Effect.gen(function*() {
      const sql = yield* SqliteClient.SqliteClient
      yield* sql`INSERT INTO settings (key, value) VALUES ('position', ${Schema.encodeSync(Schema.fromJsonString(Position))(value)}) ON CONFLICT(key) DO UPDATE SET value = excluded.value`
    })),
    backup: (destination: string) => runtime.runPromise(Effect.gen(function*() {
      const sql = yield* SqliteClient.SqliteClient
      yield* sql.backup(destination)
    })),
    export: () => runtime.runPromise(Effect.gen(function*() {
      const sql = yield* SqliteClient.SqliteClient
      return yield* sql.withTransaction(Effect.gen(function*() {
        const rows = yield* sql<{ name: string }>`SELECT name FROM skills ORDER BY name`
        const skills = yield* Effect.forEach(rows, (row) => Effect.gen(function*() {
          return { ...yield* record(row.name), history: yield* history(row.name) }
        }))
        return Schema.decodeUnknownSync(Archive)({ format: "skill-review-v1", exportedAt: new Date().toISOString(), skills, position: yield* position })
      }))
    })),
    restore: (archive: Archive) => runtime.runPromise(Effect.gen(function*() {
      const sql = yield* SqliteClient.SqliteClient
      yield* sql.withTransaction(Effect.gen(function*() {
        const rows = yield* sql<{ count: number }>`SELECT COUNT(*) AS count FROM skills`
        if (rows[0]?.count !== 0) return yield* new ReviewError({ status: 409, message: "Restore requires an empty state directory; existing drafts are never replaced" })
        for (const item of archive.skills) {
          const latest = item.history.revisions.find((revision) => revision.revision === item.draft.revision)
          if (latest === undefined || encodeDraft(latest) !== encodeDraft(item.draft)) {
            return yield* new ReviewError({ status: 400, message: "Archive is missing the current revision" })
          }
          yield* sql`INSERT INTO skills (name, source, draft) VALUES (${item.source.name}, ${encodeSource(item.source)}, ${encodeDraft(item.draft)})`
          for (const revision of item.history.revisions) {
            yield* sql`INSERT INTO revisions (skill, revision, draft, operation, request) VALUES (${item.source.name}, ${revision.revision}, ${encodeDraft(revision)}, ${revision.request?.operation ?? null}, ${revision.request === undefined ? null : encodeRequest(revision.request)})`
          }
          for (const recovery of item.history.recoveries) {
            yield* sql`INSERT INTO recoveries (operation, skill, request, saved_at) VALUES (${recovery.request.operation}, ${item.source.name}, ${encodeRequest(recovery.request)}, ${recovery.savedAt})`
          }
        }
        yield* sql`INSERT OR REPLACE INTO settings (key, value) VALUES ('position', ${Schema.encodeSync(Schema.fromJsonString(Position))(archive.position)})`
      }))
    }))
  }
}

export type ReviewStore = ReturnType<typeof createStore>
