import { NodePath } from "@effect/platform-node"
import { assert, describe, it } from "@effect/vitest"
import { Effect, Layer, Option } from "effect"
import { checkoutForReview, ExternalToolError, PullRequest, ReviewTools } from "./PrReview.ts"
import { parseWorktrees } from "./ReviewToolsLive.ts"

interface TestToolsOptions {
  readonly existingWorktree: Option.Option<string>
  readonly failDiff?: boolean
  readonly failMergeBase?: boolean
}

const makeTestTools = (options: TestToolsOptions) => {
  const calls: Array<string> = []
  const failure = (operation: string) => new ExternalToolError({ cause: new Error(operation), operation })
  const layer = Layer.succeed(ReviewTools)(ReviewTools.of({
    createWorktree: ({ path }) => Effect.sync(() => calls.push(`create:${path}`)).pipe(Effect.asVoid),
    diffStat: (_worktree, mergeBase) =>
      options.failDiff === true
        ? Effect.fail(failure("diff"))
        : Effect.succeed(` file.ts | 2 +-${mergeBase}`),
    findBranchWorktree: () => Effect.succeed(options.existingWorktree),
    mergeBase: () =>
      options.failMergeBase === true
        ? Effect.fail(failure("merge-base"))
        : Effect.succeed("abc123"),
    openEditor: (path) => Effect.sync(() => calls.push(`open:${path}`)).pipe(Effect.asVoid),
    pullRequest: () => Effect.succeed(new PullRequest({
      baseRefName: "main",
      headRefName: "feature/review",
      isCrossRepository: false,
      url: "https://github.com/example/repo/pull/42"
    })),
    repositoryRoot: Effect.succeed("/repo")
  }))
  return { calls, layer: Layer.merge(layer, NodePath.layer) }
}

describe("checkoutForReview", () => {
  it.effect("reuses the worktree already bound to the PR branch", () => {
    const test = makeTestTools({ existingWorktree: Option.some("/repo worktrees/feature") })
    return checkoutForReview(42).pipe(
      // @effect-diagnostics-next-line strictEffectProvide:off
      Effect.provide(test.layer),
      Effect.map((result) => {
        assert.isFalse(result.created)
        assert.strictEqual(result.worktree, "/repo worktrees/feature")
        assert.deepStrictEqual(test.calls, ["open:/repo worktrees/feature"])
        assert.isTrue(result.lines.includes(" file.ts | 2 +-abc123"))
      })
    )
  })

  it.effect("creates a detached PR worktree without replacing an existing branch", () => {
    const test = makeTestTools({ existingWorktree: Option.none() })
    return checkoutForReview(42).pipe(
      // @effect-diagnostics-next-line strictEffectProvide:off
      Effect.provide(test.layer),
      Effect.map((result) => {
        assert.isTrue(result.created)
        assert.strictEqual(result.worktree, "/repo/.worktrees/pr-42")
        assert.deepStrictEqual(test.calls, [
          "create:/repo/.worktrees/pr-42",
          "open:/repo/.worktrees/pr-42"
        ])
        assert.isTrue(result.lines.includes("  git worktree remove \"/repo/.worktrees/pr-42\""))
      })
    )
  })

  it.effect("keeps the original best-effort merge-base and diff behavior", () => {
    const test = makeTestTools({
      existingWorktree: Option.some("/repo/feature"),
      failDiff: true,
      failMergeBase: true
    })
    return checkoutForReview(42).pipe(
      // @effect-diagnostics-next-line strictEffectProvide:off
      Effect.provide(test.layer),
      Effect.map((result) => {
        assert.isTrue(result.lines.includes("Changed files (net diff vs main):"))
        assert.deepStrictEqual(test.calls, ["open:/repo/feature"])
      })
    )
  })
})

describe("parseWorktrees", () => {
  it("preserves worktree paths with spaces and exact branch refs", () => {
    const output = [
      "worktree /repo/main",
      "HEAD abc",
      "branch refs/heads/main",
      "",
      "worktree /repo worktrees/feature",
      "HEAD def",
      "branch refs/heads/feature/review",
      "",
      ""
    ].join("\0")

    assert.deepStrictEqual(parseWorktrees(output), [
      { branch: "refs/heads/main", worktree: "/repo/main" },
      { branch: "refs/heads/feature/review", worktree: "/repo worktrees/feature" }
    ])
  })
})
