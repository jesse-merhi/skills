import * as Effect from "effect/Effect"
import * as Schema from "effect/Schema"
import * as SqlClient from "effect/unstable/sql/SqlClient"
import { randomUUID } from "node:crypto"

import { checkedTrimmedText } from "../../../packages/effect-cli/CheckedProcess.ts"
import { requireCleanReviewTree, trustedExecutable } from "./NativeReview.ts"
import { getScopeBudget, reviewProgress, type ReviewRun } from "./ReviewFindings.ts"
import { ReviewLimitsBlocked } from "./ReviewLimits.ts"
import { ProgressConflict } from "./ReviewProgress.ts"

const Text = Schema.String.check(Schema.isMinLength(1))
export const ReviewPhase = Schema.Literals(["native", "cold"])
export const ReviewOutcome = Schema.Literals(["clean", "clean-except-queue", "findings", "blocked"])
const Review = Schema.Struct({
  reviewId: Text, runId: Text, repo: Text, repoPath: Text, branch: Schema.String, target: Text, base: Text,
  head: Text, baseOid: Text, phase: ReviewPhase, startRevision: Schema.Number,
  status: Schema.Literals(["open", "finished", "blocked"]), outcome: Schema.String, evidence: Schema.String,
  launched: Schema.Literals([0, 1])
})
export type Review = typeof Review.Type
export const reviewRun = (review: Review): ReviewRun => ({ ...review, status: "active", decisionLog: "" })

export const getReview = Effect.fn("ReviewSession.get")(function*(reviewId: string) {
  const sql = yield* SqlClient.SqlClient
  const rows = yield* sql`select i.id as reviewId, i.run_id as runId, r.repo_name as repo, r.repo_path as repoPath,
    coalesce(r.branch, '') as branch, r.target, r.base, i.head, i.base_oid as baseOid, i.phase,
    i.start_revision as startRevision, i.status, i.outcome, i.evidence, i.launched
    from review_invocations i join review_runs r on r.id = i.run_id where i.id = ${reviewId}`
  const review = (yield* Schema.decodeUnknownEffect(Schema.Array(Review))(rows))[0]
  if (review === undefined) return yield* new ProgressConflict({ message: "Unknown review ID; use the ID returned by review start or review native" })
  return review
})

export const checkReviewTarget = Effect.fn("ReviewSession.checkTarget")(function*(review: Review) {
  const scope = yield* getScopeBudget(reviewRun(review))
  const git = yield* trustedExecutable("git", review.repoPath)
  const head = scope.pinnedHeadOid || (yield* checkedTrimmedText(git, ["rev-parse", "HEAD"], { cwd: review.repoPath }))
  if (head !== review.head || scope.baseOid !== review.baseOid) return yield* new ProgressConflict({ message: "Review target changed; finish this review as blocked and review the intended commit" })
})

export const requireOpenReview = Effect.fn("ReviewSession.requireOpen")(function*(reviewId: string) {
  const review = yield* getReview(reviewId)
  if (review.status !== "open") return yield* new ProgressConflict({ message: "This review is closed; start another review before adding findings or coverage" })
  const progress = yield* reviewProgress(reviewRun(review))
  if (progress?.outcome !== "started" || progress.revision !== review.startRevision) return yield* new ProgressConflict({ message: "Review progress changed; inspect review status before continuing" })
  yield* checkReviewTarget(review)
  return review
})

/** The transaction keeps a record tied to its open review even across concurrent CLI calls. */
export const withOpenReview = <A, E, R>(reviewId: string, action: (review: Review) => Effect.Effect<A, E, R>) => Effect.gen(function*() {
  const sql = yield* SqlClient.SqlClient
  return yield* sql.withTransaction(Effect.gen(function*() {
    return yield* action(yield* requireOpenReview(reviewId))
  }))
})

export const startReview = Effect.fn("ReviewSession.start")(function*(run: ReviewRun, phase: typeof ReviewPhase.Type, evidence: string) {
  const sql = yield* SqlClient.SqlClient
  const scope = yield* getScopeBudget(run)
  const result = yield* sql.withTransaction(Effect.gen(function*() {
    const pending = (yield* sql<{ readonly id: string }>`select id from review_invocations where run_id = ${scope.runId} and status = 'open'`)[0]
    if (pending !== undefined) {
      const review = yield* getReview(pending.id)
      if (review.phase !== phase) return yield* new ProgressConflict({ message: `Review ${review.reviewId} is still open; finish it before starting another phase` })
      yield* checkReviewTarget(review)
      return { ...review, resumed: true }
    }
    const head = scope.pinnedHeadOid || (yield* requireCleanReviewTree(run.repoPath))
    const progress = yield* reviewProgress(run)
    if (progress?.outcome === "started") return yield* new ProgressConflict({ message: "An earlier review is still running; finish it before starting another" })
    const started = yield* reviewProgress(run, { expectedRevision: progress?.revision ?? 0, phase, head, outcome: "started", evidence }).pipe(
      Effect.catchTag("ReviewLimitsBlocked", error => Effect.succeed(error))
    )
    // Preserve the measured scope block so an authorized retry can use the same scope.
    if (started instanceof ReviewLimitsBlocked) return started
    if (started === undefined) return yield* new ProgressConflict({ message: "Review start did not create progress" })
    const reviewId = randomUUID()
    yield* sql`insert into review_invocations (id, run_id, head, base_oid, phase, start_revision, status, outcome, evidence, launched)
      values (${reviewId}, ${scope.runId}, ${head}, ${scope.baseOid}, ${phase}, ${started.revision}, 'open', '', ${evidence}, 0)`
    return { ...yield* getReview(reviewId), resumed: false }
  }))
  if (result instanceof ReviewLimitsBlocked) return yield* result
  return result
})

export const finishReview = Effect.fn("ReviewSession.finish")(function*(reviewId: string, outcome: typeof ReviewOutcome.Type, evidence: string) {
  const sql = yield* SqlClient.SqlClient
  return yield* sql.withTransaction(Effect.gen(function*() {
    const review = yield* getReview(reviewId)
    if (review.status !== "open") {
      if (review.outcome !== outcome || review.evidence !== evidence) return yield* new ProgressConflict({ message: "The saved review result is immutable" })
      return review
    }
    if (outcome !== "blocked") yield* checkReviewTarget(review)
    const progress = yield* reviewProgress(reviewRun(review))
    if (progress?.outcome !== "started" || progress.revision !== review.startRevision) return yield* new ProgressConflict({ message: "The review no longer matches the saved invocation" })
    yield* reviewProgress(reviewRun(review), { expectedRevision: progress.revision, phase: review.phase, head: review.head, outcome, evidence }, reviewId)
    yield* sql`update review_invocations set status = ${outcome === "blocked" ? "blocked" : "finished"}, outcome = ${outcome}, evidence = ${evidence} where id = ${reviewId}`
    return yield* getReview(reviewId)
  }))
})

/** Reserve the external launch once; repeating the command returns the existing review. */
export const claimNativeLaunch = Effect.fn("ReviewSession.claimNativeLaunch")(function*(reviewId: string) {
  return yield* withOpenReview(reviewId, review => Effect.gen(function*() {
    if (review.phase !== "native") return yield* new ProgressConflict({ message: "Only a native review can launch the native reviewer" })
    if (review.launched === 1) return false
    const sql = yield* SqlClient.SqlClient
    yield* sql`update review_invocations set launched = 1 where id = ${reviewId}`
    return true
  }))
})
