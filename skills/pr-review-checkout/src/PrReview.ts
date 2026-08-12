import { Context, Effect, Option, Path, Schema, String } from "effect"

export class PullRequest extends Schema.Class<PullRequest>("skills/pr-review-checkout/PullRequest")({
  baseRefName: Schema.NonEmptyString,
  headRefName: Schema.NonEmptyString,
  isCrossRepository: Schema.Boolean,
  url: Schema.NonEmptyString
}) {}

export class ExternalToolError extends Schema.TaggedError<ExternalToolError>()("ExternalToolError", {
  cause: Schema.Defect(),
  operation: Schema.String
}) {}

export interface CreateWorktreeInput {
  readonly path: string
  readonly prNumber: number
  readonly repository: string
}

export class ReviewTools extends Context.Service<ReviewTools, {
  readonly diffStat: (worktree: string, mergeBase: string) => Effect.Effect<string, ExternalToolError>
  readonly findBranchWorktree: (branch: string) => Effect.Effect<Option.Option<string>, ExternalToolError>
  readonly mergeBase: (worktree: string, base: string) => Effect.Effect<string, ExternalToolError>
  readonly openEditor: (worktree: string) => Effect.Effect<void, ExternalToolError>
  readonly pullRequest: (prNumber: number) => Effect.Effect<PullRequest, ExternalToolError>
  readonly repositoryRoot: Effect.Effect<string, ExternalToolError>
  readonly createWorktree: (input: CreateWorktreeInput) => Effect.Effect<void, ExternalToolError>
}>()("@jesse-merhi/skills/skills/pr-review-checkout/src/PrReview/ReviewTools") {}

export interface ReviewCheckout {
  readonly created: boolean
  readonly lines: ReadonlyArray<string>
  readonly worktree: string
}

export const checkoutForReview = Effect.fn("checkoutForReview")(function*(prNumber: number) {
  const path = yield* Path.Path
  const tools = yield* ReviewTools
  const pullRequest = yield* tools.pullRequest(prNumber)
  const repository = yield* tools.repositoryRoot
  const existing = yield* tools.findBranchWorktree(pullRequest.headRefName)
  const created = Option.isNone(existing)
  const worktree = Option.getOrElse(existing, () => path.join(repository, ".worktrees", `pr-${prNumber}`))

  if (created) {
    yield* tools.createWorktree({ path: worktree, prNumber, repository })
  }

  const mergeBase = yield* tools.mergeBase(worktree, pullRequest.baseRefName).pipe(
    Effect.orElseSucceed(() => pullRequest.baseRefName)
  )
  const diffStat = yield* tools.diffStat(worktree, mergeBase).pipe(
    Effect.orElseSucceed(() => "")
  )

  yield* tools.openEditor(worktree)

  const lines = [
    created
      ? `No worktree bound to '${pullRequest.headRefName}' — created a detached review worktree at:`
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

  if (created) {
    lines.push(
      "",
      "When done reviewing this PR, remove the throwaway worktree:",
      `  git worktree remove ${JSON.stringify(worktree)}`
    )
  }

  return { created, lines, worktree } satisfies ReviewCheckout
})
