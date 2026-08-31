import * as Console from "effect/Console"
import * as Effect from "effect/Effect"
import * as FileSystem from "effect/FileSystem"
import * as Option from "effect/Option"
import * as Path from "effect/Path"
import * as Schema from "effect/Schema"
import * as SqlClient from "effect/unstable/sql/SqlClient"
import { createHash } from "node:crypto"

import { checkedTrimmedText } from "../../../packages/effect-cli/CheckedProcess.ts"
import { trustedExecutable } from "./NativeReview.ts"
import { changedFileManifest, type ReviewFileIdentity } from "./ReviewFileCoverage.ts"
import { measureScopeDiff, type ScopeMeasurement } from "./ReviewScope.ts"

export interface ReviewRun {
  readonly repo: string
  readonly repoPath: string
  readonly branch: string
  readonly target: string
  readonly base: string
  readonly head: string
  readonly status: string
  readonly decisionLog: string
}

export const REVIEW_FILE_STATES = ["stale", "unreviewed", "reviewed-once", "reviewed-twice"] as const
export type ReviewFileState = (typeof REVIEW_FILE_STATES)[number]

export interface ReviewFileCoverage {
  readonly path: string
  readonly changeId: string
  readonly reviews: number
  readonly state: ReviewFileState
}

export interface ReviewedFilesInput {
  readonly reviewId: string
  readonly reviewer: string
  readonly files: ReadonlyArray<{
    readonly path: string
    readonly changeId: string
  }>
}

export const FINDING_SCHEMA_VERSION = 8
export const FINDING_KINDS = ["runtime", "maintenance"] as const
export const FINDING_STATUSES = ["open", "fixed", "rejected", "deferred", "provisional", "reopened"] as const
export const FINDING_DISPOSITIONS = ["accept", "investigate", "consult", "follow-up", "residual", "reject"] as const
export const FINDING_FIX_SCOPES = ["local", "systemic"] as const
export const FINDING_HANDLINGS = ["fix", "consult", "follow-up", "reject"] as const
export const FINDING_LIKELIHOODS = ["likely", "possible", "rare", "unknown", "theoretical"] as const
export const FINDING_IMPACTS = ["critical", "high", "medium", "low"] as const
export const FINDING_SEVERITIES = ["", "p0", "p1", "p2", "p3"] as const
export const FINDING_AREAS = ["", "ui", "workflow", "api-contract", "permissions", "privacy", "finance", "data-correctness", "audit", "migration", "schema", "internal"] as const
export const FINDING_OWNER_RESOLUTIONS = ["approved", "declined"] as const
export const FINDING_REJECTION_GATES = ["reality", "importance", "contract", "repair", "duplicate"] as const

type FindingLikelihood = (typeof FINDING_LIKELIHOODS)[number]
type FindingImpact = (typeof FINDING_IMPACTS)[number]
type FindingSeverity = (typeof FINDING_SEVERITIES)[number]
type FindingDisposition = (typeof FINDING_DISPOSITIONS)[number]
interface FindingOutcome {
  readonly severity: FindingSeverity
  readonly disposition: FindingDisposition
}

const RUNTIME_OUTCOMES = {
  likely: {
    low: { severity: "p3", disposition: "accept" }, medium: { severity: "p2", disposition: "accept" },
    high: { severity: "p1", disposition: "accept" }, critical: { severity: "p0", disposition: "accept" }
  },
  possible: {
    low: { severity: "", disposition: "reject" }, medium: { severity: "p2", disposition: "accept" },
    high: { severity: "p1", disposition: "accept" }, critical: { severity: "p1", disposition: "accept" }
  },
  rare: {
    low: { severity: "", disposition: "reject" }, medium: { severity: "", disposition: "reject" },
    high: { severity: "p2", disposition: "consult" }, critical: { severity: "p1", disposition: "consult" }
  },
  unknown: {
    low: { severity: "", disposition: "investigate" }, medium: { severity: "", disposition: "investigate" },
    high: { severity: "", disposition: "investigate" }, critical: { severity: "", disposition: "investigate" }
  },
  theoretical: {
    low: { severity: "", disposition: "reject" }, medium: { severity: "", disposition: "reject" },
    high: { severity: "", disposition: "reject" }, critical: { severity: "", disposition: "reject" }
  }
} as const satisfies Readonly<Record<FindingLikelihood, Readonly<Record<FindingImpact, FindingOutcome>>>>

const outcomeLabel = (likelihood: FindingLikelihood, impact: FindingImpact) => {
  const outcome = deriveRuntimeOutcome(likelihood, impact)
  return `${outcome.severity.length === 0 ? "no severity" : outcome.severity.toUpperCase()}/${outcome.disposition}`
}

export const deriveRuntimeOutcome = (likelihood: FindingLikelihood, impact: FindingImpact): FindingOutcome => RUNTIME_OUTCOMES[likelihood][impact]

const FindingRecord = Schema.Struct({
  decisionId: Schema.String,
  status: Schema.Literals(FINDING_STATUSES),
  source: Schema.String,
  fingerprint: Schema.String,
  summary: Schema.String,
  area: Schema.Literals(FINDING_AREAS),
  material: Schema.Boolean,
  userImpact: Schema.String,
  decision: Schema.String,
  text: Schema.String,
  findingKind: Schema.Literals(FINDING_KINDS),
  productionPath: Schema.String,
  reachabilityEvidence: Schema.String,
  likelihood: Schema.Union([Schema.Literals(FINDING_LIKELIHOODS), Schema.Literal("")]),
  impact: Schema.Union([Schema.Literals(FINDING_IMPACTS), Schema.Literal("")]),
  actualConsequence: Schema.String,
  maintenanceEvidence: Schema.String,
  presentCost: Schema.String,
  contractEvidence: Schema.String,
  rootCause: Schema.String,
  recommendedFix: Schema.String,
  interventionJustification: Schema.String,
  rejectionGate: Schema.Union([Schema.Literals(FINDING_REJECTION_GATES), Schema.Literal("")]),
  fixScope: Schema.Literals(FINDING_FIX_SCOPES),
  handling: Schema.Literals(FINDING_HANDLINGS),
  ownerResolution: Schema.Union([Schema.Literals(FINDING_OWNER_RESOLUTIONS), Schema.Literal("")])
})

export interface FindingInput {
  readonly decisionId: string
  readonly status: string
  readonly source: string
  readonly fingerprint: string
  readonly summary: string
  readonly area: string
  readonly material: boolean
  readonly userImpact: string
  readonly decision: string
  readonly text: string
  readonly findingKind: string
  readonly productionPath: string
  readonly reachabilityEvidence: string
  readonly likelihood: string
  readonly impact: string
  readonly actualConsequence: string
  readonly maintenanceEvidence: string
  readonly presentCost: string
  readonly contractEvidence: string
  readonly rootCause: string
  readonly recommendedFix: string
  readonly interventionJustification: string
  readonly rejectionGate: string
  readonly fixScope: string
  readonly handling: string
  readonly ownerResolution: string
}

export type Finding = typeof FindingRecord.Type & FindingOutcome

export class InvalidFinding extends Error {
  readonly _tag = "InvalidFinding"
  constructor(message: string) {
    super(`invalid finding: ${message}; run review-findings schema for the current record contract`)
  }
}

export const formatFindingSchema = () => `review-findings record schema v${FINDING_SCHEMA_VERSION}

Required for every finding:
  --repo <name> --repo-path <root> --target <PR or range>
  --finding-kind ${FINDING_KINDS.join("|")}
  --status ${FINDING_STATUSES.join("|")}
  --fix-scope ${FINDING_FIX_SCOPES.join("|")}
  --handling ${FINDING_HANDLINGS.join("|")}
  --decision-id, --source, --fingerprint, --summary

Optional finding metadata:
  --branch, --base, --head, --run-status, --decision-log
  Omitted --branch or --base reuses one matching repo-and-target run; ambiguous omissions are rejected.
  --area ${FINDING_AREAS.filter(Boolean).join("|")} --material
  --user-impact, --decision, --text
  --owner-resolution ${FINDING_OWNER_RESOLUTIONS.join("|")} for an explicit terminal decision about the finding

Required for every actionable finding:
  --root-cause <underlying cause and owning boundary>
  --intervention-justification <why intervention beats doing nothing after full repair cost>

Additionally required before patching or deferring:
  --recommended-fix <smallest durable repair at the owning boundary>

Required for every unresolved consultation:
  --decision <owner question; when repairless, alternatives checked and why no recommendation is justified>
  The consultation is actionable as an owner decision, not as permission to patch.

Additionally required for actionable runtime findings:
  --contract-evidence <current contract and evidence that the behavior violates it>

Required for rejected candidates without an owner resolution:
  --rejection-gate ${FINDING_REJECTION_GATES.join("|")}

Required for runtime findings:
  --likelihood ${FINDING_LIKELIHOODS.join("|")}
  --impact ${FINDING_IMPACTS.join("|")}

Required when likelihood is likely, possible, or rare:
  --production-path <current producer -> transformations -> failing sink>
  --reachability-evidence <observed payload, current contract, or repository invariant>
  --actual-consequence <verified behavior and meaningful user/system impact>

Required when likelihood is unknown or theoretical:
  --decision <investigation or rejection rationale>; runtime proof fields may be incomplete

Required for supported maintenance findings:
  --maintenance-evidence <repository evidence of unnecessary complexity, duplication, or code with no current job>
  --present-cost <current reading, change, test, or ownership cost>

Required when rejecting an unsupported maintenance candidate:
  --decision <rejection rationale>; omit both maintenance evidence fields

Required when deferring accepted local risk:
  --decision <why the residual risk is accepted>

CLI-derived severity/disposition matrix:
  likely:      low=${outcomeLabel("likely", "low")}; medium=${outcomeLabel("likely", "medium")}; high=${outcomeLabel("likely", "high")}; critical=${outcomeLabel("likely", "critical")}
  possible:    low=${outcomeLabel("possible", "low")}; medium=${outcomeLabel("possible", "medium")}; high=${outcomeLabel("possible", "high")}; critical=${outcomeLabel("possible", "critical")}
  rare:        low=${outcomeLabel("rare", "low")}; medium=${outcomeLabel("rare", "medium")}; high=${outcomeLabel("rare", "high")}; critical=${outcomeLabel("rare", "critical")}
  unknown:     all=no severity/investigate
  theoretical: all=no severity/reject

Consistency rules:
  accept -> open|fixed|provisional|reopened
  accepted local + deferred -> residual
  investigate -> open|reopened and no patch
  consult -> open|reopened, no autonomous patch
  follow-up -> deferred, nonblocking, and requires decision text
  residual -> deferred with required decision text and no patch
  deferred legacy record without disposition -> unresolved until re-recorded
  reject -> rejected and no patch
  accept|follow-up|residual and approved consult -> required repair fields
  unresolved or declined consult -> may omit recommended fix with decision rationale
  rejected or investigating candidate -> omit repair fields
  rejected candidate -> required rejection gate and decision rationale
  handling consult -> consult when the risk matrix does not reject or investigate
  handling follow-up -> follow-up when the risk matrix does not reject or investigate
  handling reject -> reject a candidate that fails an actionability gate; requires rejection gate and decision text
  systemic + handling fix -> accepted only after the review guardrail classifies the durable repair as contained
  owner approved + decision text -> fixed accepted/consulted finding
  owner declined + decision text -> rejected accepted/consulted finding
  owner declined + decision text -> deferred consulted finding
  declined provisional repair + decision text -> reopened accepted finding; omit owner resolution because the finding remains open
  current-evidence owner-resolved record -> terminal and immutable; exact replay is a no-op even after scope completion
  active legacy evidence -> remains open until re-recorded; completed history stays terminal and is labelled legacy
  supported maintenance -> both evidence fields derive accept, consult, follow-up, or residual
  rejected unsupported maintenance candidate -> no evidence fields and required decision derive reject
  runtime -> omit both maintenance evidence fields

Do not pass --priority or --disposition. The CLI derives both. --handling says whether proven work belongs in this fix, an owner consultation, a nonblocking follow-up, or rejection at a named actionability gate; it never raises a rejected or unproven risk.
--area names the affected part of the product. --impact says how bad the consequence is.`

export interface RecordedCommand {
  readonly command: string
  readonly result: string
  readonly reason: string
  readonly decisionId: string
}

interface RunRow { readonly id: string }
interface CloseoutRunRow extends RunRow { readonly status: string }
interface RunIdentityRow extends RunRow { readonly branch: string; readonly base: string }
interface IdRow { readonly id: string }
interface ExistingIssueRow extends CloseoutFindingRow { readonly id: string; readonly text: string }
interface SequenceRow { readonly sequence: number }
interface TableInfoRow { readonly name: string }
interface RepoKeyRow { readonly id: string; readonly repo_path: string; readonly repo_key: string }
export interface CloseoutFinding {
  readonly decision_id: string
  readonly status: string
  readonly source: string
  readonly summary: string
  readonly area: string
  readonly severity: string
  readonly material: boolean
  readonly user_impact: string
  readonly decision: string
  readonly fingerprint: string
  readonly finding_kind: string
  readonly production_path: string
  readonly reachability_evidence: string
  readonly likelihood: string
  readonly impact: string
  readonly actual_consequence: string
  readonly maintenance_evidence: string
  readonly present_cost: string
  readonly contract_evidence: string
  readonly root_cause: string
  readonly recommended_fix: string
  readonly intervention_justification: string
  readonly rejection_gate: string
  readonly disposition: string
  readonly fix_scope: string
  readonly handling: string
  readonly owner_resolution: string
  readonly evidence_version: number
}
interface CloseoutFindingRow extends Omit<CloseoutFinding, "material"> { readonly material: number }

const isExactResolvedReplay = (existing: ExistingIssueRow, finding: Finding, material: boolean, text: string) => {
  const stored: ReadonlyArray<string | number> = [
    existing.status, existing.source, existing.fingerprint, existing.summary,
    existing.area, existing.severity, existing.material, existing.user_impact,
    existing.decision, existing.text, existing.finding_kind,
    existing.production_path, existing.reachability_evidence, existing.likelihood,
    existing.impact, existing.actual_consequence, existing.maintenance_evidence,
    existing.present_cost, existing.contract_evidence, existing.root_cause,
    existing.recommended_fix, existing.intervention_justification,
    existing.rejection_gate, existing.disposition, existing.fix_scope,
    existing.handling, existing.owner_resolution
  ]
  const replay: ReadonlyArray<string | number> = [
    finding.status, finding.source, finding.fingerprint, finding.summary,
    finding.area, finding.severity, material ? 1 : 0, finding.userImpact,
    finding.decision, text, finding.findingKind, finding.productionPath,
    finding.reachabilityEvidence, finding.likelihood, finding.impact,
    finding.actualConsequence, finding.maintenanceEvidence, finding.presentCost,
    finding.contractEvidence, finding.rootCause, finding.recommendedFix,
    finding.interventionJustification, finding.rejectionGate,
    finding.disposition, finding.fixScope, finding.handling, finding.ownerResolution
  ]
  return stored.every((value, index) => value === replay[index])
}
const isLegacyEvidenceUpgrade = (existing: ExistingIssueRow, finding: Finding) => hasLegacyEvidence(existing) &&
  existing.status === finding.status && existing.source === finding.source && existing.fingerprint === finding.fingerprint &&
  existing.decision === finding.decision && (existing.disposition.length === 0 || existing.disposition === finding.disposition) &&
  (existing.fix_scope.length === 0 || existing.fix_scope === finding.fixScope) &&
  (existing.handling.length === 0 || existing.handling === finding.handling) && existing.owner_resolution === finding.ownerResolution
interface CommandRow {
  readonly command: string
  readonly result: string
  readonly reason: string
  readonly decision_id: string
}
export interface QueryResult {
  readonly id: string
  readonly decision_id: string
  readonly status: string
  readonly source: string
  readonly fingerprint: string
  readonly summary: string
  readonly decision: string
  readonly repo: string
  readonly branch: string
  readonly target: string
  readonly head: string
  readonly score: number
  readonly semantic_score: number
  readonly lexical_score: number
  readonly last_seen_at: number
  readonly seen_count: number
  readonly decision_log_path: string
}
interface QueryRow extends Omit<QueryResult, "score" | "semantic_score" | "lexical_score"> {
  readonly text: string
  readonly updated_at: number
}
interface IssueIdRow {
  readonly id: string
  readonly status: string
  readonly disposition: string
  readonly owner_resolution: string
}
interface ScopeBudgetRow {
  readonly run_id: string
  readonly generation: number
  readonly line_metric: string
  readonly base_ref: string
  readonly base_oid: string
  readonly pinned_head_oid: string
  readonly limit_percent: number
  readonly scope_summary: string
  readonly authorization: string
  readonly baseline_production_lines: number
  readonly baseline_test_lines: number
  readonly baseline_generated_lines: number
  readonly baseline_paths_json: string
  readonly baseline_binary_paths_json: string
  readonly status: string
  readonly current_production_lines: number
  readonly current_test_lines: number
  readonly current_generated_lines: number
  readonly growth_lines: number
  readonly allowed_growth_lines: number
  readonly new_production_paths_json: string
  readonly new_binary_production_paths_json: string
  readonly last_reason: string
}
interface FixedFindingRow { readonly decision_id: string; readonly summary: string }
interface UnresolvedFindingRow {
  readonly decision_id: string
  readonly status: string
  readonly summary: string
  readonly disposition: string
  readonly owner_resolution: string
  readonly evidence_version: number
}
interface ActiveScopeRow { readonly run_id: string; readonly target: string }
interface ScopeStatusRow { readonly status: string }
interface ReviewFileAttestationRow {
  readonly review_id: string
  readonly reviewer: string
  readonly path: string
  readonly change_id: string
}

const isFindingTerminal = (finding: Pick<CloseoutFinding, "status" | "disposition" | "owner_resolution">) => {
  if (finding.status === "fixed" || finding.status === "rejected") return true
  if (finding.status !== "deferred") return false
  if (finding.disposition === "residual" || finding.disposition === "follow-up") return true
  return finding.disposition === "consult" && finding.owner_resolution.length > 0
}

const hasLegacyEvidence = (finding: Pick<CloseoutFinding, "evidence_version">) => finding.evidence_version < FINDING_SCHEMA_VERSION

const isDeferredWork = (finding: Pick<CloseoutFinding, "status" | "disposition" | "owner_resolution">) =>
  finding.status === "deferred" && (finding.disposition === "follow-up" || (finding.disposition === "consult" && finding.owner_resolution.length > 0))

export interface ScopeBudgetStatus {
  readonly runId: string
  readonly generation: number
  readonly lineMetric: ScopeLineMetric
  readonly baseRef: string
  readonly baseOid: string
  readonly pinnedHeadOid: string
  readonly limitPercent: number
  readonly scopeSummary: string
  readonly authorization: string
  readonly baselineProductionLines: number
  readonly baselineTestLines: number
  readonly baselineGeneratedLines: number
  readonly baselinePaths: ReadonlyArray<string>
  readonly baselineBinaryPaths: ReadonlyArray<string>
  readonly status: string
  readonly currentProductionLines: number
  readonly currentTestLines: number
  readonly currentGeneratedLines: number
  readonly growthLines: number
  readonly allowedGrowthLines: number
  readonly newProductionPaths: ReadonlyArray<string>
  readonly newBinaryProductionPaths: ReadonlyArray<string>
  readonly lastReason: string
}

export interface ScopeBudgetCheck extends ScopeBudgetStatus {
  readonly maximumLines: number
  readonly completedFindings: ReadonlyArray<FixedFindingRow>
  readonly blocked: boolean
}

export const DEFAULT_SCOPE_GROWTH_PERCENT = 30
const PRODUCTION_ONLY_LINE_METRIC = "production-only"
export const TOTAL_LOC_LINE_METRIC = "total-human-authored"
const ScopeLineMetric = Schema.Literals([PRODUCTION_ONLY_LINE_METRIC, TOTAL_LOC_LINE_METRIC])
type ScopeLineMetric = typeof ScopeLineMetric.Type

const humanAuthoredLines = (productionLines: number, testLines: number): number => productionLines + testLines

export const allowedScopeGrowth = (baselineLines: number, limitPercent: number): number =>
  Math.floor(baselineLines * limitPercent / 100)

export class MissingScopeBudget extends Error {
  readonly _tag = "MissingScopeBudget"
  constructor() {
    super("scope budget is missing; stop reviewing and run scope-start before applying any review fix")
  }
}

export class ScopeBudgetAlreadyStarted extends Error {
  readonly _tag = "ScopeBudgetAlreadyStarted"
  constructor() {
    super("scope budget already exists; use scope-check or scope-status, and use scope-authorize only after explicit user approval")
  }
}

export class ActiveScopeBudgetExists extends Error {
  readonly _tag = "ActiveScopeBudgetExists"
  constructor(target: string) {
    super(`active scope budget already exists for this repository and branch (target: ${target}); use its persisted identity or complete it before starting another review`)
  }
}

export class InvalidScopeBudget extends Error {
  readonly _tag = "InvalidScopeBudget"
  constructor(message: string) { super(message) }
}

export class InvalidReviewCoverage extends Error {
  readonly _tag = "InvalidReviewCoverage"
  constructor(message: string) { super(message) }
}

export class ScopeBudgetBlocked extends Error {
  readonly _tag = "ScopeBudgetBlocked"
  readonly check: ScopeBudgetCheck
  constructor(check: ScopeBudgetCheck) {
    super(formatBlockedScopeBudget(check))
    this.check = check
  }
}

export interface Closeout {
  readonly review_candidates: ReadonlyArray<CloseoutFinding>
  readonly material_findings: ReadonlyArray<CloseoutFinding>
  readonly user_visible_or_workflow_changes: ReadonlyArray<CloseoutFinding>
  readonly security_data_permission_changes: ReadonlyArray<CloseoutFinding>
  readonly lower_risk_findings: ReadonlyArray<CloseoutFinding>
  readonly findings_found: ReadonlyArray<CloseoutFinding>
  readonly changes_made_while_reviewing: ReadonlyArray<CloseoutFinding>
  readonly verification_run: ReadonlyArray<CommandRow>
  readonly deferred_work: ReadonlyArray<CloseoutFinding>
  readonly still_open: ReadonlyArray<CloseoutFinding>
  readonly scope_budget?: ScopeBudgetStatus
}

export interface CloseoutCount {
  readonly label: string
  readonly count: number
}

export interface CloseoutSummary {
  readonly total_findings: number
  readonly material_findings: number
  readonly lower_risk_findings: number
  readonly status_counts: ReadonlyArray<CloseoutCount>
  readonly source_counts: ReadonlyArray<CloseoutCount>
  readonly source_disposition_counts: ReadonlyArray<CloseoutCount>
  readonly rejection_gate_counts: ReadonlyArray<CloseoutCount>
  readonly area_counts: ReadonlyArray<CloseoutCount>
  readonly severity_counts: ReadonlyArray<CloseoutCount>
  readonly important_findings: ReadonlyArray<CloseoutFinding>
  readonly important_findings_total: number
  readonly accepted_residual_risk: ReadonlyArray<CloseoutFinding>
  readonly accepted_residual_risk_total: number
  readonly deferred_work: ReadonlyArray<CloseoutFinding>
  readonly deferred_work_total: number
  readonly still_open: ReadonlyArray<CloseoutFinding>
  readonly still_open_total: number
  readonly verification_counts: ReadonlyArray<CloseoutCount>
  readonly verification_total: number
  readonly scope_budget?: ScopeBudgetStatus
}

const nowSeconds = () => Math.floor(Date.now() / 1_000)
const stableId = (parts: ReadonlyArray<string>) => createHash("sha256").update(parts.map((part) => `${part}\0`).join("")).digest("hex").slice(0, 32)
const normalizeToken = (value: string) => value.trim().toLowerCase().replaceAll("_", "-")
const normalizeStatus = (value: string) => {
  const status = normalizeToken(value)
  return status === "adopted" ? "fixed" : status === "scoped" ? "deferred" : status
}
const synonyms: Readonly<Record<string, ReadonlyArray<string>>> = {
  auth: ["authorization", "permission", "access", "login"], authorization: ["auth", "permission", "access"],
  block: ["prevent", "deny", "stop"], broken: ["bug", "failure", "regression"], crash: ["exception", "failure", "panic"],
  double: ["duplicate", "duplicated", "twice", "two", "repeated", "multiple"], duplicate: ["double", "duplicated", "twice", "repeated", "multiple"],
  invoice: ["billing", "payment", "charge"], leak: ["expose", "disclose", "access"], payment: ["refund", "invoice", "billing", "charge", "provider"],
  permission: ["auth", "authorization", "access"], refund: ["reversal", "reimbursement", "payment", "provider"], reversal: ["refund", "reimbursement", "payment"],
  tenant: ["workspace", "customer", "organization", "org"]
}
const tokenize = (text: string) => [...text.toLowerCase().matchAll(/[a-z0-9][a-z0-9_.:/#-]*/gu)].flatMap(([raw]) => {
  const token = raw.replace(/^[._:/#-]+|[._:/#-]+$/gu, "")
  if (token.length === 0) return []
  return [token, ...(synonyms[token] ?? []), ...(token.length > 4 && token.endsWith("s") ? [token.slice(0, -1)] : []), ...(token.length > 5 && token.endsWith("ed") ? [token.slice(0, -2)] : []), ...(token.length > 6 && token.endsWith("ing") ? [token.slice(0, -3)] : [])]
})
type SparseVector = ReadonlyArray<readonly [number, number]>
const vectorize = (text: string): SparseVector => {
  const weights = new Map<number, number>()
  const add = (feature: string, amount: number) => {
    const digest = createHash("sha256").update(feature).digest()
    const index = Number(digest.readBigUInt64BE(0) % 384n)
    weights.set(index, (weights.get(index) ?? 0) + amount * ((digest[8] ?? 0) % 2 === 1 ? 1 : -1))
  }
  for (const token of tokenize(text)) {
    add(token, 1)
    const chars = Array.from(`  ${token} `)
    for (let index = 0; index <= chars.length - 3; index += 1) add(`tri:${chars.slice(index, index + 3).join("")}`, 0.35)
  }
  const length = Math.sqrt([...weights.values()].reduce((sum, value) => sum + value * value, 0))
  return length === 0 ? [] : [...weights].map(([index, value]) => [index, value / length] as const).sort(([left], [right]) => left - right)
}
const dot = (left: SparseVector, right: SparseVector) => {
  const values = new Map(right)
  return left.reduce((score, [index, value]) => score + value * (values.get(index) ?? 0), 0)
}
const round6 = (value: number) => Math.round(value * 1_000_000) / 1_000_000
const userVisibleAreas = new Set(["ui", "ux", "workflow", "user-workflow", "behavior", "route-behavior", "api-contract", "contract", "product"])
const sensitiveAreas = new Set(["permission", "permissions", "auth", "authorization", "privacy", "security", "finance", "billing", "payroll", "data", "data-correctness", "audit", "history", "migration", "schema"])
const materialSeverities = new Set(["p0", "p1", "critical", "high"])
const isUserVisible = (area: string) => userVisibleAreas.has(normalizeToken(area))
const isSensitive = (area: string) => sensitiveAreas.has(normalizeToken(area))
const isMaterial = (finding: Pick<CloseoutFinding, "material" | "area" | "severity">) => finding.material || isUserVisible(finding.area) || isSensitive(finding.area) || materialSeverities.has(normalizeToken(finding.severity))

export const canonicalRepoKey = Effect.fn("ReviewFindings.canonicalRepoKey")(function*(repoPath: string) {
  const fs = yield* FileSystem.FileSystem
  const paths = yield* Path.Path
  const resolved = paths.resolve(repoPath)
  const info = yield* fs.stat(resolved).pipe(Effect.option)
  const cwd = info._tag === "Some" && info.value.type === "Directory" ? resolved : paths.dirname(resolved)
  const git = yield* trustedExecutable("git", cwd)
  const commonDir = yield* checkedTrimmedText(git, ["rev-parse", "--path-format=absolute", "--git-common-dir"], { cwd }).pipe(Effect.option)
  const key = commonDir._tag === "Some" ? commonDir.value : cwd
  return yield* fs.realPath(key).pipe(Effect.catch(() => Effect.succeed(paths.resolve(key))))
})

export const initialize = Effect.fn("ReviewFindings.initialize")(function*() {
  const sql = yield* SqlClient.SqlClient
  return yield* sql.withTransaction(Effect.gen(function*() {
  const tables = [
    `create table if not exists review_runs (id text primary key, repo_name text not null, repo_key text not null, repo_path text not null, branch text, target text not null, base text, head text, status text not null, decision_log_path text, started_at integer, update_seq integer not null default 0, updated_at integer not null)`,
    `create table if not exists issues (id text primary key, run_id text not null references review_runs(id) on delete cascade, decision_id text not null, status text not null, source text not null, fingerprint text not null, summary text not null, impact text, priority text, material integer not null default 0, user_impact text, decision text, text text not null, finding_kind text not null default '', production_path text not null default '', reachability_evidence text not null default '', likelihood text not null default '', risk_impact text not null default '', actual_consequence text not null default '', maintenance_evidence text not null default '', present_cost text not null default '', contract_evidence text not null default '', root_cause text not null default '', recommended_fix text not null default '', intervention_justification text not null default '', rejection_gate text not null default '', disposition text not null default '', fix_scope text not null default '', handling text not null default '', owner_resolution text not null default '', evidence_version integer not null default ${FINDING_SCHEMA_VERSION}, decision_log_path text, first_seen_at integer, last_seen_at integer, seen_count integer not null default 1, updated_at integer not null, unique(run_id, decision_id))`,
    `create table if not exists commands (id text primary key, run_id text not null references review_runs(id) on delete cascade, command text not null, result text not null, reason text not null, decision_id text, updated_at integer not null)`,
    `create table if not exists review_scope_budgets (run_id text primary key references review_runs(id) on delete cascade, generation integer not null default 0, line_metric text not null default 'total-human-authored', base_ref text not null, base_oid text not null, pinned_head_oid text not null default '', limit_percent integer not null, scope_summary text not null, authorization text not null default '', baseline_production_lines integer not null, baseline_test_lines integer not null, baseline_generated_lines integer not null, baseline_paths_json text not null, baseline_binary_paths_json text not null default '[]', status text not null, current_production_lines integer not null, current_test_lines integer not null, current_generated_lines integer not null, growth_lines integer not null, allowed_growth_lines integer not null, new_production_paths_json text not null, new_binary_production_paths_json text not null default '[]', last_reason text not null default '', started_at integer not null, updated_at integer not null)`,
    `create table if not exists review_scope_locks (repo_key text not null, branch text not null, run_id text not null references review_runs(id) on delete cascade, primary key(repo_key, branch), unique(run_id))`,
    `create table if not exists review_scope_events (id integer primary key autoincrement, run_id text not null references review_runs(id) on delete cascade, event text not null, line_metric text not null default 'total-human-authored', baseline_production_lines integer not null, baseline_test_lines integer not null default 0, current_production_lines integer not null, current_test_lines integer not null default 0, allowed_growth_lines integer not null, new_production_paths_json text not null, reason text not null, scope_summary text not null, authorization text not null, created_at integer not null)`,
    `create table if not exists review_file_attestations (id text primary key, run_id text not null references review_runs(id) on delete cascade, review_id text not null, reviewer text not null, path text not null, change_id text not null, reviewed_at integer not null, unique(run_id, review_id, path))`
  ]
  yield* Effect.forEach(tables, (statement) => sql.unsafe(statement), { discard: true })
  const columns = [
    ["review_runs", "repo_key", "text"], ["review_runs", "branch", "text"], ["review_runs", "update_seq", "integer not null default 0"],
    ["issues", "first_seen_at", "integer"], ["issues", "last_seen_at", "integer"], ["issues", "seen_count", "integer not null default 1"],
    ["issues", "impact", "text"], ["issues", "priority", "text"], ["issues", "material", "integer not null default 0"], ["issues", "user_impact", "text"],
    ["issues", "finding_kind", "text not null default ''"], ["issues", "production_path", "text not null default ''"],
    ["issues", "reachability_evidence", "text not null default ''"], ["issues", "likelihood", "text not null default ''"],
    ["issues", "risk_impact", "text not null default ''"], ["issues", "actual_consequence", "text not null default ''"],
    ["issues", "current_job_evidence", "text not null default ''"], ["issues", "maintenance_evidence", "text not null default ''"], ["issues", "present_cost", "text not null default ''"],
    ["issues", "contract_evidence", "text not null default ''"], ["issues", "root_cause", "text not null default ''"],
    ["issues", "recommended_fix", "text not null default ''"], ["issues", "intervention_justification", "text not null default ''"],
    ["issues", "rejection_gate", "text not null default ''"],
    ["issues", "disposition", "text not null default ''"], ["issues", "fix_scope", "text not null default ''"], ["issues", "handling", "text not null default ''"],
    ["issues", "owner_resolution", "text not null default ''"],
    ["issues", "evidence_version", "integer not null default 7"],
    ["review_scope_budgets", "generation", "integer not null default 0"], ["review_scope_budgets", "line_metric", "text not null default 'production-only'"],
    ["review_scope_budgets", "pinned_head_oid", "text not null default ''"], ["review_scope_budgets", "baseline_binary_paths_json", "text not null default '[]'"],
    ["review_scope_budgets", "new_binary_production_paths_json", "text not null default '[]'"],
    ["review_scope_events", "line_metric", "text not null default 'production-only'"], ["review_scope_events", "baseline_test_lines", "integer not null default 0"],
    ["review_scope_events", "current_test_lines", "integer not null default 0"]
  ] as const
  let addedMaintenanceEvidence = false
  for (const [table, column, definition] of columns) {
    const existing = yield* sql.unsafe<TableInfoRow>(`pragma table_info(${table})`)
    if (!existing.some((row) => row.name === column)) {
      yield* sql.unsafe(`alter table ${table} add column ${column} ${definition}`)
      if (table === "issues" && column === "maintenance_evidence") addedMaintenanceEvidence = true
      if (table === "review_scope_budgets" && column === "line_metric") yield* sql.unsafe(`update review_scope_budgets
        set status = 'rebaseline-required',
            last_reason = 'Scope growth now uses total human-authored LOC; explicit rebaseline is required.' ||
              case when trim(coalesce(last_reason, '')) = '' then '' else ' Previous state: ' || last_reason end
        where status != 'complete'`)
      if (column === "baseline_binary_paths_json") yield* sql.unsafe(`update review_scope_budgets
        set status = 'rebaseline-required',
            last_reason = 'Binary baseline data was unavailable after upgrade; explicit rebaseline is required.' ||
              case when trim(coalesce(last_reason, '')) = '' then '' else ' Previous state: ' || last_reason end
        where status != 'complete'`)
    }
  }
  if (addedMaintenanceEvidence) {
    yield* sql.unsafe(`update issues set maintenance_evidence = current_job_evidence where coalesce(maintenance_evidence, '') = '' and coalesce(current_job_evidence, '') != ''`)
  }
  yield* sql.unsafe(`update issues set handling = case when disposition = 'consult' then 'consult' when disposition = 'follow-up' then 'follow-up' else 'fix' end where coalesce(handling, '') = ''`)
  const timestamp = nowSeconds()
  yield* sql.unsafe(`update issues set first_seen_at = coalesce(first_seen_at, updated_at, ?), last_seen_at = coalesce(last_seen_at, updated_at, ?), seen_count = coalesce(seen_count, 1)`, [timestamp, timestamp])
  yield* sql.unsafe(`update review_runs set repo_key = case when coalesce(repo_path, '') != '' then repo_path else repo_name end where coalesce(repo_key, '') = ''`)
  const repositories = yield* sql.unsafe<RepoKeyRow>(`select id, repo_path, repo_key from review_runs where repo_key = repo_path`)
  yield* Effect.forEach(repositories, (repository) => Effect.gen(function*() {
    const repoKey = yield* canonicalRepoKey(repository.repo_path)
    if (repoKey !== repository.repo_key) yield* sql`update review_runs set repo_key = ${repoKey} where id = ${repository.id}`
  }), { discard: true })
  yield* sql.unsafe(`update review_runs set update_seq = rowid where coalesce(update_seq, 0) = 0`)
  yield* sql.unsafe(`delete from review_scope_locks where run_id not in (select run_id from review_scope_budgets where status != 'complete')`)
  yield* sql.unsafe(`insert or ignore into review_scope_locks (repo_key, branch, run_id)
    select review_runs.repo_key, coalesce(review_runs.branch, ''), review_runs.id
    from review_runs join review_scope_budgets on review_scope_budgets.run_id = review_runs.id
    where review_scope_budgets.status != 'complete'
    order by review_scope_budgets.updated_at desc`)
  const indexes = [
    `create index if not exists review_runs_repo_idx on review_runs(repo_name)`,
    `create index if not exists review_runs_repo_key_idx on review_runs(repo_key)`,
    `create index if not exists review_runs_branch_idx on review_runs(branch)`,
    `create index if not exists issues_run_idx on issues(run_id)`,
    `create index if not exists issues_status_idx on issues(status)`,
    `create index if not exists commands_run_idx on commands(run_id)`,
    `create index if not exists review_scope_events_run_idx on review_scope_events(run_id)`,
    `create index if not exists review_file_attestations_run_path_idx on review_file_attestations(run_id, path, change_id)`
  ]
  yield* Effect.forEach(indexes, (statement) => sql.unsafe(statement), { discard: true })
  }))
})

const nextSequence = Effect.fn("ReviewFindings.nextSequence")(function*() {
  const sql = yield* SqlClient.SqlClient
  const rows = yield* sql<SequenceRow>`select coalesce(max(update_seq), 0) + 1 as sequence from review_runs`
  return rows[0]?.sequence ?? 1
})

const persistRun = Effect.fn("ReviewFindings.persistRun")(function*(run: ReviewRun, runId: string, updateSequence: number) {
  const sql = yield* SqlClient.SqlClient
  const repoKey = yield* canonicalRepoKey(run.repoPath)
  const timestamp = nowSeconds()
  yield* sql`
    insert into review_runs (id, repo_name, repo_key, repo_path, branch, target, base, head, status, decision_log_path, started_at, update_seq, updated_at)
    values (${runId}, ${run.repo}, ${repoKey}, ${run.repoPath}, ${run.branch}, ${run.target}, ${run.base}, ${run.head}, ${run.status}, ${run.decisionLog}, ${timestamp}, ${updateSequence}, ${timestamp})
    on conflict(id) do update set
      repo_name=excluded.repo_name, repo_key=excluded.repo_key, repo_path=excluded.repo_path,
      branch=excluded.branch, target=excluded.target, base=excluded.base,
      head=case when excluded.head != '' then excluded.head else review_runs.head end,
      status=excluded.status,
      decision_log_path=case when excluded.decision_log_path != '' then excluded.decision_log_path else review_runs.decision_log_path end,
      update_seq=excluded.update_seq, updated_at=excluded.updated_at`
  return runId
})

const upsertRun = Effect.fn("ReviewFindings.upsertRun")(function*(run: ReviewRun) {
  const sql = yield* SqlClient.SqlClient
  const repoKey = yield* canonicalRepoKey(run.repoPath)
  const matching = yield* sql.unsafe<RunRow>(
    "select review_runs.id from review_runs where review_runs.repo_key = ? and coalesce(review_runs.branch, '') = ? and review_runs.target = ? and coalesce(review_runs.base, '') = ? order by review_runs.update_seq desc limit 1",
    [repoKey, run.branch, run.target, run.base]
  )
  const updateSequence = yield* nextSequence()
  const runId = matching[0]?.id ?? stableId([repoKey, run.branch, run.target, run.base])
  return yield* persistRun(run, runId, updateSequence)
})

const createScopeRun = Effect.fn("ReviewFindings.createScopeRun")(function*(run: ReviewRun) {
  const repoKey = yield* canonicalRepoKey(run.repoPath)
  const updateSequence = yield* nextSequence()
  return yield* persistRun(run, stableId([repoKey, run.branch, run.target, run.base, String(updateSequence)]), updateSequence)
})

const latestRun = Effect.fn("ReviewFindings.latestRun")(function*(run: Pick<ReviewRun, "repoPath" | "branch" | "target">) {
  const sql = yield* SqlClient.SqlClient
  const repoKey = yield* canonicalRepoKey(run.repoPath)
  const rows = yield* sql<RunRow>`select id from review_runs where repo_key = ${repoKey} and coalesce(branch, '') = ${run.branch} and target = ${run.target} order by update_seq desc, updated_at desc, rowid desc limit 1`
  return rows[0]?.id
})

const touchRun = Effect.fn("ReviewFindings.touchRun")(function*(runId: string, run: Pick<ReviewRun, "repoPath" | "head">) {
  const sql = yield* SqlClient.SqlClient
  const repoKey = yield* canonicalRepoKey(run.repoPath)
  const updateSequence = yield* nextSequence()
  yield* sql`update review_runs set repo_key = ${repoKey}, repo_path = ${run.repoPath}, head = case when ${run.head} != '' then ${run.head} else head end, update_seq = ${updateSequence}, updated_at = ${nowSeconds()} where id = ${runId}`
})

const ScopePathsJson = Schema.fromJsonString(Schema.Array(Schema.String))

const verifyScopeRun = <Run extends { readonly repoPath: string; readonly branch: string }>(run: Run) => Effect.gen(function*() {
  const git = yield* trustedExecutable("git", run.repoPath)
  const checkedOutBranch = yield* checkedTrimmedText(git, ["symbolic-ref", "--quiet", "--short", "HEAD"], { cwd: run.repoPath }).pipe(
    Effect.mapError(() => new InvalidScopeBudget("scope commands require a checked-out Git branch; detached HEAD cannot provide a stable review identity"))
  )
  if (run.branch !== checkedOutBranch) {
    return yield* Effect.fail(new InvalidScopeBudget(`--branch '${run.branch}' does not match the checked-out Git branch '${checkedOutBranch}'; use the Git branch identity so scope state cannot be reset with a cosmetic label`))
  }
  return run
})

const exactRunId = Effect.fn("ReviewFindings.exactRunId")(function*(run: Pick<ReviewRun, "repoPath" | "branch" | "target" | "base">) {
  const sql = yield* SqlClient.SqlClient
  const repoKey = yield* canonicalRepoKey(run.repoPath)
  const rows = yield* sql.unsafe<RunRow>(
    "select id from review_runs where repo_key = ? and coalesce(branch, '') = ? and target = ? and coalesce(base, '') = ? order by update_seq desc, updated_at desc, rowid desc limit 1",
    [repoKey, run.branch, run.target, run.base]
  )
  return rows[0]?.id
})

const resolveRecordRun = Effect.fn("ReviewFindings.resolveRecordRun")(function*(run: ReviewRun) {
  if (run.branch.length > 0 && run.base.length > 0) return run
  const sql = yield* SqlClient.SqlClient
  const repoKey = yield* canonicalRepoKey(run.repoPath)
  const where = ["repo_key = ?", "target = ?"]
  const params: Array<unknown> = [repoKey, run.target]
  if (run.branch.length > 0) { where.push("coalesce(branch, '') = ?"); params.push(run.branch) }
  if (run.base.length > 0) { where.push("coalesce(base, '') = ?"); params.push(run.base) }
  const matches = yield* sql.unsafe<RunIdentityRow>(
    `select id, coalesce(branch, '') as branch, coalesce(base, '') as base from review_runs where ${where.join(" and ")} order by update_seq desc, updated_at desc, rowid desc limit 2`,
    params
  )
  if (matches.length > 1) {
    return yield* Effect.fail(new InvalidFinding("omitted run identity fields match multiple review runs; pass --branch and --base"))
  }
  const match = matches[0]
  return match === undefined ? run : {
    ...run,
    branch: run.branch.length > 0 ? run.branch : match.branch,
    base: run.base.length > 0 ? run.base : match.base
  }
})

const readScopeBudget = Effect.fn("ReviewFindings.readScopeBudget")(function*(runId: string) {
  const sql = yield* SqlClient.SqlClient
  const rows = yield* sql<ScopeBudgetRow>`select * from review_scope_budgets where run_id = ${runId}`
  const row = rows[0]
  if (row === undefined) return yield* Effect.fail(new MissingScopeBudget())
  const baselinePaths = yield* Schema.decodeUnknownEffect(ScopePathsJson)(row.baseline_paths_json)
  const baselineBinaryPaths = yield* Schema.decodeUnknownEffect(ScopePathsJson)(row.baseline_binary_paths_json)
  const lineMetric = yield* Schema.decodeUnknownEffect(ScopeLineMetric)(row.line_metric)
  const newProductionPaths = yield* Schema.decodeUnknownEffect(ScopePathsJson)(row.new_production_paths_json)
  const newBinaryProductionPaths = yield* Schema.decodeUnknownEffect(ScopePathsJson)(row.new_binary_production_paths_json)
  return {
    runId: row.run_id,
    generation: row.generation,
    lineMetric,
    baseRef: row.base_ref,
    baseOid: row.base_oid,
    pinnedHeadOid: row.pinned_head_oid,
    limitPercent: row.limit_percent,
    scopeSummary: row.scope_summary,
    authorization: row.authorization,
    baselineProductionLines: row.baseline_production_lines,
    baselineTestLines: row.baseline_test_lines,
    baselineGeneratedLines: row.baseline_generated_lines,
    baselinePaths,
    baselineBinaryPaths,
    status: row.status,
    currentProductionLines: row.current_production_lines,
    currentTestLines: row.current_test_lines,
    currentGeneratedLines: row.current_generated_lines,
    growthLines: row.growth_lines,
    allowedGrowthLines: row.allowed_growth_lines,
    newProductionPaths,
    newBinaryProductionPaths,
    lastReason: row.last_reason
  } satisfies ScopeBudgetStatus
})

const coverageTarget = Effect.fn("ReviewFindings.coverageTarget")(function*(run: Pick<ReviewRun, "repoPath" | "branch" | "target" | "base">) {
  const verifiedRun = yield* verifyScopeRun(run)
  const runId = yield* exactRunId(verifiedRun)
  if (runId === undefined) return yield* Effect.fail(new InvalidReviewCoverage("review file coverage requires an existing scope run"))
  const budget = yield* readScopeBudget(runId)
  const manifest = yield* changedFileManifest(verifiedRun.repoPath, budget.baseOid, budget.pinnedHeadOid.length === 0 ? "HEAD" : budget.pinnedHeadOid, budget.pinnedHeadOid.length === 0)
  return { runId, budget, manifest }
})

export const classifyReviewFileCoverage = (
  manifest: ReadonlyArray<ReviewFileIdentity>,
  attestations: ReadonlyArray<Pick<ReviewFileAttestationRow, "review_id" | "path" | "change_id">>
): ReadonlyArray<ReviewFileCoverage> => {
  const priority: Readonly<Record<ReviewFileState, number>> = { stale: 0, unreviewed: 0, "reviewed-once": 1, "reviewed-twice": 2 }
  const attestationsByPath = new Map<string, Array<Pick<ReviewFileAttestationRow, "review_id" | "path" | "change_id">>>()
  for (const attestation of attestations) {
    const rows = attestationsByPath.get(attestation.path) ?? []
    rows.push(attestation)
    attestationsByPath.set(attestation.path, rows)
  }
  const coverage = manifest.map((file) => {
    const forPath = attestationsByPath.get(file.path) ?? []
    const reviews = new Set(forPath.filter((attestation) => attestation.change_id === file.changeId).map((attestation) => attestation.review_id)).size
    const state: ReviewFileState = reviews >= 2
      ? "reviewed-twice"
      : reviews === 1
      ? "reviewed-once"
      : forPath.length > 0
      ? "stale"
      : "unreviewed"
    return { ...file, reviews, state }
  })
  return coverage.sort((left, right) => priority[left.state] - priority[right.state] || (left.path < right.path ? -1 : left.path > right.path ? 1 : 0))
}

export const getReviewFileCoverage = Effect.fn("ReviewFindings.getReviewFileCoverage")(function*(run: Pick<ReviewRun, "repoPath" | "branch" | "target" | "base">) {
  const sql = yield* SqlClient.SqlClient
  const coverage = yield* coverageTarget(run)
  const attestations = yield* sql<ReviewFileAttestationRow>`select review_id, reviewer, path, change_id from review_file_attestations where run_id = ${coverage.runId}`
  return classifyReviewFileCoverage(coverage.manifest, attestations)
})

export const recordReviewedFiles = Effect.fn("ReviewFindings.recordReviewedFiles")(function*(run: Pick<ReviewRun, "repoPath" | "branch" | "target" | "base">, input: ReviewedFilesInput) {
  if (input.reviewId.trim().length === 0) return yield* Effect.fail(new InvalidReviewCoverage("coverage-record requires a non-empty review ID"))
  if (input.reviewer.trim().length === 0) return yield* Effect.fail(new InvalidReviewCoverage("coverage-record requires the reviewer or review source"))
  const files = new Map<string, string>()
  for (const file of input.files) {
    if (file.changeId.trim().length === 0) return yield* Effect.fail(new InvalidReviewCoverage(`coverage-record requires an observed change ID for '${file.path}'`))
    const previous = files.get(file.path)
    if (previous !== undefined && previous !== file.changeId) return yield* Effect.fail(new InvalidReviewCoverage(`coverage-record received conflicting change IDs for '${file.path}'`))
    files.set(file.path, file.changeId)
  }
  if (files.size === 0) return yield* Effect.fail(new InvalidReviewCoverage("coverage-record requires at least one reviewed file"))
  const sql = yield* SqlClient.SqlClient
  const coverage = yield* coverageTarget(run)
  if (coverage.budget.status === "complete") return yield* Effect.fail(new InvalidReviewCoverage("review file coverage is complete and terminal; start a new review run before recording more files"))
  const manifest = new Map(coverage.manifest.map((file) => [file.path, file]))
  const invalid = [...files.keys()].filter((path) => !manifest.has(path))
  if (invalid.length > 0) return yield* Effect.fail(new InvalidReviewCoverage(`coverage-record accepts only files in the current changed-file manifest; not changed: ${invalid.join(", ")}`))
  const changed = [...files].filter(([path, changeId]) => manifest.get(path)?.changeId !== changeId).map(([path]) => path)
  if (changed.length > 0) return yield* Effect.fail(new InvalidReviewCoverage(`coverage-record rejected files that changed after review: ${changed.join(", ")}; review their current identities before recording them`))
  const existing = yield* sql<ReviewFileAttestationRow>`select review_id, reviewer, path, change_id from review_file_attestations where run_id = ${coverage.runId} and review_id = ${input.reviewId}`
  const wrongReviewer = existing.find((attestation) => attestation.reviewer !== input.reviewer)
  if (wrongReviewer !== undefined) return yield* Effect.fail(new InvalidReviewCoverage(`review ID '${input.reviewId}' already belongs to reviewer '${wrongReviewer.reviewer}'`))
  for (const [path, changeId] of files) {
    const current = manifest.get(path)
    if (current === undefined) continue
    const previous = existing.find((attestation) => attestation.path === path)
    if (previous !== undefined && previous.change_id !== changeId) {
      return yield* Effect.fail(new InvalidReviewCoverage(`review ID '${input.reviewId}' already recorded '${path}' at an older file identity; use a new review ID after reviewing the changed file`))
    }
  }
  const timestamp = nowSeconds()
  yield* sql.withTransaction(Effect.forEach([...files], ([path, changeId]) => {
    const id = stableId([coverage.runId, input.reviewId, path])
    return sql`insert or ignore into review_file_attestations (id, run_id, review_id, reviewer, path, change_id, reviewed_at)
      values (${id}, ${coverage.runId}, ${input.reviewId}, ${input.reviewer}, ${path}, ${changeId}, ${timestamp})`
  }, { discard: true }))
  return { runId: coverage.runId, reviewId: input.reviewId, recordedFiles: files.size }
})

const writeScopeEvent = Effect.fn("ReviewFindings.writeScopeEvent")(function*(input: {
  readonly runId: string
  readonly event: string
  readonly lineMetric: ScopeLineMetric
  readonly baselineProductionLines: number
  readonly baselineTestLines: number
  readonly currentProductionLines: number
  readonly currentTestLines: number
  readonly allowedGrowthLines: number
  readonly newPaths: ReadonlyArray<string>
  readonly reason: string
  readonly scopeSummary: string
  readonly authorization: string
}) {
  const sql = yield* SqlClient.SqlClient
  yield* sql`insert into review_scope_events (run_id, event, line_metric, baseline_production_lines, baseline_test_lines, current_production_lines, current_test_lines, allowed_growth_lines, new_production_paths_json, reason, scope_summary, authorization, created_at)
    values (${input.runId}, ${input.event}, ${input.lineMetric}, ${input.baselineProductionLines}, ${input.baselineTestLines}, ${input.currentProductionLines}, ${input.currentTestLines}, ${input.allowedGrowthLines}, ${JSON.stringify(input.newPaths)}, ${input.reason}, ${input.scopeSummary}, ${input.authorization}, ${nowSeconds()})`
})

const validateLimit = (limitPercent: number) => Number.isInteger(limitPercent) && limitPercent >= 0 && limitPercent <= 1_000
  ? Effect.void
  : Effect.fail(new InvalidScopeBudget("--limit-percent must be an integer from 0 through 1000"))

const saveScopeBaseline = Effect.fn("ReviewFindings.saveScopeBaseline")(function*(run: ReviewRun, input: {
  readonly scopeSummary: string
  readonly limitPercent: number
  readonly authorization: string
  readonly event: "started" | "authorized"
  readonly baseOid?: string
  readonly runId?: string
  readonly freshRun?: boolean
  readonly expectedGeneration?: number
  readonly allowReady?: boolean
}) {
  yield* validateLimit(input.limitPercent)
  const sql = yield* SqlClient.SqlClient
  const git = yield* trustedExecutable("git", run.repoPath)
  const baseOid = input.baseOid ?? (yield* checkedTrimmedText(git, ["rev-parse", "--verify", `${run.base}^{commit}`], { cwd: run.repoPath }))
  const requestedHead = run.head.trim().length > 0 ? run.head : "HEAD"
  const targetOid = yield* checkedTrimmedText(git, ["rev-parse", "--verify", `${requestedHead}^{commit}`], { cwd: run.repoPath })
  const checkoutOid = yield* checkedTrimmedText(git, ["rev-parse", "--verify", "HEAD^{commit}"], { cwd: run.repoPath })
  const pinnedHeadOid = targetOid === checkoutOid ? "" : targetOid
  const measurement = yield* measureScopeDiff(run.repoPath, baseOid, targetOid, pinnedHeadOid.length === 0)
  const baselineLines = humanAuthoredLines(measurement.production.changedLines, measurement.tests.changedLines)
  const allowedGrowthLines = allowedScopeGrowth(baselineLines, input.limitPercent)
  const timestamp = nowSeconds()
  return yield* sql.withTransaction(Effect.gen(function*() {
  const runId = input.runId ?? (yield* (input.freshRun === true ? createScopeRun(run) : upsertRun(run)))
  yield* sql`update review_runs set head = ${targetOid} where id = ${runId}`
  if (input.expectedGeneration !== undefined) {
    const current = yield* readScopeBudget(runId)
    const expectedStatus = current.status === "blocked" || current.status === "rebaseline-required" || (input.allowReady === true && (current.status === "ready" || current.status === "ok"))
    if (current.generation !== input.expectedGeneration || !expectedStatus) {
      return yield* Effect.fail(new InvalidScopeBudget("scope budget changed while scope-authorize was measuring; rerun scope-check and request authorization for the current state"))
    }
  }
  if (input.freshRun === true) {
    const repoKey = yield* canonicalRepoKey(run.repoPath)
    yield* sql`insert or ignore into review_scope_locks (repo_key, branch, run_id) values (${repoKey}, ${run.branch}, ${runId})`
    const owners = yield* sql.unsafe<{ readonly run_id: string; readonly target: string }>(
      "select review_scope_locks.run_id, review_runs.target from review_scope_locks join review_runs on review_runs.id = review_scope_locks.run_id where review_scope_locks.repo_key = ? and review_scope_locks.branch = ?",
      [repoKey, run.branch]
    )
    const owner = owners[0]
    if (owner?.run_id !== runId) {
      if (owner?.target === run.target) return yield* Effect.fail(new ScopeBudgetAlreadyStarted())
      return yield* Effect.fail(new ActiveScopeBudgetExists(owner?.target ?? "unknown"))
    }
  }
  yield* sql`
    insert into review_scope_budgets (run_id, generation, line_metric, base_ref, base_oid, pinned_head_oid, limit_percent, scope_summary, authorization, baseline_production_lines, baseline_test_lines, baseline_generated_lines, baseline_paths_json, baseline_binary_paths_json, status, current_production_lines, current_test_lines, current_generated_lines, growth_lines, allowed_growth_lines, new_production_paths_json, new_binary_production_paths_json, last_reason, started_at, updated_at)
    values (${runId}, 0, ${TOTAL_LOC_LINE_METRIC}, ${run.base}, ${baseOid}, ${pinnedHeadOid}, ${input.limitPercent}, ${input.scopeSummary}, ${input.authorization}, ${measurement.production.changedLines}, ${measurement.tests.changedLines}, ${measurement.generated.changedLines}, ${JSON.stringify(measurement.humanAuthoredPaths)}, ${JSON.stringify(measurement.humanAuthoredBinaryPaths)}, 'ready', ${measurement.production.changedLines}, ${measurement.tests.changedLines}, ${measurement.generated.changedLines}, 0, ${allowedGrowthLines}, '[]', '[]', '', ${timestamp}, ${timestamp})
    on conflict(run_id) do update set
      generation=review_scope_budgets.generation + 1, line_metric=excluded.line_metric, base_ref=excluded.base_ref, base_oid=excluded.base_oid, pinned_head_oid=excluded.pinned_head_oid, limit_percent=excluded.limit_percent, scope_summary=excluded.scope_summary,
      authorization=excluded.authorization, baseline_production_lines=excluded.baseline_production_lines,
      baseline_test_lines=excluded.baseline_test_lines, baseline_generated_lines=excluded.baseline_generated_lines,
      baseline_paths_json=excluded.baseline_paths_json, baseline_binary_paths_json=excluded.baseline_binary_paths_json, status='ready', current_production_lines=excluded.current_production_lines,
      current_test_lines=excluded.current_test_lines, current_generated_lines=excluded.current_generated_lines,
      growth_lines=0, allowed_growth_lines=excluded.allowed_growth_lines, new_production_paths_json='[]', new_binary_production_paths_json='[]',
      last_reason='', updated_at=excluded.updated_at`
  yield* writeScopeEvent({
    runId,
    event: input.event,
    lineMetric: TOTAL_LOC_LINE_METRIC,
    baselineProductionLines: measurement.production.changedLines,
    baselineTestLines: measurement.tests.changedLines,
    currentProductionLines: measurement.production.changedLines,
    currentTestLines: measurement.tests.changedLines,
    allowedGrowthLines,
    newPaths: [],
    reason: "",
    scopeSummary: input.scopeSummary,
    authorization: input.authorization
  })
  return yield* readScopeBudget(runId)
  }))
})

export const startScopeBudget = Effect.fn("ReviewFindings.startScopeBudget")(function*(run: ReviewRun, input: {
  readonly scopeSummary: string
}) {
  const sql = yield* SqlClient.SqlClient
  const verifiedRun = yield* verifyScopeRun(run)
  const repoKey = yield* canonicalRepoKey(verifiedRun.repoPath)
  const active = yield* sql.unsafe<ActiveScopeRow>(
    "select review_scope_budgets.run_id, review_runs.target from review_scope_budgets join review_runs on review_runs.id = review_scope_budgets.run_id where review_runs.repo_key = ? and coalesce(review_runs.branch, '') = ? and review_scope_budgets.status != 'complete' order by review_scope_budgets.updated_at desc limit 1",
    [repoKey, verifiedRun.branch]
  )
  const existing = active[0]
  if (existing !== undefined) {
    if (existing.target === verifiedRun.target) return yield* Effect.fail(new ScopeBudgetAlreadyStarted())
    return yield* Effect.fail(new ActiveScopeBudgetExists(existing.target))
  }
  return yield* saveScopeBaseline(verifiedRun, { ...input, limitPercent: DEFAULT_SCOPE_GROWTH_PERCENT, authorization: "", event: "started", freshRun: true })
})

export const authorizeScopeBudget = Effect.fn("ReviewFindings.authorizeScopeBudget")(function*(run: ReviewRun, input: {
  readonly scopeSummary: string
  readonly authorization: string
}) {
  if (input.authorization.trim().length === 0) return yield* Effect.fail(new InvalidScopeBudget("scope-authorize requires the user's explicit authorization text"))
  const verifiedRun = yield* verifyScopeRun(run)
  const runId = yield* exactRunId(verifiedRun)
  if (runId === undefined) return yield* Effect.fail(new MissingScopeBudget())
  const existing = yield* readScopeBudget(runId)
  if (existing.status === "complete") return yield* Effect.fail(new InvalidScopeBudget("scope budget is complete and terminal; start a new user-authorized review instead of reopening it"))
  const git = yield* trustedExecutable("git", verifiedRun.repoPath)
  const currentBaseOid = yield* checkedTrimmedText(git, ["rev-parse", "--verify", `${verifiedRun.base}^{commit}`], { cwd: verifiedRun.repoPath })
  const baseMoved = currentBaseOid !== existing.baseOid
  if (existing.status !== "blocked" && existing.status !== "rebaseline-required" && !baseMoved) {
    return yield* Effect.fail(new InvalidScopeBudget("scope-authorize is only valid after scope-check has blocked, migration requires rebaseline, or the requested base ref has moved"))
  }
  return yield* saveScopeBaseline(verifiedRun, { ...input, limitPercent: existing.limitPercent, baseOid: currentBaseOid, event: "authorized", runId, expectedGeneration: existing.generation, allowReady: baseMoved })
})

export const getScopeBudget = Effect.fn("ReviewFindings.getScopeBudget")(function*(run: Pick<ReviewRun, "repoPath" | "branch" | "target" | "base">) {
  const verifiedRun = yield* verifyScopeRun(run)
  const runId = yield* exactRunId(verifiedRun)
  if (runId === undefined) return yield* Effect.fail(new MissingScopeBudget())
  return yield* readScopeBudget(runId)
})

export const checkScopeBudget = Effect.fn("ReviewFindings.checkScopeBudget")(function*(run: Pick<ReviewRun, "repoPath" | "branch" | "target" | "base">, reason: string) {
  if (reason.trim().length === 0) return yield* Effect.fail(new InvalidScopeBudget("scope-check requires a concise reason for any additional review work"))
  const sql = yield* SqlClient.SqlClient
  const budget = yield* getScopeBudget(run)
  if (budget.status === "complete") return yield* Effect.fail(new InvalidScopeBudget("scope budget is complete and terminal; start a new user-authorized review instead of reopening it"))
  if (budget.status === "rebaseline-required") return yield* Effect.fail(new InvalidScopeBudget(budget.lastReason))
  if (budget.lineMetric !== TOTAL_LOC_LINE_METRIC) return yield* Effect.fail(new InvalidScopeBudget("scope budget uses the retired production-only metric; explicit rebaseline is required"))
  const measurement: ScopeMeasurement = yield* measureScopeDiff(run.repoPath, budget.baseOid, budget.pinnedHeadOid.length === 0 ? "HEAD" : budget.pinnedHeadOid, budget.pinnedHeadOid.length === 0)
  const baselinePaths = new Set(budget.baselinePaths)
  const newHumanAuthoredPaths = measurement.humanAuthoredPaths.filter((path) => !baselinePaths.has(path))
  const baselineBinaryPaths = new Set(budget.baselineBinaryPaths)
  const newBinaryHumanAuthoredPaths = measurement.humanAuthoredBinaryPaths.filter((path) => !baselineBinaryPaths.has(path))
  const baselineLines = humanAuthoredLines(budget.baselineProductionLines, budget.baselineTestLines)
  const currentLines = humanAuthoredLines(measurement.production.changedLines, measurement.tests.changedLines)
  const growthLines = Math.max(0, currentLines - baselineLines)
  const maximumLines = baselineLines + budget.allowedGrowthLines
  const blocked = currentLines > maximumLines || newBinaryHumanAuthoredPaths.length > 0
  const status = blocked ? "blocked" : "ok"
  const timestamp = nowSeconds()
  return yield* sql.withTransaction(Effect.gen(function*() {
  const current = yield* readScopeBudget(budget.runId)
  if (current.generation !== budget.generation || current.status !== budget.status) {
    return yield* Effect.fail(new InvalidScopeBudget("scope budget changed while scope-check was measuring; rerun scope-check for the current state"))
  }
  yield* sql`update review_scope_budgets set generation = generation + 1, status = ${status}, current_production_lines = ${measurement.production.changedLines}, current_test_lines = ${measurement.tests.changedLines}, current_generated_lines = ${measurement.generated.changedLines}, growth_lines = ${growthLines}, new_production_paths_json = ${JSON.stringify(newHumanAuthoredPaths)}, new_binary_production_paths_json = ${JSON.stringify(newBinaryHumanAuthoredPaths)}, last_reason = ${reason}, updated_at = ${timestamp} where run_id = ${budget.runId}`
  yield* writeScopeEvent({
    runId: budget.runId,
    event: blocked ? "blocked" : "checked",
    lineMetric: budget.lineMetric,
    baselineProductionLines: budget.baselineProductionLines,
    baselineTestLines: budget.baselineTestLines,
    currentProductionLines: measurement.production.changedLines,
    currentTestLines: measurement.tests.changedLines,
    allowedGrowthLines: budget.allowedGrowthLines,
    newPaths: newHumanAuthoredPaths,
    reason,
    scopeSummary: budget.scopeSummary,
    authorization: budget.authorization
  })
  const completedFindings = yield* sql<FixedFindingRow>`select decision_id, summary from issues where run_id = ${budget.runId} and status = 'fixed' order by decision_id`
  return {
    ...budget,
    generation: budget.generation + 1,
    status,
    currentProductionLines: measurement.production.changedLines,
    currentTestLines: measurement.tests.changedLines,
    currentGeneratedLines: measurement.generated.changedLines,
    growthLines,
    newProductionPaths: newHumanAuthoredPaths,
    newBinaryProductionPaths: newBinaryHumanAuthoredPaths,
    lastReason: reason,
    maximumLines,
    completedFindings,
    blocked
  } satisfies ScopeBudgetCheck
  }))
})

export const completeScopeBudget = Effect.fn("ReviewFindings.completeScopeBudget")(function*(run: Pick<ReviewRun, "repoPath" | "branch" | "target" | "base">, reason: string) {
  if (reason.trim().length === 0) return yield* Effect.fail(new InvalidScopeBudget("scope-complete requires the clean review result"))
  const sql = yield* SqlClient.SqlClient
  const budget = yield* getScopeBudget(run)
  if (budget.status === "complete") return yield* Effect.fail(new InvalidScopeBudget("scope budget is complete and terminal; start a new user-authorized review instead of reopening it"))
  if (budget.status !== "ok") return yield* Effect.fail(new InvalidScopeBudget("scope-complete requires a final passing scope-check"))
  const check = yield* checkScopeBudget(run, reason)
  if (check.blocked) return yield* Effect.fail(new ScopeBudgetBlocked(check))
  return yield* sql.withTransaction(Effect.gen(function*() {
    const current = yield* readScopeBudget(check.runId)
    if (current.generation !== check.generation || current.status !== "ok") {
      return yield* Effect.fail(new InvalidScopeBudget("scope budget changed before scope-complete could commit; rerun the final scope-check"))
    }
    const findings = yield* sql<UnresolvedFindingRow>`select decision_id, status, summary, coalesce(disposition, '') as disposition, coalesce(owner_resolution, '') as owner_resolution, coalesce(evidence_version, 7) as evidence_version from issues where run_id = ${check.runId} order by decision_id`
    const unresolved = findings.filter((finding) => !isFindingTerminal(finding) || hasLegacyEvidence(finding))
    if (unresolved.length > 0) {
      const findings = unresolved.map((finding) => `${finding.decision_id} [${finding.status}]: ${finding.summary}`).join("\n")
      return yield* Effect.fail(new InvalidScopeBudget(`scope-complete requires every finding to be fixed, rejected, or explicitly deferred; resolve these findings first:\n${findings}`))
    }
    yield* sql`update review_scope_budgets set generation = generation + 1, status = 'complete', last_reason = ${reason}, updated_at = ${nowSeconds()} where run_id = ${check.runId}`
    yield* sql`delete from review_scope_locks where run_id = ${check.runId}`
    yield* writeScopeEvent({
    runId: check.runId,
    event: "complete",
    lineMetric: check.lineMetric,
    baselineProductionLines: check.baselineProductionLines,
    baselineTestLines: check.baselineTestLines,
    currentProductionLines: check.currentProductionLines,
    currentTestLines: check.currentTestLines,
    allowedGrowthLines: check.allowedGrowthLines,
    newPaths: [],
    reason,
    scopeSummary: check.scopeSummary,
    authorization: check.authorization
    })
    return { ...check, generation: check.generation + 1, status: "complete", lastReason: reason }
  }))
})

type DecodedFinding = typeof FindingRecord.Type

const requiredFindingText = (finding: DecodedFinding) => {
  const fields = [
    ["--decision-id", finding.decisionId],
    ["--source", finding.source],
    ["--fingerprint", finding.fingerprint],
    ["--summary", finding.summary]
  ] as const
  return fields.find(([, value]) => value.trim().length === 0)?.[0]
}

const findingInputError = (finding: DecodedFinding) => {
  const missing = requiredFindingText(finding)
  if (missing !== undefined) return `${missing} must not be empty`
  if (finding.handling === "reject" && finding.decision.trim().length === 0) {
    return "--handling reject requires --decision with the actionability rationale"
  }

  const runtimeEvidenceFields = [
    ["--production-path", finding.productionPath],
    ["--reachability-evidence", finding.reachabilityEvidence],
    ["--actual-consequence", finding.actualConsequence]
  ] as const
  const runtimeFields = [
    ...runtimeEvidenceFields,
    ["--likelihood", finding.likelihood] as const,
    ["--impact", finding.impact] as const,
    ["--contract-evidence", finding.contractEvidence] as const
  ]
  if (finding.findingKind === "runtime") {
    if (finding.likelihood.length === 0) return "runtime findings require --likelihood"
    if (finding.impact.length === 0) return "runtime findings require --impact"
    if (finding.likelihood === "unknown" || finding.likelihood === "theoretical") {
      if (finding.decision.trim().length === 0) return `${finding.likelihood} runtime findings require --decision with the investigation or rejection rationale`
    } else {
      const missingEvidence = runtimeEvidenceFields.find(([, value]) => value.trim().length === 0)?.[0]
      if (missingEvidence !== undefined) return `runtime findings require ${missingEvidence}`
    }
    const maintenanceFields = [
      ["--maintenance-evidence", finding.maintenanceEvidence],
      ["--present-cost", finding.presentCost]
    ] as const
    const unexpectedMaintenance = maintenanceFields.find(([, value]) => value.trim().length > 0)?.[0]
    if (unexpectedMaintenance !== undefined) return `runtime findings must omit maintenance evidence field ${unexpectedMaintenance}`
  } else {
    const unexpectedRuntime = runtimeFields.find(([, value]) => value.trim().length > 0)?.[0]
    if (unexpectedRuntime !== undefined) return `maintenance findings must omit runtime risk field ${unexpectedRuntime}`
    const hasMaintenanceEvidence = finding.maintenanceEvidence.trim().length > 0
    const hasPresentCost = finding.presentCost.trim().length > 0
    if (hasMaintenanceEvidence !== hasPresentCost) {
      return hasMaintenanceEvidence
        ? "maintenance findings require --present-cost"
        : "maintenance findings require --maintenance-evidence"
    }
    if (!hasMaintenanceEvidence) {
      if (finding.status !== "rejected" || finding.ownerResolution.length > 0) return "maintenance findings require --maintenance-evidence"
      if (finding.decision.trim().length === 0) return "rejected maintenance candidates without evidence require --decision with the rejection rationale"
    }
  }

  return undefined
}

const deriveFindingOutcome = (finding: DecodedFinding): FindingOutcome | undefined => {
  if (finding.findingKind === "runtime") {
    if (finding.likelihood === "" || finding.impact === "") return undefined
    const outcome = deriveRuntimeOutcome(finding.likelihood, finding.impact)
    if (outcome.disposition === "reject" || outcome.disposition === "investigate") return outcome
    if (finding.handling === "reject") return { severity: outcome.severity, disposition: "reject" }
    if (finding.handling === "follow-up") return { severity: outcome.severity, disposition: "follow-up" }
    if (finding.handling === "consult" || outcome.disposition === "consult") return { severity: outcome.severity, disposition: "consult" }
    return finding.status === "deferred" && outcome.disposition === "accept"
      ? { severity: outcome.severity, disposition: "residual" }
      : outcome
  }
  if (finding.maintenanceEvidence.length === 0) return { severity: "", disposition: "reject" }
  if (finding.handling === "reject") return { severity: "", disposition: "reject" }
  if (finding.handling === "follow-up") return { severity: "", disposition: "follow-up" }
  if (finding.handling === "consult") return { severity: "", disposition: "consult" }
  if (finding.ownerResolution.length > 0) return { severity: "", disposition: "accept" }
  if (finding.status === "deferred") return { severity: "", disposition: "residual" }
  return { severity: "", disposition: "accept" }
}

const findingStatusError = (finding: Finding) => {
  const allowedStatuses: Readonly<Record<FindingDisposition, ReadonlyArray<Finding["status"]>>> = {
    accept: ["open", "fixed", "provisional", "reopened"],
    investigate: ["open", "reopened"],
    consult: ["open", "reopened"],
    "follow-up": ["deferred"],
    residual: ["deferred"],
    reject: ["rejected"]
  }
  if (finding.ownerResolution.length > 0) {
    if (finding.decision.trim().length === 0) return "--owner-resolution requires --decision with the owner's decision"
    if (finding.ownerResolution === "approved" && finding.status === "fixed" && ["accept", "consult"].includes(finding.disposition)) return undefined
    if (finding.ownerResolution === "declined" && finding.status === "rejected" && ["accept", "consult"].includes(finding.disposition)) return undefined
    if (finding.ownerResolution === "declined" && finding.status === "deferred" && finding.disposition === "consult") return undefined
    return `owner resolution ${finding.ownerResolution} cannot close disposition ${finding.disposition} with status ${finding.status}`
  }
  if (finding.disposition === "residual" && finding.decision.trim().length === 0) {
    return "residual deferrals require --decision with the residual-risk rationale"
  }
  if (finding.disposition === "follow-up" && finding.decision.trim().length === 0) {
    return "follow-up deferrals require --decision with the follow-up owner or next action"
  }
  if (!allowedStatuses[finding.disposition].includes(finding.status)) {
    return `disposition ${finding.disposition} cannot use status ${finding.status}`
  }
  return undefined
}

const actionableDispositions = new Set<FindingDisposition>(["accept", "consult", "follow-up", "residual"])

const findingActionabilityError = (finding: Finding) => {
  const repairFields = [
    ["--root-cause", finding.rootCause],
    ["--recommended-fix", finding.recommendedFix],
    ["--intervention-justification", finding.interventionJustification]
  ] as const
  const actionable = actionableDispositions.has(finding.disposition)
  if (actionable) {
    if (finding.findingKind === "runtime" && finding.contractEvidence.trim().length === 0) {
      return "actionable runtime findings require --contract-evidence"
    }
    const repairlessConsult = finding.disposition === "consult" && finding.ownerResolution !== "approved"
    const requiredRepair = repairlessConsult
      ? repairFields.filter(([flag]) => flag !== "--recommended-fix")
      : repairFields
    const missingRepair = requiredRepair.find(([, value]) => value.trim().length === 0)?.[0]
    if (missingRepair !== undefined) return `actionable findings require ${missingRepair}`
    if (finding.disposition === "consult" && finding.ownerResolution.length === 0 && finding.decision.trim().length === 0) return "unresolved consult findings require --decision with the owner's question"
    if (repairlessConsult && finding.recommendedFix.trim().length === 0 && finding.decision.trim().length === 0) return "consult findings without --recommended-fix require --decision with the unresolved repair rationale"
    if (finding.rejectionGate.length > 0) return "actionable findings must omit --rejection-gate"
    return undefined
  }

  const unexpectedRepair = repairFields.find(([, value]) => value.trim().length > 0)?.[0]
  if (unexpectedRepair !== undefined) return `${finding.disposition} candidates must omit repair field ${unexpectedRepair}`
  if (finding.status === "rejected" && finding.ownerResolution.length === 0) {
    if (finding.rejectionGate.length === 0) return "rejected candidates require --rejection-gate"
    if (finding.decision.trim().length === 0) return "rejected candidates require --decision with the rejection rationale"
  } else if (finding.rejectionGate.length > 0) {
    return "--rejection-gate is only valid for rejected candidates without an owner resolution"
  }
  return undefined
}

const decodeFindingInput = Effect.fn("ReviewFindings.decodeFindingInput")(function*(input: FindingInput, skipActionability: boolean) {
  const normalized = {
    ...input,
    status: normalizeStatus(input.status),
    area: normalizeToken(input.area),
    findingKind: normalizeToken(input.findingKind),
    likelihood: normalizeToken(input.likelihood),
    impact: normalizeToken(input.impact),
    maintenanceEvidence: input.maintenanceEvidence.trim(),
    presentCost: input.presentCost.trim(),
    contractEvidence: input.contractEvidence.trim(),
    rootCause: input.rootCause.trim(),
    recommendedFix: input.recommendedFix.trim(),
    interventionJustification: input.interventionJustification.trim(),
    rejectionGate: normalizeToken(input.rejectionGate),
    fixScope: normalizeToken(input.fixScope),
    handling: normalizeToken(input.handling),
    ownerResolution: normalizeToken(input.ownerResolution)
  }
  const finding = yield* Schema.decodeUnknownEffect(FindingRecord)(normalized).pipe(
    Effect.mapError(() => new InvalidFinding(`one or more enum fields are outside schema v${FINDING_SCHEMA_VERSION}`))
  )
  const inputError = findingInputError(finding)
  if (inputError !== undefined) return yield* Effect.fail(new InvalidFinding(inputError))
  const outcome = deriveFindingOutcome(finding)
  if (outcome === undefined) return yield* Effect.fail(new InvalidFinding("runtime findings require --likelihood and --impact"))
  const completeFinding = { ...finding, ...outcome } satisfies Finding
  const actionabilityError = findingActionabilityError(completeFinding)
  if (actionabilityError !== undefined && !skipActionability) return yield* Effect.fail(new InvalidFinding(actionabilityError))
  const statusError = findingStatusError(completeFinding)
  if (statusError !== undefined) {
    return yield* Effect.fail(new InvalidFinding(`${completeFinding.likelihood || "maintenance"}+${completeFinding.impact || "no impact"} derives ${completeFinding.severity || "no severity"}/${completeFinding.disposition}; ${statusError}`))
  }
  return completeFinding
})

export const decodeFinding = Effect.fn("ReviewFindings.decodeFinding")(function*(input: FindingInput) {
  return yield* decodeFindingInput(input, false)
})

const decodeFindingForReplay = Effect.fn("ReviewFindings.decodeFindingForReplay")(function*(input: FindingInput) {
  return yield* decodeFindingInput(input, true)
})

export const recordFinding = Effect.fn("ReviewFindings.recordFinding")(function*(rawRun: ReviewRun, rawInput: FindingInput) {
  const input = yield* decodeFindingForReplay(rawInput)
  const sql = yield* SqlClient.SqlClient
  return yield* sql.withTransaction(Effect.gen(function*() {
  const run = yield* resolveRecordRun(rawRun)
  const existingRunId = yield* exactRunId(run)
  const material = input.material || isUserVisible(input.area) || isSensitive(input.area) || materialSeverities.has(input.severity)
  const text = [input.decisionId, input.status, input.source, input.fingerprint, input.summary, input.area, input.severity, input.userImpact, input.decision, input.findingKind, input.productionPath, input.reachabilityEvidence, input.likelihood, input.impact, input.actualConsequence, input.maintenanceEvidence, input.presentCost, input.contractEvidence, input.rootCause, input.recommendedFix, input.interventionJustification, input.rejectionGate, input.disposition, input.fixScope, input.handling, input.ownerResolution, input.text].filter(Boolean).join(" ")
  const existingIssues = existingRunId === undefined
    ? []
    : yield* sql<ExistingIssueRow>`select id, decision_id, status, source, fingerprint, summary, coalesce(impact, '') as area, coalesce(priority, '') as severity, coalesce(material, 0) as material, coalesce(user_impact, '') as user_impact, coalesce(decision, '') as decision, text, coalesce(finding_kind, '') as finding_kind, coalesce(production_path, '') as production_path, coalesce(reachability_evidence, '') as reachability_evidence, coalesce(likelihood, '') as likelihood, coalesce(risk_impact, '') as impact, coalesce(actual_consequence, '') as actual_consequence, coalesce(maintenance_evidence, '') as maintenance_evidence, coalesce(present_cost, '') as present_cost, coalesce(contract_evidence, '') as contract_evidence, coalesce(root_cause, '') as root_cause, coalesce(recommended_fix, '') as recommended_fix, coalesce(intervention_justification, '') as intervention_justification, coalesce(rejection_gate, '') as rejection_gate, coalesce(disposition, '') as disposition, coalesce(fix_scope, '') as fix_scope, coalesce(handling, '') as handling, coalesce(owner_resolution, '') as owner_resolution, coalesce(evidence_version, 7) as evidence_version from issues where run_id = ${existingRunId} and decision_id = ${input.decisionId} limit 1`
  const existingIssue = existingIssues[0]
  const existingRun = existingRunId === undefined
    ? undefined
    : (yield* sql<CloseoutRunRow>`select id, status from review_runs where id = ${existingRunId} limit 1`)[0]
  const exactCurrentTerminalReplay = existingIssue !== undefined && !hasLegacyEvidence(existingIssue) &&
    isFindingTerminal(existingIssue) && isExactResolvedReplay(existingIssue, input, material, text)
  if (existingRun?.status === "complete" && !exactCurrentTerminalReplay) {
    return yield* Effect.fail(new InvalidFinding("completed review runs are terminal; start a new user-authorized review before recording more findings"))
  }
  if (existingIssue !== undefined && hasLegacyEvidence(existingIssue) && !isLegacyEvidenceUpgrade(existingIssue, input)) {
    return yield* Effect.fail(new InvalidFinding("legacy evidence upgrades must preserve the finding identity and lifecycle; upgrade the evidence before changing the current record"))
  }
  if (existingIssue !== undefined && existingIssue.owner_resolution.length > 0 && input.ownerResolution.length === 0) {
    return yield* Effect.fail(new InvalidFinding("updating an owner-resolved finding requires --owner-resolution and --decision"))
  }
  if (existingIssue !== undefined && existingIssue.owner_resolution.length > 0) {
    if (!isExactResolvedReplay(existingIssue, input, material, text) && !isLegacyEvidenceUpgrade(existingIssue, input)) {
      return yield* Effect.fail(new InvalidFinding("owner-resolved findings are immutable; only an exact idempotent replay is allowed"))
    }
    if (!hasLegacyEvidence(existingIssue)) return { runId: existingRunId, issueId: existingIssue.id }
  }
  if (existingIssue?.disposition === "follow-up") {
    if (!isExactResolvedReplay(existingIssue, input, material, text) && !isLegacyEvidenceUpgrade(existingIssue, input)) {
      return yield* Effect.fail(new InvalidFinding("deferred follow-up findings are immutable; use a new decision ID for later work"))
    }
    if (!hasLegacyEvidence(existingIssue)) return { runId: existingRunId, issueId: existingIssue.id }
  }
  const actionabilityError = findingActionabilityError(input)
  if (actionabilityError !== undefined) return yield* Effect.fail(new InvalidFinding(actionabilityError))
  const runId = yield* upsertRun(run)
  const scope = yield* sql<ScopeStatusRow>`select status from review_scope_budgets where run_id = ${runId}`
  if (scope[0]?.status === "complete") {
    return yield* Effect.fail(new InvalidScopeBudget("scope budget is complete and terminal; start a new user-authorized review before recording more findings"))
  }
  if (existingIssue?.status === "provisional" && input.status === "rejected") {
    return yield* Effect.fail(new InvalidFinding("declining a provisional repair requires --status reopened and --decision; the accepted finding remains open"))
  }
  if (existingIssue?.status === "provisional" && input.status === "reopened") {
    if (input.ownerResolution.length > 0 || input.decision.trim().length === 0) {
      return yield* Effect.fail(new InvalidFinding("reopening a declined provisional repair requires --decision and must omit --owner-resolution"))
    }
  } else if (existingIssue?.status === "provisional" && input.status !== "provisional" && input.ownerResolution.length === 0) {
    return yield* Effect.fail(new InvalidFinding("closing a provisional finding requires --owner-resolution and --decision"))
  }
  if (existingIssue?.disposition === "consult" && input.disposition !== "consult" && input.ownerResolution.length === 0) {
    return yield* Effect.fail(new InvalidFinding("reclassifying an existing consult requires --owner-resolution and --decision"))
  }
  const issueId = existingIssue?.id ?? stableId([runId, input.decisionId])
  const timestamp = nowSeconds()
  yield* sql`
    insert into issues (id, run_id, decision_id, status, source, fingerprint, summary, impact, priority, material, user_impact, decision, text, finding_kind, production_path, reachability_evidence, likelihood, risk_impact, actual_consequence, maintenance_evidence, present_cost, contract_evidence, root_cause, recommended_fix, intervention_justification, rejection_gate, disposition, fix_scope, handling, owner_resolution, evidence_version, decision_log_path, first_seen_at, last_seen_at, seen_count, updated_at)
    values (${issueId}, ${runId}, ${input.decisionId}, ${input.status}, ${input.source}, ${input.fingerprint}, ${input.summary}, ${input.area}, ${input.severity}, ${material ? 1 : 0}, ${input.userImpact}, ${input.decision}, ${text}, ${input.findingKind}, ${input.productionPath}, ${input.reachabilityEvidence}, ${input.likelihood}, ${input.impact}, ${input.actualConsequence}, ${input.maintenanceEvidence}, ${input.presentCost}, ${input.contractEvidence}, ${input.rootCause}, ${input.recommendedFix}, ${input.interventionJustification}, ${input.rejectionGate}, ${input.disposition}, ${input.fixScope}, ${input.handling}, ${input.ownerResolution}, ${FINDING_SCHEMA_VERSION}, ${run.decisionLog}, ${timestamp}, ${timestamp}, 1, ${timestamp})
    on conflict(id) do update set
      run_id=excluded.run_id, decision_id=excluded.decision_id, status=excluded.status,
      source=excluded.source, fingerprint=excluded.fingerprint, summary=excluded.summary,
      impact=excluded.impact, priority=excluded.priority, material=excluded.material,
      user_impact=excluded.user_impact, decision=excluded.decision, text=excluded.text,
      finding_kind=excluded.finding_kind, production_path=excluded.production_path,
      reachability_evidence=excluded.reachability_evidence, likelihood=excluded.likelihood,
      risk_impact=excluded.risk_impact, actual_consequence=excluded.actual_consequence,
      maintenance_evidence=excluded.maintenance_evidence, present_cost=excluded.present_cost,
      contract_evidence=excluded.contract_evidence, root_cause=excluded.root_cause,
      recommended_fix=excluded.recommended_fix,
      intervention_justification=excluded.intervention_justification,
      rejection_gate=excluded.rejection_gate,
      disposition=excluded.disposition, fix_scope=excluded.fix_scope, handling=excluded.handling,
      owner_resolution=excluded.owner_resolution, evidence_version=excluded.evidence_version,
      decision_log_path=coalesce(nullif(excluded.decision_log_path, ''), issues.decision_log_path, ''),
      first_seen_at=coalesce(issues.first_seen_at, excluded.first_seen_at),
      last_seen_at=excluded.last_seen_at, seen_count=issues.seen_count + 1,
      updated_at=excluded.updated_at`
  return { runId, issueId }
  }))
})

export class MissingReviewRun extends Error {
  readonly _tag = "MissingReviewRun"
  constructor() {
    super("record-command needs --base when no matching review run exists; record a finding first, or pass --base")
  }
}

export const recordCommand = Effect.fn("ReviewFindings.recordCommand")(function*(run: ReviewRun, command: RecordedCommand) {
  const sql = yield* SqlClient.SqlClient
  return yield* sql.withTransaction(Effect.gen(function*() {
  const runId = run.base.length > 0 ? yield* upsertRun(run) : yield* latestRun(run)
  if (runId === undefined) return yield* Effect.fail(new MissingReviewRun())
  if (run.base.length === 0) yield* touchRun(runId, run)
  const existingCommands = yield* sql<IdRow>`select id from commands where run_id = ${runId} and command = ${command.command} and reason = ${command.reason} and coalesce(decision_id, '') = ${command.decisionId} limit 1`
  const commandId = existingCommands[0]?.id ?? stableId([runId, command.command, command.reason, command.decisionId])
  yield* sql`insert into commands (id, run_id, command, result, reason, decision_id, updated_at)
    values (${commandId}, ${runId}, ${command.command}, ${command.result}, ${command.reason}, ${command.decisionId}, ${nowSeconds()})
    on conflict(id) do update set result=excluded.result, reason=excluded.reason, decision_id=excluded.decision_id, updated_at=excluded.updated_at`
  return { runId, commandId }
  }))
})

export const buildCloseout = Effect.fn("ReviewFindings.buildCloseout")(function*(filters: {
  readonly repo: string
  readonly repoPath?: string
  readonly branch?: string
  readonly target?: string
  readonly base?: string
}) {
  const sql = yield* SqlClient.SqlClient
  const where = [filters.repoPath === undefined ? "repo_name = ?" : "repo_key = ?"]
  const repoKey = filters.repoPath === undefined ? undefined : yield* canonicalRepoKey(filters.repoPath)
  const params: Array<unknown> = [repoKey ?? filters.repo]
  if (filters.branch !== undefined) { where.push("branch = ?"); params.push(filters.branch) }
  if (filters.target !== undefined) { where.push("target = ?"); params.push(filters.target) }
  if (filters.base !== undefined) { where.push("coalesce(base, '') = ?"); params.push(filters.base) }
  const runs = yield* sql.unsafe<CloseoutRunRow>(`select id, status from review_runs where ${where.join(" and ")} order by update_seq desc, updated_at desc, rowid desc limit 1`, params)
  const runId = runs[0]?.id
  const findingRows = runId === undefined ? [] : yield* sql<CloseoutFindingRow>`select decision_id, status, source, summary, coalesce(impact, '') as area, case lower(coalesce(priority, '')) when 'p4' then '' else coalesce(priority, '') end as severity, coalesce(material, 0) as material, coalesce(user_impact, '') as user_impact, coalesce(decision, '') as decision, fingerprint, coalesce(finding_kind, '') as finding_kind, coalesce(production_path, '') as production_path, coalesce(reachability_evidence, '') as reachability_evidence, coalesce(likelihood, '') as likelihood, coalesce(risk_impact, '') as impact, coalesce(actual_consequence, '') as actual_consequence, coalesce(maintenance_evidence, '') as maintenance_evidence, coalesce(present_cost, '') as present_cost, coalesce(contract_evidence, '') as contract_evidence, coalesce(root_cause, '') as root_cause, coalesce(recommended_fix, '') as recommended_fix, coalesce(intervention_justification, '') as intervention_justification, coalesce(rejection_gate, '') as rejection_gate, coalesce(disposition, '') as disposition, coalesce(fix_scope, '') as fix_scope, coalesce(handling, '') as handling, coalesce(owner_resolution, '') as owner_resolution, coalesce(evidence_version, 7) as evidence_version from issues where run_id = ${runId} order by decision_id`
  const findings: ReadonlyArray<CloseoutFinding> = findingRows.map((finding) => ({ ...finding, material: finding.material !== 0 }))
  const actionableFindings = findings.filter((finding) => !["reject", "investigate"].includes(finding.disposition))
  const commands = runId === undefined ? [] : yield* sql<CommandRow>`select command, result, reason, coalesce(decision_id, '') as decision_id from commands where run_id = ${runId} order by updated_at, command`
  const scopeBudget = runId === undefined ? Option.none() : yield* readScopeBudget(runId).pipe(Effect.option)
  const reviewComplete = Option.isSome(scopeBudget) ? scopeBudget.value.status === "complete" : runs[0]?.status === "complete"
  return {
    review_candidates: findings,
    material_findings: actionableFindings.filter(isMaterial),
    user_visible_or_workflow_changes: actionableFindings.filter((finding) => isUserVisible(finding.area)),
    security_data_permission_changes: actionableFindings.filter((finding) => isSensitive(finding.area)),
    lower_risk_findings: actionableFindings.filter((finding) => !isMaterial(finding)),
    findings_found: actionableFindings,
    changes_made_while_reviewing: actionableFindings.filter((finding) => finding.status === "fixed"),
    verification_run: commands,
    deferred_work: actionableFindings.filter(isDeferredWork),
    still_open: findings.filter((finding) => !isFindingTerminal(finding) || (!reviewComplete && hasLegacyEvidence(finding))),
    ...(Option.isSome(scopeBudget) ? { scope_budget: scopeBudget.value } : {})
  } satisfies Closeout
})

export const queryFindings = Effect.fn("ReviewFindings.queryFindings")(function*(query: string, filters: {
  readonly limit: number
  readonly repo?: string
  readonly repoPath?: string
  readonly branch?: string
  readonly target?: string
  readonly status?: string
}) {
  const sql = yield* SqlClient.SqlClient
  const where: Array<string> = []
  const params: Array<unknown> = []
  const repoKey = filters.repoPath === undefined ? undefined : yield* canonicalRepoKey(filters.repoPath)
  let latestRunId: string | undefined
  if ((repoKey !== undefined || filters.repo !== undefined) && filters.branch !== undefined && filters.target !== undefined) {
    const repoColumn = repoKey === undefined ? "repo_name" : "repo_key"
    const runs = yield* sql.unsafe<RunRow>(`select id from review_runs where ${repoColumn} = ? and coalesce(branch, '') = ? and target = ? order by update_seq desc, updated_at desc, rowid desc limit 1`, [repoKey ?? filters.repo, filters.branch, filters.target])
    latestRunId = runs[0]?.id
    if (latestRunId === undefined) return []
    where.push("issues.run_id = ?"); params.push(latestRunId)
  } else {
    if (repoKey !== undefined) { where.push("review_runs.repo_key = ?"); params.push(repoKey) }
    else if (filters.repo !== undefined) { where.push("review_runs.repo_name = ?"); params.push(filters.repo) }
    if (filters.branch !== undefined) { where.push("coalesce(review_runs.branch, '') = ?"); params.push(filters.branch) }
    if (filters.target !== undefined) { where.push("review_runs.target = ?"); params.push(filters.target) }
    where.push(`not exists (
      select 1 from issues newer join review_runs newer_runs on newer_runs.id = newer.run_id
      where newer.decision_id = issues.decision_id
        and newer_runs.repo_name = review_runs.repo_name
        and newer_runs.repo_key = review_runs.repo_key
        and coalesce(newer_runs.branch, '') = coalesce(review_runs.branch, '')
        and newer_runs.target = review_runs.target
        and (newer.updated_at > issues.updated_at or (newer.updated_at = issues.updated_at and newer.rowid > issues.rowid))
    )`)
  }
  if (filters.status !== undefined) { where.push("issues.status = ?"); params.push(filters.status) }
  const rows = yield* sql.unsafe<QueryRow>(`select issues.id, issues.decision_id, issues.status, issues.source, issues.fingerprint, issues.summary, coalesce(issues.decision, '') as decision, issues.text, coalesce(issues.decision_log_path, '') as decision_log_path, coalesce(issues.last_seen_at, 0) as last_seen_at, coalesce(issues.seen_count, 1) as seen_count, issues.updated_at, review_runs.repo_name as repo, coalesce(review_runs.branch, '') as branch, review_runs.target, coalesce(review_runs.head, '') as head from issues join review_runs on review_runs.id = issues.run_id${where.length === 0 ? "" : ` where ${where.join(" and ")}`}`, params)
  const queryVector = vectorize(query)
  const terms = [...new Set(tokenize(query))]
  const timestamp = nowSeconds()
  const results = rows.flatMap((row): ReadonlyArray<QueryResult> => {
    const rowTerms = new Set(tokenize(`${row.text} ${row.summary} ${row.fingerprint}`))
    const lexicalScore = terms.length === 0 ? 0 : terms.filter((term) => rowTerms.has(term)).length / terms.length
    const semanticScore = dot(queryVector, vectorize(row.text))
    if (lexicalScore <= 0 && semanticScore < 0.2) return []
    const ageAnchor = row.last_seen_at > 0 ? row.last_seen_at : row.updated_at
    const ageDays = Math.max(0, timestamp - ageAnchor) / 86_400
    const recencyFactor = 1 / (1 + ageDays / 30)
    const frequencyBoost = Math.min(Math.log1p(row.seen_count) / 20, 0.2)
    const { text: _text, updated_at: _updatedAt, ...result } = row
    return [{ ...result, score: round6((semanticScore * 0.72 + lexicalScore * 0.28) * recencyFactor + frequencyBoost), semantic_score: round6(semanticScore), lexical_score: round6(lexicalScore) }]
  }).sort((left, right) => right.score - left.score).slice(0, filters.limit)
  yield* Effect.forEach(results, (result) => sql`update issues set last_seen_at = ${nowSeconds()}, seen_count = seen_count + 1 where id = ${result.id}`, { discard: true })
  return results
})

export const printQueryResults = (results: ReadonlyArray<QueryResult>, json: boolean, showPaths: boolean) => Console.log(json
  ? JSON.stringify(results, null, 2)
  : results.length === 0
  ? "No findings matched."
  : results.flatMap((result) => [
    `${result.decision_id} [${result.status}] score=${result.score} repo=${result.repo} branch=${result.branch} target=${result.target}`,
    `  ${result.summary}`,
    ...(result.fingerprint.length === 0 ? [] : [`  fingerprint: ${result.fingerprint}`]),
    ...(showPaths && result.decision_log_path.length > 0 ? [`  decision log: ${result.decision_log_path}`] : [])
  ]).join("\n"))

export const pruneFindings = Effect.fn("ReviewFindings.pruneFindings")(function*(filters: {
  readonly olderThanDays: number
  readonly minSeenCount: number
  readonly repo?: string
  readonly repoPath?: string
  readonly branch?: string
  readonly includeOpen: boolean
  readonly dryRun: boolean
}) {
  const sql = yield* SqlClient.SqlClient
  const where = ["issues.last_seen_at < ?", "issues.seen_count <= ?"]
  const params: Array<unknown> = [nowSeconds() - Math.floor(filters.olderThanDays * 86_400), filters.minSeenCount]
  if (filters.repoPath !== undefined) { where.push("review_runs.repo_key = ?"); params.push(yield* canonicalRepoKey(filters.repoPath)) }
  else if (filters.repo !== undefined) { where.push("review_runs.repo_name = ?"); params.push(filters.repo) }
  if (filters.branch !== undefined) { where.push("review_runs.branch = ?"); params.push(filters.branch) }
  const candidates = yield* sql.unsafe<IssueIdRow>(`select issues.id, issues.status, coalesce(issues.disposition, '') as disposition, coalesce(issues.owner_resolution, '') as owner_resolution from issues join review_runs on review_runs.id = issues.run_id where ${where.join(" and ")}`, params)
  const issues = filters.includeOpen ? candidates : candidates.filter(isFindingTerminal)
  if (!filters.dryRun) {
    yield* Effect.forEach(issues, ({ id }) => sql`delete from issues where id = ${id}`, { discard: true })
    yield* sql`delete from review_runs where id not in (select distinct run_id from issues) and id not in (select distinct run_id from commands) and id not in (select run_id from review_scope_budgets)`
  }
  return issues.length
})

/**
 * Reports only the stored numbers, never the rule that produced them.
 *
 * The allowance and line metric are frozen when a budget is created. Completed
 * production-only budgets retain their historical output, while unfinished
 * legacy budgets require rebaseline before another check.
 */
const scopeCountsLine = (scope: ScopeBudgetStatus): string => {
  const totalMetric = scope.lineMetric === TOTAL_LOC_LINE_METRIC
  const baseline = totalMetric
    ? humanAuthoredLines(scope.baselineProductionLines, scope.baselineTestLines)
    : scope.baselineProductionLines
  const current = totalMetric
    ? humanAuthoredLines(scope.currentProductionLines, scope.currentTestLines)
    : scope.currentProductionLines
  const maximum = baseline + scope.allowedGrowthLines
  const breakdown = totalMetric
    ? `production=${scope.currentProductionLines} tests=${scope.currentTestLines}`
    : `excluded-tests=${scope.currentTestLines}`
  return `base=${scope.baseRef}@${scope.baseOid.slice(0, 12)} baseline=${baseline} current=${current} growth=${scope.growthLines} allowed-growth=${scope.allowedGrowthLines} maximum=${maximum} ${breakdown} excluded-generated=${scope.currentGeneratedLines}`
}

const pathsAddedLines = (scope: ScopeBudgetStatus): ReadonlyArray<string> => {
  const binaryPaths = new Set(scope.newBinaryProductionPaths)
  const paths = scope.newProductionPaths.filter((path) => !binaryPaths.has(path))
  const heading = scope.lineMetric === TOTAL_LOC_LINE_METRIC
    ? "Human-authored paths added since the baseline (informational):"
    : "Production paths added since the baseline (informational):"
  return paths.length === 0 ? [] : [heading, ...paths.map((path) => `- ${path}`)]
}

const blockingBinaryPathsLines = (scope: ScopeBudgetStatus): ReadonlyArray<string> => {
  if (scope.newBinaryProductionPaths.length === 0) return []
  const heading = scope.lineMetric === TOTAL_LOC_LINE_METRIC
    ? "Binary human-authored paths added since the baseline (require authorization because line growth cannot measure their size):"
    : "Binary production paths added since the baseline (require authorization because line growth cannot measure their size):"
  return [heading, ...scope.newBinaryProductionPaths.map((path) => `- ${path}`)]
}

export const formatReadyScopeBudget = (scope: ScopeBudgetStatus): string => [
  "SCOPE BUDGET READY",
  scopeCountsLine(scope),
  `scope=${scope.scopeSummary}`,
  `authorization=${scope.authorization.length === 0 ? "initial user request" : scope.authorization}`
].join("\n")

export const formatScopeBudgetStatus = (scope: ScopeBudgetStatus): string => [
  `SCOPE BUDGET ${scope.status.toUpperCase()}`,
  scopeCountsLine(scope),
  `scope=${scope.scopeSummary}`,
  `authorization=${scope.authorization.length === 0 ? "initial user request" : scope.authorization}`,
  ...(scope.lastReason.length === 0 ? [] : [`last-reason=${scope.lastReason}`]),
  ...blockingBinaryPathsLines(scope),
  ...pathsAddedLines(scope)
].join("\n")

export const formatScopeBudgetCheck = (check: ScopeBudgetCheck): string => [
  "SCOPE BUDGET OK",
  scopeCountsLine(check),
  `scope=${check.scopeSummary}`,
  `next-work=${check.lastReason}`,
  ...pathsAddedLines(check)
].join("\n")

export const formatReviewFileCoverage = (coverage: ReadonlyArray<ReviewFileCoverage>): string => {
  const priority: Readonly<Record<ReviewFileState, number>> = { stale: 1, unreviewed: 1, "reviewed-once": 2, "reviewed-twice": 3 }
  const lines = ["REVIEW FILE COVERAGE", `files=${coverage.length}`]
  for (const state of REVIEW_FILE_STATES) {
    const files = coverage.filter((file) => file.state === state)
    lines.push(`${state} priority=${priority[state]} count=${files.length}`, ...files.map((file) => `- ${file.path} reviews=${file.reviews}`))
  }
  return lines.join("\n")
}

function formatBlockedScopeBudget(check: ScopeBudgetCheck): string {
  const completed = check.completedFindings.length === 0
    ? ["- none recorded"]
    : check.completedFindings.map((finding) => `- ${finding.decision_id}: ${finding.summary}`)
  return [
    "SCOPE BUDGET BLOCKED",
    scopeCountsLine(check),
    ...blockingBinaryPathsLines(check),
    ...pathsAddedLines(check),
    "Completed review work:",
    ...completed,
    `Why more scope is requested: ${check.lastReason}`,
    "Stop reviewing now.",
    "Tell the user what has been completed, show the measured line overage or unmeasurable binary addition, and explain why the remaining work justifies it.",
    "Ask the user for explicit authorization. Do not review or patch anything else until they answer.",
    "After approval, run scope-authorize with the user's authorization text and the new scope summary, then restart the current review phase."
  ].join("\n")
}

const findingLines = (title: string, findings: ReadonlyArray<CloseoutFinding>, showContext: boolean) => {
  const lines = [title]
  if (findings.length === 0) return [...lines, "- none recorded"]
  for (const finding of findings) {
    const context = [finding.area, finding.severity].filter(Boolean)
    lines.push(`- ${finding.decision_id} [${finding.status}]${hasLegacyEvidence(finding) ? " [legacy evidence]" : ""} ${finding.source}${context.length === 0 ? "" : ` [${context.join(", ")}]`}: ${finding.summary}`)
    if (showContext && finding.finding_kind === "runtime") lines.push(`  risk: ${finding.likelihood}/${finding.impact}; ${finding.disposition}; ${finding.fix_scope}`)
    if (showContext && finding.finding_kind === "maintenance") {
      lines.push(`  review: ${finding.disposition}; ${finding.fix_scope}`)
      if (finding.maintenance_evidence.length > 0) lines.push(`  evidence: ${finding.maintenance_evidence}`)
      if (finding.present_cost.length > 0) lines.push(`  present cost: ${finding.present_cost}`)
    }
    if (showContext && finding.owner_resolution.length > 0) lines.push(`  owner: ${finding.owner_resolution}`)
    if (showContext && finding.contract_evidence.length > 0) lines.push(`  contract: ${finding.contract_evidence}`)
    if (showContext && finding.root_cause.length > 0) lines.push(`  root cause: ${finding.root_cause}`)
    if (showContext && finding.recommended_fix.length > 0) lines.push(`  recommended repair: ${finding.recommended_fix}`)
    if (showContext && finding.intervention_justification.length > 0) lines.push(`  intervention: ${finding.intervention_justification}`)
    if (showContext && finding.rejection_gate.length > 0) lines.push(`  rejected at: ${finding.rejection_gate}`)
    if (showContext && finding.user_impact.length > 0) lines.push(`  why it matters: ${finding.user_impact}`)
    if (showContext && finding.status === "fixed" && finding.decision.length > 0) lines.push(`  change: ${finding.decision}`)
    if (finding.status === "deferred" && finding.decision.length > 0) lines.push(`  decision: ${finding.decision}`)
  }
  return lines
}

const countLabels = (labels: ReadonlyArray<string>): ReadonlyArray<CloseoutCount> => {
  const counts = new Map<string, number>()
  for (const rawLabel of labels) {
    const label = normalizeToken(rawLabel.length === 0 ? "unspecified" : rawLabel)
    counts.set(label, (counts.get(label) ?? 0) + 1)
  }
  return [...counts].map(([label, count]) => ({ label, count })).sort((left, right) => right.count - left.count || left.label.localeCompare(right.label))
}

const severityRanks: Readonly<Record<string, number>> = { p0: 0, p1: 1, p2: 2, p3: 3 }
const compareFindings = (left: CloseoutFinding, right: CloseoutFinding) => {
  const severity = (severityRanks[normalizeToken(left.severity)] ?? 5) - (severityRanks[normalizeToken(right.severity)] ?? 5)
  return severity !== 0 ? severity : left.decision_id.localeCompare(right.decision_id)
}
const commandResultLabel = (result: string) => {
  const label = result.trim().split(/[\s:]/u)[0] ?? ""
  return normalizeToken(label.length === 0 ? "unspecified" : label)
}

export const summarizeCloseout = (closeout: Closeout, limit: number): CloseoutSummary => {
  const acceptedResidualRisk = closeout.findings_found.filter((finding) => finding.disposition === "residual").sort(compareFindings)
  const deferredWork = [...closeout.deferred_work].sort(compareFindings)
  const important = closeout.material_findings.filter((finding) => finding.disposition !== "residual" && !isDeferredWork(finding) && isFindingTerminal(finding)).sort(compareFindings)
  const stillOpen = [...closeout.still_open].sort(compareFindings)
  return {
    total_findings: closeout.findings_found.length,
    material_findings: closeout.material_findings.length,
    lower_risk_findings: closeout.lower_risk_findings.length,
    status_counts: countLabels(closeout.findings_found.map((finding) => finding.status)),
    source_counts: countLabels(closeout.findings_found.map((finding) => finding.source)),
    source_disposition_counts: countLabels(closeout.review_candidates.map((finding) => `${finding.source}:${finding.disposition}`)),
    rejection_gate_counts: countLabels(closeout.review_candidates.filter((finding) => finding.rejection_gate.length > 0).map((finding) => finding.rejection_gate)),
    area_counts: countLabels(closeout.findings_found.map((finding) => finding.area)),
    severity_counts: countLabels(closeout.findings_found.map((finding) => finding.severity)),
    important_findings: important.slice(0, limit),
    important_findings_total: important.length,
    accepted_residual_risk: acceptedResidualRisk.slice(0, limit),
    accepted_residual_risk_total: acceptedResidualRisk.length,
    deferred_work: deferredWork.slice(0, limit),
    deferred_work_total: deferredWork.length,
    still_open: stillOpen.slice(0, limit),
    still_open_total: stillOpen.length,
    verification_counts: countLabels(closeout.verification_run.map((command) => commandResultLabel(command.result))),
    verification_total: closeout.verification_run.length,
    ...(closeout.scope_budget === undefined ? {} : { scope_budget: closeout.scope_budget })
  }
}

const readableCount = ({ label, count }: CloseoutCount) => `${count} ${label.replaceAll("-", " ")}`
const countLine = (title: string, counts: ReadonlyArray<CloseoutCount>) => `- ${title}: ${counts.length === 0 ? "none" : counts.map(readableCount).join(", ")}`
const limitedFindingLines = (title: string, findings: ReadonlyArray<CloseoutFinding>, total: number) => [
  `${title} (${findings.length} of ${total} shown)`,
  ...(findings.length === 0 ? ["- none"] : findingLines("", findings, true).slice(1))
]

const printSummary = (summary: CloseoutSummary) => {
  const lines = [
    "Review summary",
    `- Findings: ${summary.total_findings} total; ${summary.material_findings} material; ${summary.lower_risk_findings} lower risk`,
    countLine("Status", summary.status_counts),
    countLine("Sources", summary.source_counts),
    countLine("Source outcomes", summary.source_disposition_counts),
    countLine("Rejection gates", summary.rejection_gate_counts),
    countLine("Areas", summary.area_counts),
    countLine("Severity", summary.severity_counts), "",
    ...limitedFindingLines("Important resolved findings", summary.important_findings, summary.important_findings_total), "",
    ...limitedFindingLines("Accepted residual risk", summary.accepted_residual_risk, summary.accepted_residual_risk_total), "",
    ...limitedFindingLines("Deferred work", summary.deferred_work, summary.deferred_work_total), "",
    ...limitedFindingLines("Still open", summary.still_open, summary.still_open_total), "",
    "Verification summary",
    `- Commands: ${summary.verification_total}`,
    countLine("Results", summary.verification_counts), "",
    "Scope budget",
    ...(summary.scope_budget === undefined ? ["- not recorded"] : formatScopeBudgetStatus(summary.scope_budget).split("\n").map((line) => `- ${line}`))
  ]
  return Console.log(lines.join("\n"))
}

export type CloseoutView = "full" | "material" | "summary"

export const printCloseout = (closeout: Closeout, json: boolean, view: CloseoutView, summaryLimit: number) => Effect.gen(function*() {
  if (view === "summary") {
    const summary = summarizeCloseout(closeout, summaryLimit)
    if (json) return yield* Console.log(JSON.stringify(summary, null, 2))
    return yield* printSummary(summary)
  }
  if (json) return yield* Console.log(JSON.stringify(closeout, null, 2))
  const lines = [
    "Scope budget",
    ...(closeout.scope_budget === undefined ? ["- not recorded"] : formatScopeBudgetStatus(closeout.scope_budget).split("\n").map((line) => `- ${line}`)), "",
    ...findingLines("Material findings", closeout.material_findings, true), "",
    ...findingLines("User-visible or workflow changes", closeout.user_visible_or_workflow_changes, true), "",
    ...findingLines("Security, data, and permission changes", closeout.security_data_permission_changes, true), ""
  ]
  if (view === "full") {
    lines.push(...findingLines("Lower-risk findings", closeout.lower_risk_findings, false), "")
    lines.push("Candidates reviewed", ...(closeout.review_candidates.length === 0
      ? ["- none recorded"]
      : closeout.review_candidates.map((finding) => `- ${finding.decision_id} [${finding.status}]${hasLegacyEvidence(finding) ? " [legacy evidence]" : ""} ${finding.source}: ${finding.summary}`)), "")
    lines.push("Changes made while reviewing", ...(closeout.changes_made_while_reviewing.length === 0
      ? ["- none recorded"]
      : closeout.changes_made_while_reviewing.map((finding) => `- ${finding.decision_id}: ${finding.decision}`)), "")
  }
  const verification = closeout.verification_run.length === 0
    ? ["- none recorded"]
    : closeout.verification_run.map((command) => `- \`${command.command}\` -> ${command.result}${command.decision_id.length === 0 ? "" : ` (${command.decision_id})`}: ${command.reason}`)
  const stillOpen = closeout.still_open.length === 0
    ? ["- none recorded"]
    : closeout.still_open.flatMap((finding) => [
      `- ${finding.decision_id} [${finding.status}]: ${finding.summary}`,
      ...(finding.user_impact.length === 0 ? [] : [`  why it matters: ${finding.user_impact}`])
    ])
  lines.push(...findingLines("Deferred work", closeout.deferred_work, true), "", "Verification run", ...verification, "", "Still open", ...stillOpen)
  yield* Console.log(lines.join("\n"))
})
