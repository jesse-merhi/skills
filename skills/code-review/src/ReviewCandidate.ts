import * as Effect from "effect/Effect"
import * as Schema from "effect/Schema"
import * as SqlClient from "effect/unstable/sql/SqlClient"
import { createHash, randomUUID } from "node:crypto"

import type { ReviewRun, ScopeBudgetStatus } from "./ReviewFindings.ts"

import { checkedText, checkedTrimmedText } from "../../../packages/effect-cli/CheckedProcess.ts"
import { requireCleanReviewTree } from "./NativeReview.ts"
import { trustedExecutable } from "./ReviewEnvironment.ts"
import { readProgressHistory } from "./ReviewProgress.ts"

const Text = Schema.String.check(Schema.isMinLength(1))
export const CandidateDecision = Schema.Literals(["reuse", "focused", "broad"])
export type CandidateDecision = typeof CandidateDecision.Type
export const CandidatePhase = Schema.Literals(["native", "cold"])
export type CandidatePhase = typeof CandidatePhase.Type

const SourceReview = Schema.Struct({
  reviewId: Text,
  phase: CandidatePhase,
  head: Text,
  baseOid: Text,
  outcome: Schema.Literals(["clean", "clean-except-queue"]),
  evidence: Text,
  startRevision: Schema.Number
})
export type SourceReview = typeof SourceReview.Type

const CandidateRow = Schema.Struct({
  id: Text,
  run_id: Text,
  source_run_id: Text,
  source_progress_revision: Schema.Number,
  source_base_oid: Text,
  source_head_oid: Text,
  source_tree_oid: Text,
  source_patch_id: Text,
  source_reviews_json: Schema.String,
  candidate_base_oid: Text,
  candidate_head_oid: Text,
  candidate_tree_oid: Text,
  candidate_patch_id: Text,
  target_progress_revision: Schema.Number,
  scope_generation: Schema.Number,
  status: Schema.Literals(["prepared", "assessed"]),
  decision: Schema.String,
  affected_phases_json: Schema.String,
  semantic_impact_evidence: Schema.String,
  created_at: Schema.Number,
  assessed_at: Schema.Number
})
type CandidateRow = typeof CandidateRow.Type

const SourceReviewsJson = Schema.fromJsonString(Schema.Array(SourceReview))
const PhasesJson = Schema.fromJsonString(Schema.Array(CandidatePhase))

export class CandidateConflict extends Schema.TaggedError<CandidateConflict>()("CandidateConflict", {
  message: Schema.String
}) {}

interface SourceRunRow {
  readonly id: string
  readonly scope_status: string
  readonly head: string
  readonly base_oid: string
}

interface InvocationRow {
  readonly reviewId: string
  readonly phase: string
  readonly head: string
  readonly baseOid: string
  readonly outcome: string
  readonly evidence: string
  readonly startRevision: number
}

interface RevisionRow { readonly revision: number }

const progressRevision = Effect.fn("ReviewCandidate.progressRevision")(function*(runId: string) {
  const sql = yield* SqlClient.SqlClient
  const row = (yield* sql<RevisionRow>`select coalesce(max(revision), 0) as revision from review_progress_events where run_id = ${runId}`)[0]
  return row?.revision ?? 0
})

const commitIdentity = Effect.fn("ReviewCandidate.commitIdentity")(function*(repoPath: string, baseOid: string, headOid: string) {
  const git = yield* trustedExecutable("git", repoPath)
  const [base, head, tree] = yield* Effect.all([
    checkedTrimmedText(git, ["rev-parse", "--verify", `${baseOid}^{commit}`], { cwd: repoPath }),
    checkedTrimmedText(git, ["rev-parse", "--verify", `${headOid}^{commit}`], { cwd: repoPath }),
    checkedTrimmedText(git, ["rev-parse", "--verify", `${headOid}^{tree}`], { cwd: repoPath })
  ])
  const comparisonBaseOid = yield* checkedTrimmedText(git, ["merge-base", base, head], { cwd: repoPath })
  const patch = yield* checkedText(git, ["diff", "--binary", "--full-index", "--no-ext-diff", "--no-textconv", "--no-renames", comparisonBaseOid, head, "--"], { cwd: repoPath })
  const patchId = createHash("sha256").update(patch).digest("hex")
  return { baseOid: base, comparisonBaseOid, headOid: head, treeOid: tree, patchId }
})

const sourceReviews = Effect.fn("ReviewCandidate.sourceReviews")(function*(runId: string, head: string, baseOid: string, applyScopeCutoff = true) {
  const sql = yield* SqlClient.SqlClient
  const rows = yield* sql<InvocationRow>`select id as reviewId, phase, head, base_oid as baseOid, outcome, evidence, start_revision as startRevision
    from review_invocations where run_id = ${runId} and status = 'finished'
      and outcome in ('clean', 'clean-except-queue') and head = ${head} and base_oid = ${baseOid} order by start_revision desc`
  const requirements = yield* targetRequirements(runId)
  const history = yield* readProgressHistory(runId)
  const inheritedRows = yield* sql`select * from review_candidates where run_id = ${runId} and status = 'assessed'
    and candidate_head_oid = ${head} and candidate_base_oid = ${baseOid}
    order by assessed_at desc, created_at desc, rowid desc limit 1`
  const inheritedRow = (yield* Schema.decodeUnknownEffect(Schema.Array(CandidateRow))(inheritedRows))[0]
  const inherited = inheritedRow === undefined ? undefined : yield* decodeCandidate(inheritedRow)
  const scope = (yield* sql<{ readonly evidence_revision: number }>`select evidence_revision from review_scope_budgets where run_id = ${runId}`)[0]
  const eligible: Array<SourceReview> = []
  for (const phase of ["native", "cold"] as const) {
    const scopeCutoff = applyScopeCutoff ? scope?.evidence_revision ?? 0 : 0
    const cutoff = inherited?.affectedPhases.includes(phase) === true
      ? Math.max(scopeCutoff, inherited.targetProgressRevision)
      : scopeCutoff
    let sequence: Array<number> = []
    let best: Array<number> = []
    for (const event of history) {
      if (event.revision <= cutoff || event.phase !== phase || event.head !== head) continue
      if (event.outcome === "clean" || event.outcome === "clean-except-queue") {
        sequence.push(event.revision)
        if (sequence.length > best.length) best = [...sequence]
      } else if (event.outcome !== "started") {
        sequence = []
      }
    }
    const cleanRevisions = new Set(best)
    const direct = rows.filter(review => review.phase === phase && cleanRevisions.has(review.startRevision + 1)).slice(0, requirements.targets[phase])
    if (direct.length === requirements.targets[phase]) {
      eligible.push(...yield* Schema.decodeUnknownEffect(Schema.Array(SourceReview))(direct))
      continue
    }
    const carried = inherited === undefined || inherited.decision === "broad" || inherited.affectedPhases.includes(phase)
      ? []
      : inherited.source.reviews.filter(review => review.phase === phase).slice(0, requirements.targets[phase])
    if (carried.length === requirements.targets[phase]) eligible.push(...carried)
  }
  return eligible
})

const resolveSource = Effect.fn("ReviewCandidate.resolveSource")(function*(run: ReviewRun & { readonly runId: string }, requested?: string) {
  const sql = yield* SqlClient.SqlClient
  const repo = (yield* sql<{ readonly repo_key: string }>`select repo_key from review_runs where id = ${run.runId}`)[0]
  if (repo === undefined) return yield* new CandidateConflict({ message: "Candidate preparation requires a persisted target review run" })
  const candidates = requested === undefined
    ? yield* sql<SourceRunRow>`select review_runs.id, coalesce(review_scope_budgets.status, '') as scope_status,
        coalesce(review_runs.head, '') as head, coalesce(review_scope_budgets.base_oid, '') as base_oid
        from review_runs left join review_scope_budgets on review_scope_budgets.run_id = review_runs.id
        where review_runs.repo_key = ${repo.repo_key} and coalesce(review_runs.branch, '') = ${run.branch}
          and review_runs.target = ${run.target} and (review_runs.id = ${run.runId} or review_scope_budgets.status = 'complete')
        order by case when review_runs.id = ${run.runId} then 0 else 1 end,
          review_runs.update_seq desc, review_runs.updated_at desc`
    : yield* sql<SourceRunRow>`select review_runs.id, coalesce(review_scope_budgets.status, '') as scope_status,
        coalesce(review_runs.head, '') as head, coalesce(review_scope_budgets.base_oid, '') as base_oid
        from review_runs left join review_scope_budgets on review_scope_budgets.run_id = review_runs.id
        where review_runs.id = ${requested} and review_runs.repo_key = ${repo.repo_key}
          and coalesce(review_runs.branch, '') = ${run.branch} and review_runs.target = ${run.target}`
  for (const candidate of candidates) {
    if (candidate.head.length === 0 || candidate.base_oid.length === 0) continue
    const reviews = yield* sourceReviews(candidate.id, candidate.head, candidate.base_oid)
    if (reviews.length > 0) return { runId: candidate.id, head: candidate.head, baseOid: candidate.base_oid, reviews }
    const prior = (yield* sql<{ readonly head: string; readonly base_oid: string }>`select head, base_oid from review_invocations
      where run_id = ${candidate.id} and status = 'finished' and outcome in ('clean', 'clean-except-queue')
      order by start_revision desc limit 1`)[0]
    if (prior !== undefined) {
      const sameIdentity = prior.head === candidate.head && prior.base_oid === candidate.base_oid
      const priorReviews = yield* sourceReviews(candidate.id, prior.head, prior.base_oid, sameIdentity)
      if (priorReviews.length > 0) return { runId: candidate.id, head: prior.head, baseOid: prior.base_oid, reviews: priorReviews }
    }
  }
  return yield* new CandidateConflict({ message: "No earlier completed native or cold review evidence exists for this branch and target" })
})

const decodeCandidate = Effect.fn("ReviewCandidate.decode")(function*(row: CandidateRow) {
  const sourceReviews = yield* Schema.decodeUnknownEffect(SourceReviewsJson)(row.source_reviews_json)
  const affectedPhases = yield* Schema.decodeUnknownEffect(PhasesJson)(row.affected_phases_json)
  const decision = row.decision.length === 0 ? undefined : yield* Schema.decodeUnknownEffect(CandidateDecision)(row.decision)
  return {
    candidateId: row.id,
    runId: row.run_id,
    status: row.status,
    source: {
      runId: row.source_run_id,
      progressRevision: row.source_progress_revision,
      baseOid: row.source_base_oid,
      head: row.source_head_oid,
      tree: row.source_tree_oid,
      patchId: row.source_patch_id,
      reviews: sourceReviews
    },
    candidate: {
      baseOid: row.candidate_base_oid,
      head: row.candidate_head_oid,
      tree: row.candidate_tree_oid,
      patchId: row.candidate_patch_id
    },
    targetProgressRevision: row.target_progress_revision,
    scopeGeneration: row.scope_generation,
    decision,
    affectedPhases,
    semanticImpactEvidence: row.semantic_impact_evidence,
    createdAt: row.created_at,
    assessedAt: row.assessed_at
  }
})

export type ReviewCandidate = Effect.Success<ReturnType<typeof decodeCandidate>>

export const getCandidate = Effect.fn("ReviewCandidate.get")(function*(candidateId: string) {
  const sql = yield* SqlClient.SqlClient
  const rows = yield* sql`select * from review_candidates where id = ${candidateId}`
  const row = (yield* Schema.decodeUnknownEffect(Schema.Array(CandidateRow))(rows))[0]
  if (row === undefined) return yield* new CandidateConflict({ message: "Unknown candidate ID; use the ID returned by review candidate-prepare" })
  return yield* decodeCandidate(row)
})

export const prepareCandidate = Effect.fn("ReviewCandidate.prepare")(function*(
  run: ReviewRun & { readonly runId: string },
  scope: ScopeBudgetStatus,
  requestedSourceRun?: string,
  freshScope = false
) {
  const sql = yield* SqlClient.SqlClient
  const git = yield* trustedExecutable("git", run.repoPath)
  const checkoutHead = yield* requireCleanReviewTree(run.repoPath)
  const candidateHead = scope.pinnedHeadOid || checkoutHead
  const boundBase = yield* checkedTrimmedText(git, ["rev-parse", "--verify", `${scope.baseRef}^{commit}`], { cwd: run.repoPath })
  if (boundBase !== scope.baseOid) return yield* new CandidateConflict({ message: "Candidate base moved after scope setup; authorize or restart scope against the current base before preparing evidence" })
  return yield* sql.withTransaction(Effect.gen(function*() {
    const source = yield* resolveSource(run, requestedSourceRun)
    if (source.reviews.length === 0) return yield* new CandidateConflict({ message: "The selected source run has no completed native or cold invocation evidence" })
    const [sourceIdentity, candidateIdentity] = yield* Effect.all([
      commitIdentity(run.repoPath, source.baseOid, source.head),
      commitIdentity(run.repoPath, scope.baseOid, candidateHead)
    ])
    const sourceRevision = yield* progressRevision(source.runId)
    const targetRevision = source.runId === run.runId ? sourceRevision : yield* progressRevision(run.runId)
    if (freshScope) {
      const sourceLimits = (yield* sql<{ readonly settings: string }>`select settings from review_run_limits where run_id = ${source.runId}`)[0]
      const targetLimits = (yield* sql<{ readonly settings: string }>`select settings from review_run_limits where run_id = ${run.runId}`)[0]
      const defaults = JSON.stringify({ consultCap: 5, coldCleanTarget: 1, nativeCleanTarget: 2, requiredPhases: [], requireCurrentHead: false })
      if (sourceLimits !== undefined && targetLimits?.settings === defaults) {
        yield* sql`update review_run_limits set settings = ${sourceLimits.settings} where run_id = ${run.runId}`
      }
    }
    const candidateId = randomUUID()
    const createdAt = Math.floor(Date.now() / 1000)
    yield* sql`insert into review_candidates (
        id, run_id, source_run_id, source_progress_revision, source_base_oid, source_head_oid, source_tree_oid,
        source_patch_id, source_reviews_json, candidate_base_oid, candidate_head_oid, candidate_tree_oid,
        candidate_patch_id, target_progress_revision, scope_generation, status, decision, affected_phases_json,
        semantic_impact_evidence, created_at, assessed_at
      ) values (
        ${candidateId}, ${run.runId}, ${source.runId}, ${sourceRevision}, ${sourceIdentity.baseOid}, ${sourceIdentity.headOid},
        ${sourceIdentity.treeOid}, ${sourceIdentity.patchId}, ${JSON.stringify(source.reviews)}, ${candidateIdentity.baseOid},
        ${candidateIdentity.headOid}, ${candidateIdentity.treeOid}, ${candidateIdentity.patchId}, ${targetRevision},
        ${scope.generation}, 'prepared', '', '[]', '', ${createdAt}, 0
      )`
    return yield* getCandidate(candidateId)
  }))
})

const phaseCounts = (reviews: ReadonlyArray<SourceReview>): Readonly<Record<CandidatePhase, number>> => ({
  native: reviews.filter((review) => review.phase === "native").length,
  cold: reviews.filter((review) => review.phase === "cold").length
})

const targetRequirements = Effect.fn("ReviewCandidate.targetRequirements")(function*(runId: string) {
  const sql = yield* SqlClient.SqlClient
  const row = (yield* sql<{ readonly settings: string }>`select settings from review_run_limits where run_id = ${runId}`)[0]
  const Settings = Schema.fromJsonString(Schema.Struct({
    nativeCleanTarget: Schema.optionalKey(Schema.Number),
    coldCleanTarget: Schema.optionalKey(Schema.Number),
    requiredPhases: Schema.optionalKey(Schema.Array(CandidatePhase))
  }))
  const settings = row === undefined ? {} : yield* Schema.decodeUnknownEffect(Settings)(row.settings)
  return {
    required: settings.requiredPhases ?? [],
    targets: { native: settings.nativeCleanTarget ?? 2, cold: settings.coldCleanTarget ?? 1 } as const
  }
})

export const assessCandidate = Effect.fn("ReviewCandidate.assess")(function*(input: {
  readonly candidateId: string
  readonly decision: CandidateDecision
  readonly affectedPhases: ReadonlyArray<CandidatePhase>
  readonly semanticImpactEvidence: string
}) {
  if (input.semanticImpactEvidence.trim().length === 0) return yield* new CandidateConflict({ message: "Candidate assessment requires semantic impact evidence" })
  const sql = yield* SqlClient.SqlClient
  return yield* sql.withTransaction(Effect.gen(function*() {
    const candidate = yield* getCandidate(input.candidateId)
    const requestedAffected = [...new Set(input.affectedPhases)]
    if (input.decision === "reuse" && requestedAffected.length > 0) return yield* new CandidateConflict({ message: "A reuse decision cannot name affected phases; choose focused when earlier phase evidence is invalidated" })
    if (input.decision === "broad" && requestedAffected.length > 0) return yield* new CandidateConflict({ message: "A broad decision invalidates every required phase; omit --affected-phase" })
    const requirements = yield* targetRequirements(candidate.runId)
    const counts = phaseCounts(candidate.source.reviews)
    const missing = requirements.required.filter((phase) => counts[phase] < requirements.targets[phase])
    const affected = input.decision === "broad"
      ? requirements.required
      : input.decision === "focused"
      ? [...new Set([...requestedAffected, ...missing])]
      : []
    if (candidate.status === "assessed") {
      const same = candidate.decision === input.decision
        && candidate.semanticImpactEvidence === input.semanticImpactEvidence
        && candidate.affectedPhases.length === affected.length
        && candidate.affectedPhases.every((phase) => affected.includes(phase))
      if (!same) return yield* new CandidateConflict({ message: "The saved candidate assessment is immutable" })
      return candidate
    }
    const scope = (yield* sql<{ readonly generation: number; readonly base_ref: string; readonly base_oid: string; readonly pinned_head_oid: string }>`select generation, base_ref, base_oid, pinned_head_oid from review_scope_budgets where run_id = ${candidate.runId}`)[0]
    const run = (yield* sql<{ readonly repo_path: string }>`select repo_path from review_runs where id = ${candidate.runId}`)[0]
    if (scope === undefined || run === undefined || scope.generation !== candidate.scopeGeneration) return yield* new CandidateConflict({ message: "Candidate scope moved after preparation; prepare the current candidate again" })
    if ((yield* progressRevision(candidate.runId)) !== candidate.targetProgressRevision) return yield* new CandidateConflict({ message: "Target review progress moved after preparation; prepare the current candidate again" })
    if (candidate.source.runId !== candidate.runId && (yield* progressRevision(candidate.source.runId)) !== candidate.source.progressRevision) {
      return yield* new CandidateConflict({ message: "Source review evidence moved after preparation; prepare the candidate again" })
    }
    const git = yield* trustedExecutable("git", run.repo_path)
    const cleanHead = yield* requireCleanReviewTree(run.repo_path)
    const currentBase = yield* checkedTrimmedText(git, ["rev-parse", "--verify", `${scope.base_ref}^{commit}`], { cwd: run.repo_path })
    const currentHead = scope.pinned_head_oid || cleanHead
    const currentIdentity = yield* commitIdentity(run.repo_path, currentBase, currentHead)
    if (scope.base_oid !== candidate.candidate.baseOid || currentIdentity.baseOid !== candidate.candidate.baseOid
      || currentIdentity.headOid !== candidate.candidate.head || currentIdentity.treeOid !== candidate.candidate.tree
      || currentIdentity.patchId !== candidate.candidate.patchId) {
      return yield* new CandidateConflict({ message: "Candidate base, head, tree, or patch moved after preparation; prepare the current candidate again" })
    }
    if (input.decision === "reuse") {
      if (candidate.source.patchId !== candidate.candidate.patchId) return yield* new CandidateConflict({ message: "Whole-candidate reuse requires an equivalent stable patch; choose focused or broad and identify invalidated review phases" })
      if (missing.length > 0) return yield* new CandidateConflict({ message: `Whole-candidate reuse is missing completed source evidence for: ${missing.join(", ")}` })
    }
    if (input.decision === "focused" && affected.length === 0) return yield* new CandidateConflict({ message: "A focused assessment requires at least one affected or missing phase" })
    const assessedAt = Math.floor(Date.now() / 1000)
    const updated = yield* sql`update review_candidates set status = 'assessed', decision = ${input.decision},
      affected_phases_json = ${JSON.stringify(affected)}, semantic_impact_evidence = ${input.semanticImpactEvidence}, assessed_at = ${assessedAt}
      where id = ${input.candidateId} and status = 'prepared' and scope_generation = ${candidate.scopeGeneration}
        and target_progress_revision = ${candidate.targetProgressRevision} returning id`
    if (updated.length === 0) return yield* new CandidateConflict({ message: "Candidate assessment lost its compare-and-swap race; inspect the saved candidate" })
    return yield* getCandidate(input.candidateId)
  }))
})

export const candidateCoverage = Effect.fn("ReviewCandidate.coverage")(function*(runId: string, head: string, baseOid: string) {
  const sql = yield* SqlClient.SqlClient
  const rows = yield* sql`select * from review_candidates where run_id = ${runId} and status = 'assessed'
    and candidate_head_oid = ${head} and candidate_base_oid = ${baseOid} order by assessed_at desc, created_at desc, rowid desc limit 1`
  const row = (yield* Schema.decodeUnknownEffect(Schema.Array(CandidateRow))(rows))[0]
  if (row === undefined) return undefined
  return yield* decodeCandidate(row)
})
