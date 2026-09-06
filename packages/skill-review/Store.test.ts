import * as NodeServices from "@effect/platform-node/NodeServices"
import * as Effect from "effect/Effect"
import * as FileSystem from "effect/FileSystem"
import * as ManagedRuntime from "effect/ManagedRuntime"
import * as Path from "effect/Path"
import { afterAll, afterEach, beforeEach, describe, expect, it } from "vitest"

import { createRoutes } from "./Api.ts"
import { buildCatalog } from "./Catalog.ts"
import { initialDraft, type SaveRequest, type SourceBundle } from "./Model.ts"
import { createStore, type ReviewStore } from "./Store.ts"

const source: SourceBundle = {
  name: "example", directory: "/source/example", entry: "# Example\n\nOriginal behavior.\n",
  fingerprint: "original-hash", capturedAt: "2026-09-04T00:00:00.000Z", head: "original-head",
  files: [
    { path: "SKILL.md", content: "variants/gpt-5.6.md", encoding: "symlink", mode: 41471 },
    { path: "variants/gpt-5.6.md", content: "# Example\n\nOriginal behavior.\n", encoding: "utf8", mode: 33188 },
    { path: "references/rules.md", content: "Original rule", encoding: "utf8", mode: 33188 },
    { path: "assets/image.png", content: "iVBORw0KGgo=", encoding: "base64", mode: 33188 }
  ]
}

const fileRuntime = ManagedRuntime.make(NodeServices.layer)
const fileSystem = fileRuntime.runSync(FileSystem.FileSystem)
const { join } = fileRuntime.runSync(Path.Path)
afterAll(() => fileRuntime.dispose())

describe("durable skill review", () => {
  let directory: string
  let store: ReviewStore
  const stores: Array<ReviewStore> = []
  beforeEach(async () => {
    directory = await Effect.runPromise(fileSystem.makeTempDirectory({ prefix: "skill-review-test-" }))
    store = createStore(join(directory, "review.sqlite"))
    stores.push(store)
    await store.initialize
    await store.seed([source])
  })
  afterEach(async () => {
    await Promise.all(stores.splice(0).map((current) => current.dispose()))
    await Effect.runPromise(fileSystem.remove(directory, { recursive: true, force: true }))
  })
  const request = async (operation = "save-one"): Promise<SaveRequest> => ({
    name: source.name, operation, expectedRevision: 0,
    content: { ...(await store.get(source.name)).draft.content, master: "# Revised master", files: { "references/rules.md": "Revised rule" }, notes: "Split the workflow from its policy.", decision: "split", status: "ready", reviewedFiles: ["master"] }
  })

  it("keeps original assets and sources, draft decisions, and every revision across a restart", async () => {
    const input = await request()
    await store.save(input)
    await store.dispose()
    store = createStore(join(directory, "review.sqlite"))
    stores.push(store)
    await store.initialize
    await store.seed([{ ...source, entry: "A changed source must not replace the snapshot" }])
    const reopened = await store.get(source.name)
    expect(reopened.source).toEqual(source)
    expect(reopened.draft.content).toEqual(input.content)
    expect((await store.history(source.name)).revisions.map((revision) => revision.content.master)).toEqual(["# Revised master", source.entry])
  })

  it("does not overwrite a newer draft and preserves the conflicting text on disk", async () => {
    const first = await request("first-tab")
    const second = { ...first, operation: "second-tab", content: { ...first.content, master: "Second tab text" } }
    await store.save(first)
    const conflict = await store.save(second)
    expect(conflict.outcome).toBe("conflict")
    expect((await store.get(source.name)).draft.content.master).toBe("# Revised master")
    expect((await store.history(source.name)).recoveries[0]?.request.content.master).toBe("Second tab text")
    await store.save({ ...second, operation: "resolved", expectedRevision: 1 })
    expect((await store.history(source.name)).revisions.map((revision) => revision.content.master)).toEqual(["Second tab text", "# Revised master", source.entry])
  })

  it("retries a save whose acknowledgement was lost without duplicating or changing it", async () => {
    const input = await request()
    const first = await store.save(input)
    expect(await store.save(input)).toEqual(first)
    expect((await store.history(source.name)).revisions).toHaveLength(2)
    await expect(store.save({ ...input, content: { ...input.content, master: "Different payload" } })).rejects.toThrow("Save identifier reused")
    expect((await store.get(source.name)).draft.content.master).toBe("# Revised master")
  })

  it.each(["../../outside.md", "variants/gpt-5.6.md", "assets/image.png"])("rejects editing %s without changing any draft", async (filename) => {
    const input = await request()
    await expect(store.save({ ...input, content: { ...input.content, files: { [filename]: "Unwanted change" } } })).rejects.toThrow("unknown or read-only file")
    expect((await store.get(source.name)).draft.revision).toBe(0)
    expect((await store.history(source.name)).revisions).toHaveLength(1)
  })

  it("saves new source text through the API and preserves it after source removal without allowing read-only files", async () => {
    const added = { path: "references/media.md", content: "Initial media guidance", encoding: "utf8", mode: 33188 } as const
    let current: SourceBundle | undefined = { ...source, files: [...source.files, added,
      { path: "variants/new.md", content: "Read-only variant", encoding: "utf8", mode: 33188 }
    ] }
    const routes = createRoutes({ store, origin: "http://127.0.0.1:4317", stateDirectory: directory, currentSource: () => current, renderMarkdown: (text) => text, backup: async () => "backup" })
    const post = (input: SaveRequest) => routes["/api/save"].POST(new Request("http://127.0.0.1:4317/api/save", {
      method: "POST", headers: { host: "127.0.0.1:4317", origin: "http://127.0.0.1:4317", "content-type": "application/json" }, body: JSON.stringify(input)
    }))
    const initial = await request()
    for (const filename of ["references/unknown.md", "variants/new.md", "assets/image.png"]) {
      const rejected = await post({ ...initial, operation: filename, content: { ...initial.content, files: { [filename]: "Rejected edit" } } })
      expect(rejected.status).toBe(400)
      expect((await store.get(source.name)).draft.revision).toBe(0)
    }
    const content = { ...initial.content, files: { [added.path]: "Reviewed media guidance" } }
    expect((await post({ ...initial, content })).status).toBe(200)
    current = undefined
    const next = { ...initial, operation: "after-removal", expectedRevision: 1, content: { ...content, notes: "Keep this draft" } }
    expect((await post(next)).status).toBe(200)
    const saved = await store.get(source.name)
    expect(saved.source).toEqual(source)
    expect(saved.draft.content).toEqual(next.content)
    expect((await store.history(source.name)).revisions.slice(0, 2).map(revision => revision.content.files[added.path])).toEqual(["Reviewed media guidance", "Reviewed media guidance"])
  })

  it("round-trips originals, drafts, revisions, conflict recoveries and navigation through export and restore", async () => {
    const input = await request()
    await store.save(input)
    await store.save({ ...input, operation: "conflict", content: { ...input.content, notes: "Unmerged note" } })
    await store.setPosition({ active: "example", tabs: ["example"] })
    const archive = await store.export()
    const restored = createStore(join(directory, "restored.sqlite"))
    stores.push(restored)
    await restored.initialize
    await restored.restore(archive)
    expect((await restored.export()).skills).toEqual(archive.skills)
    expect(await restored.position()).toEqual(archive.position)
    await expect(restored.restore(archive)).rejects.toThrow("empty state directory")
    expect((await restored.get(source.name)).draft.content).toEqual(input.content)
  })

  it("creates a usable SQLite backup containing the latest confirmed save", async () => {
    const input = await request()
    await store.save(input)
    const destination = join(directory, "backup.sqlite")
    await store.backup(destination)
    const backup = createStore(destination)
    stores.push(backup)
    await backup.initialize
    expect((await backup.get(source.name)).draft.content).toEqual(input.content)
    expect((await backup.get(source.name)).source).toEqual(source)
  })

  it("persists applied feedback for re-review and retains the original comments through restore", async () => {
    const input = await request()
    await store.save(input)
    const applied: SaveRequest = { ...input, operation: "applied", expectedRevision: 1, content: {
      ...input.content, master: "# Implemented feedback", notes: "", status: "needs-review", reviewedFiles: [],
      applied: { feedbackRevision: 1, appliedAt: "2026-09-05T15:00:00.000Z", summary: "Shortened the workflow.", reviewFocus: "Check the launch command and the remaining setup requirements." }
    } }
    const routes = createRoutes({ store, origin: "http://127.0.0.1:4317", stateDirectory: directory, currentSource: () => source, renderMarkdown: (text) => text, backup: async () => "backup" })
    const catalog = async () => (await routes["/api/catalog"].GET(new Request("http://127.0.0.1:4317/api/catalog", { headers: { host: "127.0.0.1:4317" } }))).json()
    expect(await catalog()).toMatchObject({ skills: [{ status: "ready", hasFeedback: true }] })
    const response = await routes["/api/save"].POST(new Request("http://127.0.0.1:4317/api/save", { method: "POST", headers: { host: "127.0.0.1:4317", origin: "http://127.0.0.1:4317", "content-type": "application/json" }, body: JSON.stringify(applied) }))
    expect(response.status).toBe(200)
    expect(await catalog()).toMatchObject({ skills: [{ status: "needs-review", hasFeedback: false }] })
    await store.save({ ...applied, operation: "follow-up-feedback", expectedRevision: 2, content: { ...applied.content, status: "ready", notes: "The first step still needs shortening." } })
    expect(await catalog()).toMatchObject({ skills: [{ status: "ready", hasFeedback: true }] })
    await store.save({ ...applied, operation: "resolve-follow-up", expectedRevision: 3, content: { ...applied.content, notes: " \n\t" } })
    expect(await catalog()).toMatchObject({ skills: [{ hasFeedback: false }] })
    await store.save({ ...applied, operation: "clear-whitespace", expectedRevision: 4 })
    const archive = await store.export()
    const restored = createStore(join(directory, "applied.sqlite"))
    stores.push(restored)
    await restored.initialize
    await restored.restore(archive)
    expect((await restored.get(source.name)).draft.content).toEqual(applied.content)
    expect((await restored.history(source.name)).revisions.some((revision) => revision.content.notes === input.content.notes)).toBe(true)
    await restored.save({ ...applied, operation: "reviewed", expectedRevision: 5, content: { ...applied.content, status: "ready" } })
    expect((await restored.get(source.name)).draft.content.applied).toEqual(applied.content.applied)
  })

  it("filters the review queue without deleting excluded originals, feedback, or history", async () => {
    await store.seed([{ ...source, name: "external", directory: "/personal/external", head: "external-local-snapshot" }])
    await store.setPosition({ active: "external", tabs: ["external", "example"] })
    const before = await store.export()
    const routes = createRoutes({ store, origin: "http://127.0.0.1:4317", stateDirectory: directory, currentSource: () => undefined, includeSource: (candidate) => candidate.directory.startsWith("/source/"), renderMarkdown: (text) => text, backup: async () => "backup" })
    const response = await routes["/api/catalog"].GET(new Request("http://127.0.0.1:4317/api/catalog", { headers: { host: "127.0.0.1:4317" } }))
    expect(await response.json()).toMatchObject({ skills: [{ name: "example", sourceAvailable: false }] })
    expect((await store.export()).skills).toEqual(before.skills)
    expect((await store.get("external")).source.directory).toBe("/personal/external")
  })

  it("validates HTTP writes, denies other origins, and exposes source drift without changing the snapshot", async () => {
    const routes = createRoutes({ store, origin: "http://127.0.0.1:4317", stateDirectory: directory, currentSource: () => ({ ...source, fingerprint: "changed-hash" }), renderMarkdown: (text) => text, backup: async () => "backup" })
    const input = await request()
    const response = await routes["/api/save"].POST(new Request("http://127.0.0.1:4317/api/save", { method: "POST", headers: { host: "127.0.0.1:4317", origin: "https://elsewhere.example", "content-type": "application/json" }, body: JSON.stringify(input) }))
    expect(response.status).toBe(403)
    const invalid = await routes["/api/save"].POST(new Request("http://127.0.0.1:4317/api/save", { method: "POST", headers: { host: "127.0.0.1:4317", origin: "http://127.0.0.1:4317", "content-type": "application/json" }, body: "{}" }))
    expect(invalid.status).toBe(400)
    expect((await store.get(source.name)).draft.revision).toBe(0)
    const detail = await routes["/api/skill"].GET(new Request("http://127.0.0.1:4317/api/skill?name=example", { headers: { host: "127.0.0.1:4317" } }))
    expect(await detail.json()).toMatchObject({ sourceChanged: true, source: { entry: source.entry } })
  })

  it("separates removed files from unavailable sources without replacing drafts, comments, or history", async () => {
    await store.save(await request())
    const before = await store.export()
    let current: SourceBundle | undefined = { ...source, fingerprint: "changed-hash", files: source.files.filter((file) => file.path !== "references/rules.md") }
    const routes = createRoutes({ store, origin: "http://127.0.0.1:4317", stateDirectory: directory, currentSource: () => current, renderMarkdown: (text) => text, backup: async () => "backup" })
    const detail = async () => (await routes["/api/skill"].GET(new Request("http://127.0.0.1:4317/api/skill?name=example", { headers: { host: "127.0.0.1:4317" } }))).json()
    const catalog = async () => (await routes["/api/catalog"].GET(new Request("http://127.0.0.1:4317/api/catalog", { headers: { host: "127.0.0.1:4317" } }))).json()
    expect(await detail()).toMatchObject({ sourceAvailable: true, removedFiles: ["references/rules.md"] })
    expect(await catalog()).toMatchObject({ skills: [{ name: "example", sourceAvailable: true }] })
    const added = { path: "scripts/new.mjs", content: "export const value = 1", encoding: "utf8", mode: 33188 } as const
    current = { ...source, fingerprint: "added-hash", files: [...source.files, added] }
    expect(await detail()).toMatchObject({ addedFiles: [added], removedFiles: [] })
    current = undefined
    expect(await detail()).toMatchObject({ sourceAvailable: false, removedFiles: [] })
    expect(await catalog()).toMatchObject({ skills: [{ name: "example", sourceAvailable: false }] })
    current = source
    expect(await detail()).toMatchObject({ sourceChanged: false, removedFiles: [] })
    expect((await store.export()).skills).toEqual(before.skills)
  })
})

it("orders callers before supporting skills and keeps circular references navigable without duplicate entries", () => {
  const sources = [
    { ...source, name: "workflow", entry: "Load `helper`." },
    { ...source, name: "helper", entry: "Read `policy`." },
    { ...source, name: "policy", entry: "See `helper`." }
  ]
  const catalog = buildCatalog(sources, new Map())
  expect(catalog.map((skill) => skill.name)).toEqual(["workflow", "helper", "policy"])
  expect(catalog[1]?.referencedBy.map((reference) => reference.name)).toEqual(["workflow", "policy"])
  expect(catalog[0]?.references[0]).toMatchObject({ name: "helper", file: "SKILL.md", line: 1 })
})

it("uses saved master and supporting-file edits for review references while retaining untouched files", () => {
  const workflow = { ...source, name: "workflow", entry: "Read `old-helper`.", files: [
    { path: "references/rules.md", content: "Read `old-helper`.", encoding: "utf8" as const, mode: 33188 },
    { path: "references/other.md", content: "Read `policy`.", encoding: "utf8" as const, mode: 33188 }
  ] }
  const draft = initialDraft(workflow)
  const catalog = buildCatalog([workflow, ...["old-helper", "new-helper", "policy"].map((name) => ({ ...source, name }))], new Map([
    ["workflow", { ...draft, content: { ...draft.content, master: "Read `new-helper`.", files: { "references/rules.md": "" } } }]
  ]))
  expect(catalog.find((skill) => skill.name === "workflow")?.references.map((reference) => reference.name)).toEqual(["new-helper", "policy"])
  expect(catalog.find((skill) => skill.name === "old-helper")?.referencedBy).toEqual([])
})
