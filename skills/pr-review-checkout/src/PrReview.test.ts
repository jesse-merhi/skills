import { NodeFileSystem, NodePath } from "@effect/platform-node"
import { assert, describe, it } from "@effect/vitest"
import { Deferred, Effect, Exit, Fiber, FileSystem, Layer, Option, Ref, Schema } from "effect"
import {
  checkoutForReview,
  ExternalToolError,
  PullRequest,
  PullRequestNumber,
  ReviewTools
} from "./PrReview.ts"
import {
  acquireProcessLock,
  authenticatedGitArgs,
  createAndArmBranchOwnership,
  createWorktreeWithRollback,
  parseWorktrees,
  pullRequestCheckoutArgs,
  pullRefTrackingRef,
  repositoryIdentity,
  repositoryPathIdentity,
  signalExitCode
} from "./ReviewToolsLive.ts"

interface TestToolsOptions {
  readonly existingWorktree: Option.Option<string>
  readonly failDiff?: boolean
  readonly failMergeBase?: boolean
  readonly prepare?: Effect.Effect<void, ExternalToolError>
  readonly worktreeCreated?: boolean
}

const prNumber = Schema.decodeSync(PullRequestNumber)(42)

const makeTestTools = (options: TestToolsOptions) => {
  const calls: Array<string> = []
  const failure = (operation: string) => new ExternalToolError({ cause: new Error(operation), operation })
  const layer = Layer.succeed(ReviewTools)(ReviewTools.of({
    prepareManagedWorktree: ({ path }) => Effect.sync(() => calls.push(`prepare:${path}`)).pipe(
      Effect.andThen(options.prepare ?? Effect.void),
      Effect.as({
        branch: "agent-pr-review/pr-42-test",
        created: options.worktreeCreated ?? Option.isNone(options.existingWorktree),
        remote: "agent-pr-review-pr-42-test"
      })
    ),
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
      url: new URL("https://github.com/example/repo/pull/42")
    })),
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
        assert.deepStrictEqual(test.calls, [])
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
          "prepare:/repo/.worktrees/pr-42"
        ])
        assert.isTrue(result.lines.includes("  git worktree remove '/repo/.worktrees/pr-42'"))
        assert.isTrue(result.lines.includes(
          "  git -C '/repo' branch --delete --force 'agent-pr-review/pr-42-test'"
        ))
      })
    )
  })

  it.effect("rechecks managed-path ownership after acquiring the lock", () => {
    const test = makeTestTools({
      existingWorktree: Option.none(),
      worktreeCreated: false
    })
    return checkoutForReview(prNumber).pipe(
      // @effect-diagnostics-next-line strictEffectProvide:off
      Effect.provide(test.layer),
      Effect.map((result) => {
        assert.isFalse(result.created)
        assert.deepStrictEqual(test.calls, [
          "prepare:/repo/.worktrees/pr-42"
        ])
      })
    )
  })

  it.effect("reuses a legacy helper worktree already bound to the PR branch", () => {
    const test = makeTestTools({
      existingWorktree: Option.some("/repo/.worktrees/pr-42")
    })
    return checkoutForReview(prNumber).pipe(
      // @effect-diagnostics-next-line strictEffectProvide:off
      Effect.provide(test.layer),
      Effect.map((result) => {
        assert.isFalse(result.created)
        assert.strictEqual(result.worktree, "/repo/.worktrees/pr-42")
        assert.deepStrictEqual(test.calls, [])
        assert.isTrue(result.lines.includes("Reusing existing worktree for 'feature/review':"))
        assert.isFalse(result.lines.includes("  git worktree remove '/repo/.worktrees/pr-42'"))
      })
    )
  })

  it.effect("removes a newly created worktree when checkout is interrupted", () =>
    Effect.gen(function*() {
      const preparationStarted = yield* Deferred.make<void>()
      const test = makeTestTools({
        existingWorktree: Option.none(),
        prepare: Deferred.succeed(preparationStarted, undefined).pipe(Effect.andThen(Effect.never))
      })
      const fiber = yield* checkoutForReview(prNumber).pipe(
        // @effect-diagnostics-next-line strictEffectProvide:off
        Effect.provide(test.layer),
        Effect.forkChild
      )

      yield* Deferred.await(preparationStarted)
      yield* Fiber.interrupt(fiber)

      assert.deepStrictEqual(test.calls, [
        "prepare:/repo/.worktrees/pr-42"
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
        assert.deepStrictEqual(test.calls, [])
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

describe("repositoryIdentity", () => {
  it("matches HTTPS, SSH, and scp-style URLs for the same repository", () => {
    const expected = "github.com/example/private-repo"
    assert.strictEqual(repositoryIdentity("https://github.com/Example/Private-Repo.git"), expected)
    assert.strictEqual(repositoryIdentity("ssh://git@github.com/example/private-repo.git"), expected)
    assert.strictEqual(repositoryIdentity("git@github.com:example/private-repo.git"), expected)
  })

  it("matches repository coordinates across SSH host aliases", () => {
    assert.strictEqual(
      repositoryPathIdentity("git@github-work:Example/Private-Repo.git"),
      repositoryPathIdentity("https://github.com/example/private-repo.git")
    )
  })
})

describe("authenticatedGitArgs", () => {
  it("runs fallback fetches through the GitHub CLI credential helper", () => {
    assert.deepStrictEqual(authenticatedGitArgs(["fetch", "origin", "pull/42/head"]), [
      "-c",
      "credential.helper=",
      "-c",
      "credential.helper=!gh auth git-credential",
      "fetch",
      "origin",
      "pull/42/head"
    ])
  })
})

describe("signalExitCode", () => {
  it("maps platform signal failures to shell-compatible statuses", () => {
    assert.strictEqual(signalExitCode(new Error("Process interrupted due to receipt of signal: 'SIGTERM'")), 143)
    assert.isUndefined(signalExitCode(new Error("not a signal failure")))
  })
})

describe("pullRefTrackingRef", () => {
  it("uses a deterministic helper-owned namespace", () => {
    assert.strictEqual(pullRefTrackingRef(prNumber), "refs/remotes/agent-pr-review/pr-42/head")
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

describe("createAndArmBranchOwnership", () => {
  it.effect("delays cancellation until successful branch creation is marked owned", () =>
    Effect.gen(function*() {
      const creationStarted = yield* Deferred.make<void>()
      const finishCreation = yield* Deferred.make<void>()
      const ownsBranch = yield* Ref.make(false)
      const fiber = yield* createAndArmBranchOwnership(
        Deferred.succeed(creationStarted, undefined).pipe(Effect.andThen(Deferred.await(finishCreation))),
        ownsBranch
      ).pipe(Effect.forkChild)

      yield* Deferred.await(creationStarted)
      assert.isFalse(yield* Ref.get(ownsBranch))
      const interrupted = yield* Fiber.interrupt(fiber).pipe(Effect.forkChild)
      yield* Deferred.succeed(finishCreation, undefined)
      yield* Fiber.await(interrupted)

      assert.isTrue(yield* Ref.get(ownsBranch))
    }))
})

describe("acquireProcessLock", () => {
  const platformLayer = Layer.merge(NodeFileSystem.layer, NodePath.layer)

  it.effect("reclaims a lock whose process is no longer alive", () =>
    Effect.scoped(Effect.gen(function*() {
      const fileSystem = yield* FileSystem.FileSystem
      const directory = yield* fileSystem.makeTempDirectoryScoped({ prefix: "pr-review-lock-test-" })
      const lockPath = `${directory}/review.lock`
      yield* fileSystem.makeDirectory(lockPath)
      yield* fileSystem.writeFileString(`${lockPath}/owner-dead.json`, '{"nonce":"dead","pid":111}')

      yield* acquireProcessLock({
        isAlive: () => Effect.succeed(false),
        lockPath,
        pid: 222
      })

      const entries = yield* fileSystem.readDirectory(lockPath)
      assert.lengthOf(entries, 1)
      assert.match(yield* fileSystem.readFileString(`${lockPath}/${entries[0]}`), /"pid":222/)
    })).pipe(
      // @effect-diagnostics-next-line strictEffectProvide:off
      Effect.provide(platformLayer)
    ))

  it.effect("does not steal a lock from a live process", () =>
    Effect.scoped(Effect.gen(function*() {
      const fileSystem = yield* FileSystem.FileSystem
      const directory = yield* fileSystem.makeTempDirectoryScoped({ prefix: "pr-review-lock-test-" })
      const lockPath = `${directory}/review.lock`
      yield* fileSystem.makeDirectory(lockPath)
      yield* fileSystem.writeFileString(`${lockPath}/owner-live.json`, '{"nonce":"live","pid":111}')

      const error = yield* acquireProcessLock({
        isAlive: () => Effect.succeed(true),
        lockPath,
        pid: 222
      }).pipe(Effect.flip)

      assert.strictEqual(error.operation, `acquire ${lockPath}`)
      assert.strictEqual(
        yield* fileSystem.readFileString(`${lockPath}/owner-live.json`),
        '{"nonce":"live","pid":111}'
      )
    })).pipe(
      // @effect-diagnostics-next-line strictEffectProvide:off
      Effect.provide(platformLayer)
    ))

  it.effect("reclaims a lock after its PID has been reused by another process", () =>
    Effect.scoped(Effect.gen(function*() {
      const fileSystem = yield* FileSystem.FileSystem
      const directory = yield* fileSystem.makeTempDirectoryScoped({ prefix: "pr-review-lock-pid-reuse-test-" })
      const lockPath = `${directory}/review.lock`
      yield* fileSystem.makeDirectory(lockPath)
      yield* fileSystem.writeFileString(
        `${lockPath}/owner-old.json`,
        '{"identity":"old-start","nonce":"old","pid":111}'
      )

      yield* acquireProcessLock({
        isAlive: () => Effect.succeed(true),
        lockPath,
        pid: 222,
        processIdentity: (pid) => Effect.succeed(Option.some(pid === 111 ? "new-start" : "current-start"))
      })

      const entries = yield* fileSystem.readDirectory(lockPath)
      assert.lengthOf(entries, 1)
      const owner = yield* fileSystem.readFileString(`${lockPath}/${entries[0]}`)
      assert.match(owner, /"identity":"current-start"/)
      assert.match(owner, /"pid":222/)
    })).pipe(
      // @effect-diagnostics-next-line strictEffectProvide:off
      Effect.provide(platformLayer)
    ))

  it.effect("does not let a stale reclaimer delete a concurrently acquired lock", () =>
    Effect.scoped(Effect.gen(function*() {
      const fileSystem = yield* FileSystem.FileSystem
      const directory = yield* fileSystem.makeTempDirectoryScoped({ prefix: "pr-review-lock-race-test-" })
      const lockPath = `${directory}/review.lock`
      yield* fileSystem.makeDirectory(lockPath)
      yield* fileSystem.writeFileString(`${lockPath}/owner-dead.json`, '{"nonce":"dead","pid":111}')
      const staleChecks = yield* Ref.make(0)
      const bothObservedStale = yield* Deferred.make<void>()
      const isAlive = (pid: number) => pid === 111
        ? Ref.updateAndGet(staleChecks, (count) => count + 1).pipe(
          Effect.tap((count) => count === 2 ? Deferred.succeed(bothObservedStale, undefined) : Effect.void),
          Effect.andThen(Deferred.await(bothObservedStale)),
          Effect.as(false)
        )
        : Effect.succeed(true)

      const outcomes = yield* Effect.all([
        Effect.exit(acquireProcessLock({ isAlive, lockPath, pid: 222 })),
        Effect.exit(acquireProcessLock({ isAlive, lockPath, pid: 333 }))
      ], { concurrency: "unbounded" })

      assert.strictEqual(outcomes.filter(Exit.isSuccess).length, 1)
      assert.strictEqual(outcomes.filter(Exit.isFailure).length, 1)
      const entries = yield* fileSystem.readDirectory(lockPath)
      assert.lengthOf(entries, 1)
      const owner = yield* fileSystem.readFileString(`${lockPath}/${entries[0]}`)
      assert.match(owner, /"pid":(?:222|333)/)
    })).pipe(
      // @effect-diagnostics-next-line strictEffectProvide:off
      Effect.provide(platformLayer)
    ))
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
  it("uses a dedicated branch and forces only an already-owned worktree", () => {
    assert.deepStrictEqual(
      pullRequestCheckoutArgs(prNumber, "agent-pr-review/pr-42-uuid", false),
      ["pr", "checkout", "42", "--branch", "agent-pr-review/pr-42-uuid"]
    )
    assert.deepStrictEqual(
      pullRequestCheckoutArgs(prNumber, "agent-pr-review/pr-42-uuid", true),
      ["pr", "checkout", "42", "--branch", "agent-pr-review/pr-42-uuid", "--force"]
    )
  })
})
