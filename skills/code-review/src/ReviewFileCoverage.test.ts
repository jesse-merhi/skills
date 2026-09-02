import { NodeServices } from "@effect/platform-node"
import * as SqliteClient from "@effect/sql-sqlite-node/SqliteClient"
import { assert, describe, it } from "@effect/vitest"
import * as Cause from "effect/Cause"
import * as Effect from "effect/Effect"
import * as Exit from "effect/Exit"
import * as Layer from "effect/Layer"
import * as SqlClient from "effect/unstable/sql/SqlClient"
// Executable-level Git fixtures intentionally exercise the real process boundary.
// @effect-diagnostics-next-line nodeBuiltinImport:off
import { execFile as execFileCallback, spawnSync } from "node:child_process"
// @effect-diagnostics-next-line nodeBuiltinImport:off
import { mkdir, mkdtemp, rm, symlink, writeFile } from "node:fs/promises"
import { tmpdir } from "node:os"
// @effect-diagnostics-next-line nodeBuiltinImport:off
import { join } from "node:path"
import { promisify } from "node:util"

import { ReviewSnapshotError } from "./NativeReview.ts"
import { changedFileManifest } from "./ReviewFileCoverage.ts"
import { getReviewFileCoverage, initialize, InvalidReviewCoverage, InvalidScopeBudget, recordReviewedFiles, type ReviewRun, startScopeBudget } from "./ReviewFindings.ts"

const execFile = promisify(execFileCallback)
const live = <A, E>(database: string, effect: Effect.Effect<A, E, NodeServices.NodeServices | SqlClient.SqlClient>) => effect.pipe(
  // Dynamic test database selection is the executable boundary under test.
  // @effect-diagnostics-next-line strictEffectProvide:off
  Effect.provide(Layer.mergeAll(NodeServices.layer, SqliteClient.layer({ filename: database })))
)

describe("review file coverage", () => {
  it("ranks valid review attestations and invalidates them when file content changes", async () => {
    const directory = await mkdtemp(join(tmpdir(), "review-file-coverage-"))
    const repository = join(directory, "repo")
    const database = join(directory, "reviews.sqlite")
    const attributeRules = "*.txt text\nfiltered.txt filter=coverage-test\n"
    try {
      await mkdir(repository)
      await execFile("git", ["init", "-b", "main"], { cwd: repository })
      await execFile("git", ["config", "user.email", "test@example.com"], { cwd: repository })
      await execFile("git", ["config", "user.name", "Test"], { cwd: repository })
      await execFile("git", ["config", "filter.coverage-test.clean", "cat"], { cwd: repository })
      await writeFile(join(repository, "a.txt"), "base a\n")
      await writeFile(join(repository, "b.txt"), "base b\n")
      await writeFile(join(repository, "hidden.txt"), "base hidden\n")
      await writeFile(join(repository, "replacement"), "base replacement\n")
      await writeFile(join(repository, ".gitattributes"), attributeRules)
      await execFile("git", ["add", ".gitattributes", "a.txt", "b.txt", "hidden.txt", "replacement"], { cwd: repository })
      await execFile("git", ["commit", "-m", "base"], { cwd: repository })
      await execFile("git", ["switch", "-c", "feature"], { cwd: repository })
      await writeFile(join(repository, "a.txt"), "feature a\n")
      await writeFile(join(repository, "b.txt"), "feature b\n")
      await execFile("git", ["commit", "-am", "feature"], { cwd: repository })
      await writeFile(join(repository, "hidden.txt"), "hidden change\n")
      await writeFile(join(repository, "untracked.txt"), "untracked\n")
      await execFile("git", ["add", "hidden.txt", "untracked.txt"], { cwd: repository })
      await execFile("git", ["commit", "-m", "more feature files"], { cwd: repository })
      await execFile("git", ["update-index", "--assume-unchanged", "hidden.txt"], { cwd: repository })

      const run: ReviewRun = {
        repo: "sample",
        repoPath: repository,
        branch: "feature",
        target: "main...HEAD",
        base: "main",
        head: "HEAD",
        status: "active",
        decisionLog: ""
      }
      const reviewedAChangeId = await Effect.runPromise(live(database, Effect.gen(function*() {
        yield* initialize()
        yield* startScopeBudget(run, { scopeSummary: "review changed files" })
        const initial = yield* getReviewFileCoverage(run)
        assert.deepStrictEqual(initial.map(({ path, state, reviews }) => ({ path, state, reviews })), [
          { path: "a.txt", state: "unreviewed", reviews: 0 },
          { path: "b.txt", state: "unreviewed", reviews: 0 },
          { path: "hidden.txt", state: "unreviewed", reviews: 0 },
          { path: "untracked.txt", state: "unreviewed", reviews: 0 }
        ])

        const firstReviewFiles = initial.filter((file) => file.path === "a.txt" || file.path === "untracked.txt")
        yield* recordReviewedFiles(run, { reviewId: "review-1", reviewer: "cold-review", files: firstReviewFiles })
        yield* recordReviewedFiles(run, { reviewId: "review-1", reviewer: "cold-review", files: firstReviewFiles })
        const once = yield* getReviewFileCoverage(run)
        assert.deepStrictEqual(once.map(({ path, state, reviews }) => ({ path, state, reviews })), [
          { path: "b.txt", state: "unreviewed", reviews: 0 },
          { path: "hidden.txt", state: "unreviewed", reviews: 0 },
          { path: "a.txt", state: "reviewed-once", reviews: 1 },
          { path: "untracked.txt", state: "reviewed-once", reviews: 1 }
        ])

        yield* Effect.promise(() => execFile("git", ["add", "untracked.txt"], { cwd: repository }))
        const staged = yield* getReviewFileCoverage(run)
        assert.deepStrictEqual(staged.map(({ path, state, reviews }) => ({ path, state, reviews })), once.map(({ path, state, reviews }) => ({ path, state, reviews })))
        yield* Effect.promise(() => execFile("git", ["reset", "--", "untracked.txt"], { cwd: repository }))

        const bIdentity = once.find((file) => file.path === "b.txt")?.changeId
        yield* Effect.promise(() => execFile("git", ["config", "core.filemode", "false"], { cwd: repository }))
        yield* Effect.promise(() => execFile("git", ["update-index", "--chmod=+x", "b.txt"], { cwd: repository }))
        assert.notStrictEqual((yield* getReviewFileCoverage(run)).find((file) => file.path === "b.txt")?.changeId, bIdentity)
        yield* Effect.promise(() => execFile("git", ["update-index", "--chmod=-x", "b.txt"], { cwd: repository }))

        yield* Effect.promise(() => mkdir(join(repository, "docs")))
        yield* Effect.promise(() => writeFile(join(repository, "docs", ".gitattributes"), "*.md binary\n"))
        const unrelatedAttributes = yield* getReviewFileCoverage(run)
        assert.strictEqual(unrelatedAttributes.find((file) => file.path === "a.txt")?.state, "reviewed-once")
        yield* Effect.promise(() => rm(join(repository, "docs"), { recursive: true }))

        yield* Effect.promise(() => writeFile(join(repository, ".gitattributes"), `a.txt binary\nfiltered.txt filter=coverage-test\n`))
        const attributesChanged = yield* getReviewFileCoverage(run)
        assert.strictEqual(attributesChanged.find((file) => file.path === "a.txt")?.state, "stale")
        yield* Effect.promise(() => writeFile(join(repository, ".gitattributes"), attributeRules))
        yield* Effect.promise(() => rm(join(repository, ".gitattributes")))
        const attributesDeleted = yield* getReviewFileCoverage(run)
        assert.strictEqual(attributesDeleted.find((file) => file.path === "a.txt")?.state, "stale")
        yield* Effect.promise(() => writeFile(join(repository, ".gitattributes"), attributeRules))

        yield* Effect.promise(() => writeFile(join(repository, "filtered.txt"), "mixed case\n"))
        const beforeFilterChange = yield* getReviewFileCoverage(run)
        const filtered = beforeFilterChange.filter((file) => file.path === "filtered.txt")
        yield* recordReviewedFiles(run, { reviewId: "filter-review", reviewer: "cold-review", files: filtered })
        yield* Effect.promise(() => execFile("git", ["config", "filter.coverage-test.clean", "tr a-z A-Z"], { cwd: repository }))
        const afterFilterChange = yield* getReviewFileCoverage(run)
        assert.strictEqual(afterFilterChange.find((file) => file.path === "filtered.txt")?.state, "stale")
        yield* Effect.promise(() => execFile("git", ["config", "filter.coverage-test.clean", "cat"], { cwd: repository }))
        yield* Effect.promise(() => rm(join(repository, "filtered.txt")))

        yield* recordReviewedFiles(run, { reviewId: "review-2", reviewer: "cold-review", files: once.filter((file) => file.path === "a.txt") })
        const twice = yield* getReviewFileCoverage(run)
        assert.deepStrictEqual(twice.map(({ path, state, reviews }) => ({ path, state, reviews })), [
          { path: "b.txt", state: "unreviewed", reviews: 0 },
          { path: "hidden.txt", state: "unreviewed", reviews: 0 },
          { path: "untracked.txt", state: "reviewed-once", reviews: 1 },
          { path: "a.txt", state: "reviewed-twice", reviews: 2 }
        ])
        return initial.find((file) => file.path === "a.txt")?.changeId ?? ""
      })))

      const featureOid = (await execFile("git", ["rev-parse", "feature"], { cwd: repository })).stdout.trim()
      await execFile("git", ["switch", "main"], { cwd: repository })
      const pinnedBeforeCheckout = await Effect.runPromise(live(database, changedFileManifest(repository, "main", featureOid, false)))
      const wrongBranch = await Effect.runPromiseExit(live(database, Effect.gen(function*() {
        yield* initialize()
        return yield* getReviewFileCoverage(run)
      })))
      assert.isTrue(Exit.isFailure(wrongBranch))
      if (Exit.isFailure(wrongBranch)) assert.instanceOf(Cause.squash(wrongBranch.cause), InvalidScopeBudget)
      await execFile("git", ["switch", "feature"], { cwd: repository })

      await writeFile(join(repository, "a.txt"), "changed after review\n")
      const pinnedAfterCheckout = await Effect.runPromise(live(database, changedFileManifest(repository, "main", featureOid, false)))
      assert.deepStrictEqual(pinnedAfterCheckout, pinnedBeforeCheckout)
      const changedDuringReview = await Effect.runPromiseExit(live(database, Effect.gen(function*() {
        yield* initialize()
        return yield* recordReviewedFiles(run, { reviewId: "review-3", reviewer: "cold-review", files: [{ path: "a.txt", changeId: reviewedAChangeId }] })
      })))
      assert.isTrue(Exit.isFailure(changedDuringReview))
      if (Exit.isFailure(changedDuringReview)) assert.instanceOf(Cause.squash(changedDuringReview.cause), InvalidReviewCoverage)
      const stale = await Effect.runPromise(live(database, Effect.gen(function*() {
        yield* initialize()
        return yield* getReviewFileCoverage(run)
      })))
      assert.deepStrictEqual(stale.map(({ path, state, reviews }) => ({ path, state, reviews })), [
        { path: "a.txt", state: "stale", reviews: 0 },
        { path: "b.txt", state: "unreviewed", reviews: 0 },
        { path: "hidden.txt", state: "unreviewed", reviews: 0 },
        { path: "untracked.txt", state: "reviewed-once", reviews: 1 }
      ])

      await execFile("git", ["update-index", "--no-assume-unchanged", "hidden.txt"], { cwd: repository })
      await rm(join(repository, "hidden.txt"))
      const hiddenSource = join(directory, "hidden-source")
      await writeFile(hiddenSource, "indexed hidden one\n")
      const hiddenBlobOne = (await execFile("git", ["hash-object", "-w", hiddenSource], { cwd: repository })).stdout.trim()
      await execFile("git", ["update-index", "--cacheinfo", "100644", hiddenBlobOne, "hidden.txt"], { cwd: repository })
      await execFile("git", ["update-index", "--assume-unchanged", "hidden.txt"], { cwd: repository })
      const hiddenIdentityOne = (await Effect.runPromise(live(database, getReviewFileCoverage(run)))).find((file) => file.path === "hidden.txt")?.changeId
      await execFile("git", ["update-index", "--no-assume-unchanged", "hidden.txt"], { cwd: repository })
      await writeFile(hiddenSource, "indexed hidden two\n")
      const hiddenBlobTwo = (await execFile("git", ["hash-object", "-w", hiddenSource], { cwd: repository })).stdout.trim()
      await execFile("git", ["update-index", "--cacheinfo", "100644", hiddenBlobTwo, "hidden.txt"], { cwd: repository })
      await execFile("git", ["update-index", "--assume-unchanged", "hidden.txt"], { cwd: repository })
      const hiddenIdentityTwo = (await Effect.runPromise(live(database, getReviewFileCoverage(run)))).find((file) => file.path === "hidden.txt")?.changeId
      assert.notStrictEqual(hiddenIdentityOne, hiddenIdentityTwo)
      await execFile("git", ["update-index", "--no-assume-unchanged", "hidden.txt"], { cwd: repository })
      await writeFile(join(repository, "hidden.txt"), "indexed hidden two\n")
      assert.strictEqual((await Effect.runPromise(live(database, getReviewFileCoverage(run)))).find((file) => file.path === "hidden.txt")?.changeId, hiddenIdentityTwo)

      const rawLink = join(repository, "raw-link")
      await symlink(Buffer.from([0xff]), rawLink)
      const rawLinkIdentityOne = (await Effect.runPromise(live(database, getReviewFileCoverage(run)))).find((file) => file.path === "raw-link")?.changeId
      await rm(rawLink)
      await symlink(Buffer.from([0xfe]), rawLink)
      const rawLinkIdentityTwo = (await Effect.runPromise(live(database, getReviewFileCoverage(run)))).find((file) => file.path === "raw-link")?.changeId
      assert.notStrictEqual(rawLinkIdentityOne, rawLinkIdentityTwo)

      const invalid = await Effect.runPromiseExit(live(database, Effect.gen(function*() {
        yield* initialize()
        return yield* recordReviewedFiles(run, { reviewId: "review-4", reviewer: "cold-review", files: [{ path: "missing.txt", changeId: "not-a-current-change" }] })
      })))
      assert.isTrue(Exit.isFailure(invalid))
      if (Exit.isFailure(invalid)) assert.instanceOf(Cause.squash(invalid.cause), InvalidReviewCoverage)

      const nested = join(repository, "nested-dirty")
      await mkdir(nested)
      await execFile("git", ["init", "-b", "main"], { cwd: nested })
      await execFile("git", ["config", "user.email", "test@example.com"], { cwd: nested })
      await execFile("git", ["config", "user.name", "Test"], { cwd: nested })
      await writeFile(join(nested, "nested.txt"), "nested\n")
      await execFile("git", ["add", "nested.txt"], { cwd: nested })
      await execFile("git", ["commit", "-m", "nested"], { cwd: nested })
      await execFile("git", ["add", "nested-dirty"], { cwd: repository })
      const cleanNested = await Effect.runPromise(live(database, Effect.gen(function*() {
        yield* initialize()
        return yield* getReviewFileCoverage(run)
      })))
      assert.strictEqual(cleanNested.find((file) => file.path === "nested-dirty")?.state, "unreviewed")
      await execFile("git", ["config", "diff.submodule", "log"], { cwd: repository })
      await writeFile(join(nested, "nested.txt"), "nested second commit\n")
      await execFile("git", ["commit", "-am", "nested second"], { cwd: nested })
      const movedNested = await Effect.runPromise(live(database, getReviewFileCoverage(run)))
      assert.notStrictEqual(movedNested.find((file) => file.path === "nested-dirty")?.changeId, cleanNested.find((file) => file.path === "nested-dirty")?.changeId)
      await writeFile(join(nested, "nested.txt"), "dirty nested\n")
      const unsupportedNested = await Effect.runPromiseExit(live(database, Effect.gen(function*() {
        yield* initialize()
        return yield* getReviewFileCoverage(run)
      })))
      assert.isTrue(Exit.isFailure(unsupportedNested))
      if (Exit.isFailure(unsupportedNested)) assert.instanceOf(Cause.squash(unsupportedNested.cause), ReviewSnapshotError)
      await execFile("git", ["reset", "--", "nested-dirty"], { cwd: repository })
      await rm(nested, { recursive: true, force: true })

      await rm(join(repository, "replacement"))
      await mkdir(join(repository, "replacement"))
      await writeFile(join(repository, "replacement", "child.txt"), "child\n")
      const replacementCoverage = await Effect.runPromise(live(database, getReviewFileCoverage(run)))
      assert.includeMembers(replacementCoverage.map((file) => file.path), ["replacement", "replacement/child.txt"])
      await execFile("git", ["init", "-b", "main"], { cwd: join(repository, "replacement") })
      await execFile("git", ["add", "child.txt"], { cwd: join(repository, "replacement") })
      await execFile("git", ["-c", "user.email=test@example.com", "-c", "user.name=Test", "commit", "-m", "replacement repo"], { cwd: join(repository, "replacement") })
      assert.notStrictEqual((await Effect.runPromise(live(database, getReviewFileCoverage(run)))).find((file) => file.path === "replacement")?.changeId, replacementCoverage.find((file) => file.path === "replacement")?.changeId)

      await writeFile(join(repository, ".gitignore"), "a.txt\n")
      await execFile("git", ["rm", "--cached", "a.txt"], { cwd: repository })
      const ignoredReplacement = (await Effect.runPromise(live(database, getReviewFileCoverage(run)))).find((file) => file.path === "a.txt")?.changeId
      await writeFile(join(repository, "a.txt"), "ignored local edit\n")
      assert.strictEqual((await Effect.runPromise(live(database, getReviewFileCoverage(run)))).find((file) => file.path === "a.txt")?.changeId, ignoredReplacement)

      const invalidPathEntry = Buffer.concat([Buffer.from(`100644 ${hiddenBlobTwo}\tinvalid-`), Buffer.from([0xff, 0])])
      assert.strictEqual(spawnSync("git", ["update-index", "-z", "--index-info"], { cwd: repository, input: invalidPathEntry }).status, 0)
      const invalidPathCoverage = await Effect.runPromiseExit(live(database, getReviewFileCoverage(run)))
      assert.isTrue(Exit.isFailure(invalidPathCoverage))
      if (Exit.isFailure(invalidPathCoverage)) assert.instanceOf(Cause.squash(invalidPathCoverage.cause), ReviewSnapshotError)

    } finally {
      await rm(directory, { recursive: true, force: true })
    }
  }, 60_000)
})
