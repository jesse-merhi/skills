// @effect-diagnostics-next-line nodeBuiltinImport:off
import { spawnSync } from "node:child_process"
// @effect-diagnostics-next-line nodeBuiltinImport:off
import { mkdtempSync, rmSync } from "node:fs"
import { tmpdir } from "node:os"
// @effect-diagnostics-next-line nodeBuiltinImport:off
import { join } from "node:path"
import { NodeServices } from "@effect/platform-node"
import { assert, describe, it } from "@effect/vitest"
import { Effect, Layer, Schema } from "effect"
import { PullRequestNumber, ReviewTools } from "./PrReview.ts"
import { ReviewToolsLive } from "./ReviewToolsLive.ts"

const runGit = (repository: string, args: ReadonlyArray<string>) => {
  const result = spawnSync("git", args, { cwd: repository, encoding: "utf8" })
  assert.strictEqual(result.status, 0, result.stderr)
  return result.stdout.trim()
}

const Live = ReviewToolsLive.pipe(Layer.provideMerge(NodeServices.layer))

describe("ReviewToolsLive.prepareManagedWorktree", () => {
  it.effect("refuses to repurpose an unrelated worktree at the managed path", () => {
    const repository = mkdtempSync(join(tmpdir(), "pr-review-owner-test-"))
    const managedPath = join(repository, ".worktrees", "pr-42")
    try {
      runGit(repository, ["init", "--quiet"])
      runGit(repository, ["-c", "user.name=Test", "-c", "user.email=test@example.com", "commit", "--allow-empty", "-m", "initial"])
      runGit(repository, ["worktree", "add", "--detach", managedPath])
      const before = runGit(managedPath, ["rev-parse", "HEAD"])

      return Effect.gen(function*() {
        const tools = yield* ReviewTools
        const error = yield* tools.prepareManagedWorktree({
          baseRepositoryUrl: "https://example.test/repo.git",
          headRefName: "feature/review",
          isCrossRepository: false,
          path: managedPath,
          prNumber: Schema.decodeSync(PullRequestNumber)(42),
          repository
        }).pipe(Effect.flip)

        assert.match(error.operation, /validate managed worktree ownership/)
        assert.strictEqual(runGit(managedPath, ["rev-parse", "HEAD"]), before)
      }).pipe(
        // @effect-diagnostics-next-line strictEffectProvide:off
        Effect.provide(Live),
        Effect.ensuring(Effect.sync(() => rmSync(repository, { force: true, recursive: true })))
      )
    } catch (cause) {
      rmSync(repository, { force: true, recursive: true })
      throw cause
    }
  })
})
