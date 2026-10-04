import * as NodeServices from "@effect/platform-node/NodeServices"
import * as Effect from "effect/Effect"
import * as FileSystem from "effect/FileSystem"
import * as ManagedRuntime from "effect/ManagedRuntime"
import * as Path from "effect/Path"
import { afterAll, afterEach, beforeEach, describe, expect, it } from "vitest"

import type { SaveRequest, SourceBundle } from "./Model.ts"

import { createRoutes } from "./Api.ts"
import { createStore, type ReviewStore } from "./Store.ts"

const source: SourceBundle = {
  name: "example", directory: "/source/example", entry: "# Example\n\nOriginal behavior.\n",
  fingerprint: "original-hash", capturedAt: "2026-09-04T00:00:00.000Z", head: "original-head",
  files: [
    { path: "SKILL.md", content: "variants/gpt-6.md", encoding: "symlink", mode: 41471 },
    { path: "BASE.md", content: "# Example\n\nOriginal behavior.\n", encoding: "utf8", mode: 33188 },
    { path: "variants/gpt-6.md", content: "# Example\n\nOriginal behavior.\n", encoding: "utf8", mode: 33188 },
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

  it("saves new source text through the API and preserves it after source removal", async () => {
    const added = { path: "references/media.md", content: "Initial media guidance", encoding: "utf8", mode: 33188 } as const
    let current: SourceBundle | undefined = { ...source, files: [...source.files, added] }
    const routes = createRoutes({ store, origin: "http://127.0.0.1:4317", stateDirectory: directory, currentSource: () => current, renderMarkdown: (text) => text, backup: async () => "backup" })
    const post = (input: SaveRequest) => routes["/api/save"].POST(new Request("http://127.0.0.1:4317/api/save", {
      method: "POST", headers: { host: "127.0.0.1:4317", origin: "http://127.0.0.1:4317", "content-type": "application/json" }, body: JSON.stringify(input)
    }))
    const initial = await request()
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
})
