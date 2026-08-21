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

export interface Finding {
  readonly decisionId: string
  readonly status: string
  readonly source: string
  readonly fingerprint: string
  readonly summary: string
  readonly impact: string
  readonly priority: string
  readonly material: boolean
  readonly userImpact: string
  readonly decision: string
  readonly text: string
}

export interface RecordedCommand {
  readonly command: string
  readonly result: string
  readonly reason: string
  readonly decisionId: string
}

interface RunRow { readonly id: string }
interface IdRow { readonly id: string }
interface SequenceRow { readonly sequence: number }
interface TableInfoRow { readonly name: string }
interface RepoKeyRow { readonly id: string; readonly repo_path: string; readonly repo_key: string }
export interface CloseoutFinding {
  readonly decision_id: string
  readonly status: string
  readonly source: string
  readonly summary: string
  readonly impact: string
  readonly priority: string
  readonly material: boolean
  readonly user_impact: string
  readonly decision: string
  readonly fingerprint: string
}
interface CloseoutFindingRow extends Omit<CloseoutFinding, "material"> { readonly material: number }
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
interface IssueIdRow { readonly id: string }
interface ScopeBudgetRow {
  readonly run_id: string
  readonly generation: number
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
interface UnresolvedFindingRow { readonly decision_id: string; readonly status: string; readonly summary: string }
interface ActiveScopeRow { readonly run_id: string; readonly target: string }
interface ScopeStatusRow { readonly status: string }

export interface ScopeBudgetStatus {
  readonly runId: string
  readonly generation: number
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
  readonly maximumProductionLines: number
  readonly completedFindings: ReadonlyArray<FixedFindingRow>
  readonly blocked: boolean
}

export const DEFAULT_SCOPE_GROWTH_PERCENT = 30

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

export class ScopeBudgetBlocked extends Error {
  readonly _tag = "ScopeBudgetBlocked"
  readonly check: ScopeBudgetCheck
  constructor(check: ScopeBudgetCheck) {
    super(formatBlockedScopeBudget(check))
    this.check = check
  }
}

export interface Closeout {
  readonly material_findings: ReadonlyArray<CloseoutFinding>
  readonly user_visible_or_workflow_changes: ReadonlyArray<CloseoutFinding>
  readonly security_data_permission_changes: ReadonlyArray<CloseoutFinding>
  readonly lower_risk_findings: ReadonlyArray<CloseoutFinding>
  readonly findings_found: ReadonlyArray<CloseoutFinding>
  readonly changes_made_while_reviewing: ReadonlyArray<CloseoutFinding>
  readonly verification_run: ReadonlyArray<CommandRow>
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
  readonly impact_counts: ReadonlyArray<CloseoutCount>
  readonly priority_counts: ReadonlyArray<CloseoutCount>
  readonly important_findings: ReadonlyArray<CloseoutFinding>
  readonly important_findings_total: number
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
const userVisibleImpacts = new Set(["ui", "ux", "workflow", "user-workflow", "behavior", "route-behavior", "api-contract", "contract", "product"])
const sensitiveImpacts = new Set(["permission", "permissions", "auth", "authorization", "privacy", "security", "finance", "billing", "payroll", "data", "data-correctness", "audit", "history", "migration", "schema"])
const materialPriorities = new Set(["p0", "p1", "critical", "high"])
const isUserVisible = (impact: string) => userVisibleImpacts.has(normalizeToken(impact))
const isSensitive = (impact: string) => sensitiveImpacts.has(normalizeToken(impact))
const isMaterial = (finding: Pick<CloseoutFinding, "material" | "impact" | "priority">) => finding.material || isUserVisible(finding.impact) || isSensitive(finding.impact) || materialPriorities.has(normalizeToken(finding.priority))

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
    `create table if not exists issues (id text primary key, run_id text not null references review_runs(id) on delete cascade, decision_id text not null, status text not null, source text not null, fingerprint text not null, summary text not null, impact text, priority text, material integer not null default 0, user_impact text, decision text, text text not null, decision_log_path text, first_seen_at integer, last_seen_at integer, seen_count integer not null default 1, updated_at integer not null, unique(run_id, decision_id))`,
    `create table if not exists commands (id text primary key, run_id text not null references review_runs(id) on delete cascade, command text not null, result text not null, reason text not null, decision_id text, updated_at integer not null)`,
    `create table if not exists review_scope_budgets (run_id text primary key references review_runs(id) on delete cascade, generation integer not null default 0, base_ref text not null, base_oid text not null, pinned_head_oid text not null default '', limit_percent integer not null, scope_summary text not null, authorization text not null default '', baseline_production_lines integer not null, baseline_test_lines integer not null, baseline_generated_lines integer not null, baseline_paths_json text not null, baseline_binary_paths_json text not null default '[]', status text not null, current_production_lines integer not null, current_test_lines integer not null, current_generated_lines integer not null, growth_lines integer not null, allowed_growth_lines integer not null, new_production_paths_json text not null, new_binary_production_paths_json text not null default '[]', last_reason text not null default '', started_at integer not null, updated_at integer not null)`,
    `create table if not exists review_scope_locks (repo_key text not null, branch text not null, run_id text not null references review_runs(id) on delete cascade, primary key(repo_key, branch), unique(run_id))`,
    `create table if not exists review_scope_events (id integer primary key autoincrement, run_id text not null references review_runs(id) on delete cascade, event text not null, baseline_production_lines integer not null, current_production_lines integer not null, allowed_growth_lines integer not null, new_production_paths_json text not null, reason text not null, scope_summary text not null, authorization text not null, created_at integer not null)`
  ]
  yield* Effect.forEach(tables, (statement) => sql.unsafe(statement), { discard: true })
  const columns = [
    ["review_runs", "repo_key", "text"], ["review_runs", "branch", "text"], ["review_runs", "update_seq", "integer not null default 0"],
    ["issues", "first_seen_at", "integer"], ["issues", "last_seen_at", "integer"], ["issues", "seen_count", "integer not null default 1"],
    ["issues", "impact", "text"], ["issues", "priority", "text"], ["issues", "material", "integer not null default 0"], ["issues", "user_impact", "text"],
    ["review_scope_budgets", "generation", "integer not null default 0"], ["review_scope_budgets", "pinned_head_oid", "text not null default ''"], ["review_scope_budgets", "baseline_binary_paths_json", "text not null default '[]'"], ["review_scope_budgets", "new_binary_production_paths_json", "text not null default '[]'"]
  ] as const
  for (const [table, column, definition] of columns) {
    const existing = yield* sql.unsafe<TableInfoRow>(`pragma table_info(${table})`)
    if (!existing.some((row) => row.name === column)) {
      yield* sql.unsafe(`alter table ${table} add column ${column} ${definition}`)
      if (column === "baseline_binary_paths_json") yield* sql.unsafe(`update review_scope_budgets
        set status = 'rebaseline-required',
            last_reason = 'Binary baseline data was unavailable after upgrade; explicit rebaseline is required.' ||
              case when trim(coalesce(last_reason, '')) = '' then '' else ' Previous state: ' || last_reason end
        where status != 'complete'`)
    }
  }
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
    `create index if not exists review_scope_events_run_idx on review_scope_events(run_id)`
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

const readScopeBudget = Effect.fn("ReviewFindings.readScopeBudget")(function*(runId: string) {
  const sql = yield* SqlClient.SqlClient
  const rows = yield* sql<ScopeBudgetRow>`select * from review_scope_budgets where run_id = ${runId}`
  const row = rows[0]
  if (row === undefined) return yield* Effect.fail(new MissingScopeBudget())
  const baselinePaths = yield* Schema.decodeUnknownEffect(ScopePathsJson)(row.baseline_paths_json)
  const baselineBinaryPaths = yield* Schema.decodeUnknownEffect(ScopePathsJson)(row.baseline_binary_paths_json)
  const newProductionPaths = yield* Schema.decodeUnknownEffect(ScopePathsJson)(row.new_production_paths_json)
  const newBinaryProductionPaths = yield* Schema.decodeUnknownEffect(ScopePathsJson)(row.new_binary_production_paths_json)
  return {
    runId: row.run_id,
    generation: row.generation,
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

const writeScopeEvent = Effect.fn("ReviewFindings.writeScopeEvent")(function*(input: {
  readonly runId: string
  readonly event: string
  readonly baselineProductionLines: number
  readonly currentProductionLines: number
  readonly allowedGrowthLines: number
  readonly newProductionPaths: ReadonlyArray<string>
  readonly reason: string
  readonly scopeSummary: string
  readonly authorization: string
}) {
  const sql = yield* SqlClient.SqlClient
  yield* sql`insert into review_scope_events (run_id, event, baseline_production_lines, current_production_lines, allowed_growth_lines, new_production_paths_json, reason, scope_summary, authorization, created_at)
    values (${input.runId}, ${input.event}, ${input.baselineProductionLines}, ${input.currentProductionLines}, ${input.allowedGrowthLines}, ${JSON.stringify(input.newProductionPaths)}, ${input.reason}, ${input.scopeSummary}, ${input.authorization}, ${nowSeconds()})`
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
  const measurement = yield* measureScopeDiff(run.repoPath, baseOid, targetOid)
  const allowedGrowthLines = Math.floor(measurement.production.changedLines * input.limitPercent / 100)
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
    insert into review_scope_budgets (run_id, generation, base_ref, base_oid, pinned_head_oid, limit_percent, scope_summary, authorization, baseline_production_lines, baseline_test_lines, baseline_generated_lines, baseline_paths_json, baseline_binary_paths_json, status, current_production_lines, current_test_lines, current_generated_lines, growth_lines, allowed_growth_lines, new_production_paths_json, new_binary_production_paths_json, last_reason, started_at, updated_at)
    values (${runId}, 0, ${run.base}, ${baseOid}, ${pinnedHeadOid}, ${input.limitPercent}, ${input.scopeSummary}, ${input.authorization}, ${measurement.production.changedLines}, ${measurement.tests.changedLines}, ${measurement.generated.changedLines}, ${JSON.stringify(measurement.productionPaths)}, ${JSON.stringify(measurement.productionBinaryPaths)}, 'ready', ${measurement.production.changedLines}, ${measurement.tests.changedLines}, ${measurement.generated.changedLines}, 0, ${allowedGrowthLines}, '[]', '[]', '', ${timestamp}, ${timestamp})
    on conflict(run_id) do update set
      generation=review_scope_budgets.generation + 1, base_ref=excluded.base_ref, base_oid=excluded.base_oid, pinned_head_oid=excluded.pinned_head_oid, limit_percent=excluded.limit_percent, scope_summary=excluded.scope_summary,
      authorization=excluded.authorization, baseline_production_lines=excluded.baseline_production_lines,
      baseline_test_lines=excluded.baseline_test_lines, baseline_generated_lines=excluded.baseline_generated_lines,
      baseline_paths_json=excluded.baseline_paths_json, baseline_binary_paths_json=excluded.baseline_binary_paths_json, status='ready', current_production_lines=excluded.current_production_lines,
      current_test_lines=excluded.current_test_lines, current_generated_lines=excluded.current_generated_lines,
      growth_lines=0, allowed_growth_lines=excluded.allowed_growth_lines, new_production_paths_json='[]', new_binary_production_paths_json='[]',
      last_reason='', updated_at=excluded.updated_at`
  yield* writeScopeEvent({
    runId,
    event: input.event,
    baselineProductionLines: measurement.production.changedLines,
    currentProductionLines: measurement.production.changedLines,
    allowedGrowthLines,
    newProductionPaths: [],
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
  const measurement: ScopeMeasurement = yield* measureScopeDiff(run.repoPath, budget.baseOid, budget.pinnedHeadOid.length === 0 ? "HEAD" : budget.pinnedHeadOid)
  const baselinePaths = new Set(budget.baselinePaths)
  const newProductionPaths = measurement.productionPaths.filter((path) => !baselinePaths.has(path))
  const baselineBinaryPaths = new Set(budget.baselineBinaryPaths)
  const newBinaryProductionPaths = measurement.productionBinaryPaths.filter((path) => !baselineBinaryPaths.has(path))
  const growthLines = Math.max(0, measurement.production.changedLines - budget.baselineProductionLines)
  const maximumProductionLines = budget.baselineProductionLines + budget.allowedGrowthLines
  const blocked = measurement.production.changedLines > maximumProductionLines || newBinaryProductionPaths.length > 0
  const status = blocked ? "blocked" : "ok"
  const timestamp = nowSeconds()
  return yield* sql.withTransaction(Effect.gen(function*() {
  const current = yield* readScopeBudget(budget.runId)
  if (current.generation !== budget.generation || current.status !== budget.status) {
    return yield* Effect.fail(new InvalidScopeBudget("scope budget changed while scope-check was measuring; rerun scope-check for the current state"))
  }
  yield* sql`update review_scope_budgets set generation = generation + 1, status = ${status}, current_production_lines = ${measurement.production.changedLines}, current_test_lines = ${measurement.tests.changedLines}, current_generated_lines = ${measurement.generated.changedLines}, growth_lines = ${growthLines}, new_production_paths_json = ${JSON.stringify(newProductionPaths)}, new_binary_production_paths_json = ${JSON.stringify(newBinaryProductionPaths)}, last_reason = ${reason}, updated_at = ${timestamp} where run_id = ${budget.runId}`
  yield* writeScopeEvent({
    runId: budget.runId,
    event: blocked ? "blocked" : "checked",
    baselineProductionLines: budget.baselineProductionLines,
    currentProductionLines: measurement.production.changedLines,
    allowedGrowthLines: budget.allowedGrowthLines,
    newProductionPaths,
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
    newProductionPaths,
    newBinaryProductionPaths,
    lastReason: reason,
    maximumProductionLines,
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
    const unresolved = yield* sql<UnresolvedFindingRow>`select decision_id, status, summary from issues where run_id = ${check.runId} and status not in ('fixed', 'rejected', 'deferred') order by decision_id`
    if (unresolved.length > 0) {
      const findings = unresolved.map((finding) => `${finding.decision_id} [${finding.status}]: ${finding.summary}`).join("\n")
      return yield* Effect.fail(new InvalidScopeBudget(`scope-complete requires every finding to be fixed, rejected, or explicitly deferred; resolve these findings first:\n${findings}`))
    }
    yield* sql`update review_scope_budgets set generation = generation + 1, status = 'complete', last_reason = ${reason}, updated_at = ${nowSeconds()} where run_id = ${check.runId}`
    yield* sql`delete from review_scope_locks where run_id = ${check.runId}`
    yield* writeScopeEvent({
    runId: check.runId,
    event: "complete",
    baselineProductionLines: check.baselineProductionLines,
    currentProductionLines: check.currentProductionLines,
    allowedGrowthLines: check.allowedGrowthLines,
    newProductionPaths: [],
    reason,
    scopeSummary: check.scopeSummary,
    authorization: check.authorization
    })
    return { ...check, generation: check.generation + 1, status: "complete", lastReason: reason }
  }))
})

export const recordFinding = Effect.fn("ReviewFindings.recordFinding")(function*(run: ReviewRun, input: Finding) {
  const sql = yield* SqlClient.SqlClient
  return yield* sql.withTransaction(Effect.gen(function*() {
  const runId = yield* upsertRun(run)
  const scope = yield* sql<ScopeStatusRow>`select status from review_scope_budgets where run_id = ${runId}`
  if (scope[0]?.status === "complete") {
    return yield* Effect.fail(new InvalidScopeBudget("scope budget is complete and terminal; start a new user-authorized review before recording more findings"))
  }
  const existingIssues = yield* sql<IdRow>`select id from issues where run_id = ${runId} and decision_id = ${input.decisionId} limit 1`
  const issueId = existingIssues[0]?.id ?? stableId([runId, input.decisionId])
  const timestamp = nowSeconds()
  const impact = normalizeToken(input.impact)
  const priority = normalizeToken(input.priority)
  const material = input.material || isUserVisible(impact) || isSensitive(impact) || materialPriorities.has(priority)
  const text = [input.decisionId, input.status, input.source, input.fingerprint, input.summary, impact, priority, input.userImpact, input.decision, input.text].filter(Boolean).join(" ")
  yield* sql`
    insert into issues (id, run_id, decision_id, status, source, fingerprint, summary, impact, priority, material, user_impact, decision, text, decision_log_path, first_seen_at, last_seen_at, seen_count, updated_at)
    values (${issueId}, ${runId}, ${input.decisionId}, ${normalizeStatus(input.status)}, ${input.source}, ${input.fingerprint}, ${input.summary}, ${impact}, ${priority}, ${material ? 1 : 0}, ${input.userImpact}, ${input.decision}, ${text}, ${run.decisionLog}, ${timestamp}, ${timestamp}, 1, ${timestamp})
    on conflict(id) do update set
      run_id=excluded.run_id, decision_id=excluded.decision_id, status=excluded.status,
      source=excluded.source, fingerprint=excluded.fingerprint, summary=excluded.summary,
      impact=excluded.impact, priority=excluded.priority, material=excluded.material,
      user_impact=excluded.user_impact, decision=excluded.decision, text=excluded.text,
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
  const runs = yield* sql.unsafe<RunRow>(`select id from review_runs where ${where.join(" and ")} order by update_seq desc, updated_at desc, rowid desc limit 1`, params)
  const runId = runs[0]?.id
  const findingRows = runId === undefined ? [] : yield* sql<CloseoutFindingRow>`select decision_id, status, source, summary, coalesce(impact, '') as impact, coalesce(priority, '') as priority, coalesce(material, 0) as material, coalesce(user_impact, '') as user_impact, coalesce(decision, '') as decision, fingerprint from issues where run_id = ${runId} order by decision_id`
  const findings: ReadonlyArray<CloseoutFinding> = findingRows.map((finding) => ({ ...finding, material: finding.material !== 0 }))
  const commands = runId === undefined ? [] : yield* sql<CommandRow>`select command, result, reason, coalesce(decision_id, '') as decision_id from commands where run_id = ${runId} order by updated_at, command`
  const scopeBudget = runId === undefined ? Option.none() : yield* readScopeBudget(runId).pipe(Effect.option)
  return {
    material_findings: findings.filter(isMaterial),
    user_visible_or_workflow_changes: findings.filter((finding) => isUserVisible(finding.impact)),
    security_data_permission_changes: findings.filter((finding) => isSensitive(finding.impact)),
    lower_risk_findings: findings.filter((finding) => !isMaterial(finding)),
    findings_found: findings,
    changes_made_while_reviewing: findings.filter((finding) => finding.status === "fixed"),
    verification_run: commands,
    still_open: findings.filter((finding) => ["open", "deferred", "provisional", "reopened"].includes(finding.status)),
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
  if (!filters.includeOpen) where.push("issues.status not in ('open', 'deferred', 'provisional', 'reopened')")
  if (filters.repoPath !== undefined) { where.push("review_runs.repo_key = ?"); params.push(yield* canonicalRepoKey(filters.repoPath)) }
  else if (filters.repo !== undefined) { where.push("review_runs.repo_name = ?"); params.push(filters.repo) }
  if (filters.branch !== undefined) { where.push("review_runs.branch = ?"); params.push(filters.branch) }
  const issues = yield* sql.unsafe<IssueIdRow>(`select issues.id from issues join review_runs on review_runs.id = issues.run_id where ${where.join(" and ")}`, params)
  if (!filters.dryRun) {
    yield* Effect.forEach(issues, ({ id }) => sql`delete from issues where id = ${id}`, { discard: true })
    yield* sql`delete from review_runs where id not in (select distinct run_id from issues) and id not in (select distinct run_id from commands) and id not in (select run_id from review_scope_budgets)`
  }
  return issues.length
})

const scopeCountsLine = (scope: ScopeBudgetStatus): string => {
  const maximum = scope.baselineProductionLines + scope.allowedGrowthLines
  return `base=${scope.baseRef}@${scope.baseOid.slice(0, 12)} baseline=${scope.baselineProductionLines} current=${scope.currentProductionLines} growth=${scope.growthLines} allowed-growth=${scope.allowedGrowthLines} maximum=${maximum} limit=${scope.limitPercent}% excluded-tests=${scope.currentTestLines} excluded-generated=${scope.currentGeneratedLines}`
}

const productionPathsAddedLines = (scope: ScopeBudgetStatus): ReadonlyArray<string> => {
  const binaryPaths = new Set(scope.newBinaryProductionPaths)
  const paths = scope.newProductionPaths.filter((path) => !binaryPaths.has(path))
  return paths.length === 0 ? [] : ["Production paths added since the baseline (informational):", ...paths.map((path) => `- ${path}`)]
}

const blockingBinaryPathsLines = (check: ScopeBudgetStatus): ReadonlyArray<string> => check.newBinaryProductionPaths.length === 0
  ? []
  : ["Binary production paths added since the baseline (require authorization because line growth cannot measure their size):", ...check.newBinaryProductionPaths.map((path) => `- ${path}`)]

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
  ...productionPathsAddedLines(scope)
].join("\n")

export const formatScopeBudgetCheck = (check: ScopeBudgetCheck): string => [
  "SCOPE BUDGET OK",
  scopeCountsLine(check),
  `scope=${check.scopeSummary}`,
  `next-work=${check.lastReason}`,
  ...productionPathsAddedLines(check)
].join("\n")

function formatBlockedScopeBudget(check: ScopeBudgetCheck): string {
  const completed = check.completedFindings.length === 0
    ? ["- none recorded"]
    : check.completedFindings.map((finding) => `- ${finding.decision_id}: ${finding.summary}`)
  return [
    "SCOPE BUDGET BLOCKED",
    scopeCountsLine(check),
    ...blockingBinaryPathsLines(check),
    ...productionPathsAddedLines(check),
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
    const context = [finding.impact, finding.priority].filter(Boolean)
    lines.push(`- ${finding.decision_id} [${finding.status}] ${finding.source}${context.length === 0 ? "" : ` [${context.join(", ")}]`}: ${finding.summary}`)
    if (showContext && finding.user_impact.length > 0) lines.push(`  why it matters: ${finding.user_impact}`)
    if (showContext && finding.status === "fixed" && finding.decision.length > 0) lines.push(`  change: ${finding.decision}`)
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

const priorityRanks: Readonly<Record<string, number>> = { p0: 0, critical: 0, p1: 1, high: 1, p2: 2, medium: 2, p3: 3, low: 3, p4: 4 }
const compareFindings = (left: CloseoutFinding, right: CloseoutFinding) => {
  const priority = (priorityRanks[normalizeToken(left.priority)] ?? 5) - (priorityRanks[normalizeToken(right.priority)] ?? 5)
  return priority !== 0 ? priority : left.decision_id.localeCompare(right.decision_id)
}
const commandResultLabel = (result: string) => {
  const label = result.trim().split(/[\s:]/u)[0] ?? ""
  return normalizeToken(label.length === 0 ? "unspecified" : label)
}

export const summarizeCloseout = (closeout: Closeout, limit: number): CloseoutSummary => {
  const important = closeout.material_findings.filter((finding) => !["open", "deferred", "provisional", "reopened"].includes(finding.status)).sort(compareFindings)
  const stillOpen = [...closeout.still_open].sort(compareFindings)
  return {
    total_findings: closeout.findings_found.length,
    material_findings: closeout.material_findings.length,
    lower_risk_findings: closeout.lower_risk_findings.length,
    status_counts: countLabels(closeout.findings_found.map((finding) => finding.status)),
    source_counts: countLabels(closeout.findings_found.map((finding) => finding.source)),
    impact_counts: countLabels(closeout.findings_found.map((finding) => finding.impact)),
    priority_counts: countLabels(closeout.findings_found.map((finding) => finding.priority)),
    important_findings: important.slice(0, limit),
    important_findings_total: important.length,
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
    countLine("Areas", summary.impact_counts),
    countLine("Priorities", summary.priority_counts), "",
    ...limitedFindingLines("Important resolved findings", summary.important_findings, summary.important_findings_total), "",
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
    lines.push("Findings found", ...(closeout.findings_found.length === 0
      ? ["- none recorded"]
      : closeout.findings_found.map((finding) => `- ${finding.decision_id} [${finding.status}] ${finding.source}: ${finding.summary}`)), "")
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
  lines.push("Verification run", ...verification, "", "Still open", ...stillOpen)
  yield* Console.log(lines.join("\n"))
})
