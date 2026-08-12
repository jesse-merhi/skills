import { NodePath } from "@effect/platform-node"
import { assert, describe, it } from "@effect/vitest"
import { Deferred, Effect, Fiber, Layer, Option, Schema } from "effect"
import {
  checkoutForReview,
  ExternalToolError,
  PullRequest,
  PullRequestNumber,
  ReviewTools
} from "./PrReview.ts"
import { createWorktreeWithRollback, parseWorktrees, pullRequestCheckoutArgs } from "./ReviewToolsLive.ts"

interface TestToolsOptions {
  readonly checkout?: Effect.Effect<void, ExternalToolError>
  readonly existingWorktree: Option.Option<string>
  readonly failDiff?: boolean
  readonly failMergeBase?: boolean
  readonly hasManagedWorktree?: boolean
}

const prNumber = Schema.decodeSync(PullRequestNumber)(42)

const makeTestTools = (options: TestToolsOptions) => {
  const calls: Array<string> = []
  const failure = (operation: string) => new ExternalToolError({ cause: new Error(operation), operation })
  const layer = Layer.succeed(ReviewTools)(ReviewTools.of({
    checkoutPullRequest: (path) => Effect.sync(() => calls.push(`checkout:${path}`)).pipe(
      Effect.andThen(options.checkout ?? Effect.void)
    ),
    createWorktree: ({ path }) => Effect.sync(() => calls.push(`create:${path}`)).pipe(Effect.asVoid),
    diffStat: (_worktree, mergeBase) =>
      options.failDiff === true
        ? Effect.fail(failure("diff"))
        : Effect.succeed(` file.ts | 2 +-${mergeBase}`),
    findBranchWorktree: () => Effect.succeed(options.existingWorktree),
    hasWorktree: () => Effect.succeed(options.hasManagedWorktree === true),
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
    removeWorktree: (_repository, path) => Effect.sync(() => calls.push(`remove:${path}`)).pipe(Effect.asVoid),
    repositoryRoot: Effect.succeed("/repo")
  }))
  return { calls, layer: Layer.merge(layer, NodePath.layer) }
}

describe("checkoutForReview", () => {
  it.effect("reuses the worktree already bound to the PR branch", () => {
    const test = makeTestTools({ existingWorktree: Option.some("/repo worktrees/feature") })
    return checkoutForReview(prNumber).pipe(
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

  it.effect("creates a managed PR worktree without replacing an existing branch", () => {
    const test = makeTestTools({ existingWorktree: Option.none() })
    return checkoutForReview(prNumber).pipe(
      // @effect-diagnostics-next-line strictEffectProvide:off
      Effect.provide(test.layer),
      Effect.map((result) => {
        assert.isTrue(result.created)
        assert.strictEqual(result.worktree, "/repo/.worktrees/pr-42")
        assert.deepStrictEqual(test.calls, [
          "create:/repo/.worktrees/pr-42",
          "checkout:/repo/.worktrees/pr-42",
          "open:/repo/.worktrees/pr-42"
        ])
        assert.isTrue(result.lines.includes("  git worktree remove \"/repo/.worktrees/pr-42\""))
      })
    )
  })

  it.effect("refreshes the managed PR worktree created by an earlier invocation", () => {
    const test = makeTestTools({
      existingWorktree: Option.some("/repo/.worktrees/pr-42")
    })
    return checkoutForReview(prNumber).pipe(
      // @effect-diagnostics-next-line strictEffectProvide:off
      Effect.provide(test.layer),
      Effect.map((result) => {
        assert.isFalse(result.created)
        assert.strictEqual(result.worktree, "/repo/.worktrees/pr-42")
        assert.deepStrictEqual(test.calls, [
          "checkout:/repo/.worktrees/pr-42",
          "open:/repo/.worktrees/pr-42"
        ])
        assert.isTrue(result.lines.includes("Refreshing managed review worktree for PR #42:"))
        assert.isTrue(result.lines.includes("  git worktree remove \"/repo/.worktrees/pr-42\""))
      })
    )
  })

  it.effect("removes a newly created worktree when checkout is interrupted", () =>
    Effect.gen(function*() {
      const checkoutStarted = yield* Deferred.make<void>()
      const test = makeTestTools({
        checkout: Deferred.succeed(checkoutStarted, undefined).pipe(Effect.andThen(Effect.never)),
        existingWorktree: Option.none()
      })
      const fiber = yield* checkoutForReview(prNumber).pipe(
        // @effect-diagnostics-next-line strictEffectProvide:off
        Effect.provide(test.layer),
        Effect.forkChild
      )

      yield* Deferred.await(checkoutStarted)
      yield* Fiber.interrupt(fiber)

      assert.deepStrictEqual(test.calls, [
        "create:/repo/.worktrees/pr-42",
        "checkout:/repo/.worktrees/pr-42",
        "remove:/repo/.worktrees/pr-42"
      ])
    }))

  it.effect("keeps the original best-effort merge-base and diff behavior", () => {
    const test = makeTestTools({
      existingWorktree: Option.some("/repo/feature"),
      failDiff: true,
      failMergeBase: true
    })
    return checkoutForReview(prNumber).pipe(
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
  it("preserves paths with spaces, exact branch refs, and detached worktrees", () => {
    const output = [
      "worktree /repo/main",
      "HEAD abc",
      "branch refs/heads/main",
      "",
      "worktree /repo worktrees/feature",
      "HEAD def",
      "branch refs/heads/feature/review",
      "",
      "worktree /repo/.worktrees/pr-42",
      "HEAD 123",
      "detached",
      "",
      ""
    ].join("\0")

    assert.deepStrictEqual(parseWorktrees(output), [
      { branch: "refs/heads/main", worktree: "/repo/main" },
      { branch: "refs/heads/feature/review", worktree: "/repo worktrees/feature" },
      { branch: null, worktree: "/repo/.worktrees/pr-42" }
    ])
  })
})

describe("createWorktreeWithRollback", () => {
  it.effect("installs rollback before worktree creation can be interrupted", () =>
    Effect.gen(function*() {
      const creationStarted = yield* Deferred.make<void>()
      const calls: Array<string> = []
      const create = Deferred.succeed(creationStarted, undefined).pipe(Effect.andThen(Effect.never))
      const rollback = Effect.sync(() => calls.push("rollback")).pipe(Effect.asVoid)
      const fiber = yield* createWorktreeWithRollback(create, rollback).pipe(Effect.forkChild)

      yield* Deferred.await(creationStarted)
      yield* Fiber.interrupt(fiber)

      assert.deepStrictEqual(calls, ["rollback"])
    }))
})

describe("PullRequestNumber", () => {
  it("accepts only positive safe integers", () => {
    assert.isTrue(Schema.is(PullRequestNumber)(42))
    assert.isFalse(Schema.is(PullRequestNumber)(0))
    assert.isFalse(Schema.is(PullRequestNumber)(-1))
    assert.isFalse(Schema.is(PullRequestNumber)(1.5))
  })
})

describe("pullRequestCheckoutArgs", () => {
  it("keeps the managed worktree on the named PR branch", () => {
    assert.deepStrictEqual(pullRequestCheckoutArgs(prNumber), ["pr", "checkout", "42"])
  })
})
