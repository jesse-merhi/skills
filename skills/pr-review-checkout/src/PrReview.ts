import { Context, Effect, Option, Path, Runtime, Schema, String } from "effect"

export const PullRequestNumber = Schema.Int.pipe(
  Schema.check(Schema.isGreaterThan(0)),
  Schema.brand("@jesse-merhi/skills/PullRequestNumber")
)
export type PullRequestNumber = typeof PullRequestNumber.Type

export class PullRequest extends Schema.Class<PullRequest>("skills/pr-review-checkout/PullRequest")({
  baseRefName: Schema.NonEmptyString,
  headRefName: Schema.NonEmptyString,
  isCrossRepository: Schema.Boolean,
  url: Schema.NonEmptyString
}) {}

export class ExternalToolError extends Schema.TaggedError<ExternalToolError>()("ExternalToolError", {
  cause: Schema.Defect(),
  exitCode: Schema.optional(Schema.Int),
  stderr: Schema.optional(Schema.String),
  operation: Schema.String
}) {
  override readonly [Runtime.errorReported] = false
  override get [Runtime.errorExitCode]() {
    return this.exitCode ?? 1
  }
}

export interface PrepareManagedWorktreeInput {
  readonly headRefName: string
  readonly path: string
  readonly prNumber: PullRequestNumber
  readonly repository: string
}

export interface ManagedWorktreePreparation {
  readonly branch: string
  readonly created: boolean
}

export class ReviewTools extends Context.Service<ReviewTools, {
  readonly diffStat: (worktree: string, mergeBase: string) => Effect.Effect<string, ExternalToolError>
  readonly findBranchWorktree: (branch: string) => Effect.Effect<Option.Option<string>, ExternalToolError>
  readonly mergeBase: (worktree: string, base: string) => Effect.Effect<string, ExternalToolError>
  readonly openEditor: (worktree: string) => Effect.Effect<void, ExternalToolError>
  readonly pullRequest: (prNumber: PullRequestNumber) => Effect.Effect<PullRequest, ExternalToolError>
  readonly repositoryRoot: Effect.Effect<string, ExternalToolError>
  readonly prepareManagedWorktree: (
    input: PrepareManagedWorktreeInput
  ) => Effect.Effect<ManagedWorktreePreparation, ExternalToolError>
}>()("@jesse-merhi/skills/skills/pr-review-checkout/src/PrReview/ReviewTools") {}

export interface ReviewCheckout {
  readonly created: boolean
  readonly lines: ReadonlyArray<string>
  readonly worktree: string
}

export const checkoutForReview = Effect.fn("checkoutForReview")(function*(prNumber: PullRequestNumber) {
  const path = yield* Path.Path
  const tools = yield* ReviewTools
  const pullRequest = yield* tools.pullRequest(prNumber)
  const repository = yield* tools.repositoryRoot
  const managedWorktreePath = path.join(repository, ".worktrees", `pr-${prNumber}`)
  const branchWorktree = yield* tools.findBranchWorktree(pullRequest.headRefName)
  const worktree = Option.getOrElse(branchWorktree, () => managedWorktreePath)
  const managed = worktree === managedWorktreePath
  const preparation = managed
    ? yield* tools.prepareManagedWorktree({
      headRefName: pullRequest.headRefName,
      path: worktree,
      prNumber,
      repository
    })
    : null
  const created = preparation?.created ?? false

  return yield* Effect.gen(function*() {
    const mergeBase = yield* tools.mergeBase(worktree, pullRequest.baseRefName).pipe(
      Effect.orElseSucceed(() => pullRequest.baseRefName)
    )
    const diffStat = yield* tools.diffStat(worktree, mergeBase).pipe(
      Effect.orElseSucceed(() => "")
    )

    yield* tools.openEditor(worktree)

    const lines = [
      created
        ? `No worktree bound to '${pullRequest.headRefName}' — created a managed review worktree at:`
        : managed
        ? `Refreshing managed review worktree for PR #${prNumber}:`
        : `Reusing existing worktree for '${pullRequest.headRefName}':`,
      `  ${worktree}`,
      "",
      `PR #${prNumber}  (${pullRequest.url})`,
      `branch : ${pullRequest.headRefName}`,
      `base   : ${pullRequest.baseRefName}   (cross-repo: ${pullRequest.isCrossRepository})`,
      "",
      `Changed files (net diff vs ${pullRequest.baseRefName}):`,
      ...String.split(diffStat, "\n").filter((line) => line.length > 0),
      "",
      "Review in the opened VS Code window:",
      "  • Open the dedicated GitHub Pull Request activity view.",
      `  • Under 'Changes in Pull Request #${prNumber}', click a filename to open its diff.`,
      "  • Navigate from the modified/right pane with Cmd-click, F12, or Shift+F12.",
      "  • Use the general GitHub/Octocat view only to discover PRs and issues.",
      "  • A locked tab or 'Partial mode' means the wrong remote-preview surface is open."
    ]

    if (preparation !== null) {
      lines.push(
        "",
        "When done reviewing this PR, remove the throwaway worktree:",
        `  git worktree remove ${JSON.stringify(worktree)}`,
        `  git -C ${JSON.stringify(repository)} branch --delete --force ${JSON.stringify(preparation.branch)}`
      )
    }

    return { created, lines, worktree } satisfies ReviewCheckout
  })
})
