import { createHash } from "node:crypto"
import { Console, Effect, FileSystem, Path } from "effect"
import * as SqlClient from "effect/unstable/sql/SqlClient"

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
interface SequenceRow { readonly sequence: number }
interface ExistingIssueRow {
  readonly first_seen_at: number | null
  readonly seen_count: number | null
}
export interface CloseoutFinding {
  readonly decision_id: string
  readonly status: string
  readonly source: string
  readonly summary: string
  readonly impact: string
  readonly priority: string
  readonly material: number
  readonly user_impact: string
  readonly decision: string
  readonly fingerprint: string
}
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
  readonly last_seen_at: number
  readonly seen_count: number
  readonly decision_log_path: string
}
interface QueryRow extends Omit<QueryResult, "score"> {
  readonly text: string
}
interface IssueIdRow { readonly id: string }

export interface Closeout {
  readonly material_findings: ReadonlyArray<CloseoutFinding>
  readonly user_visible_or_workflow_changes: ReadonlyArray<CloseoutFinding>
  readonly security_data_permission_changes: ReadonlyArray<CloseoutFinding>
  readonly lower_risk_findings: ReadonlyArray<CloseoutFinding>
  readonly findings_found: ReadonlyArray<CloseoutFinding>
  readonly changes_made_while_reviewing: ReadonlyArray<CloseoutFinding>
  readonly verification_run: ReadonlyArray<CommandRow>
  readonly still_open: ReadonlyArray<CloseoutFinding>
}

const nowSeconds = () => Math.floor(Date.now() / 1_000)
const stableId = (parts: ReadonlyArray<string>) => createHash("sha256").update(parts.join("\0")).digest("hex").slice(0, 24)
const normalizeToken = (value: string) => value.trim().toLowerCase().replaceAll("_", "-")
const normalizeStatus = (value: string) => {
  const status = normalizeToken(value)
  return status === "adopted" ? "fixed" : status === "scoped" ? "deferred" : status
}
const userVisibleImpacts = new Set(["ui", "ux", "workflow", "user-workflow", "behavior", "route-behavior", "api-contract", "contract", "product"])
const sensitiveImpacts = new Set(["permission", "permissions", "auth", "authorization", "privacy", "security", "finance", "billing", "payroll", "data", "data-correctness", "audit", "history", "migration", "schema"])
const materialPriorities = new Set(["p0", "p1", "critical", "high"])
const isUserVisible = (impact: string) => userVisibleImpacts.has(normalizeToken(impact))
const isSensitive = (impact: string) => sensitiveImpacts.has(normalizeToken(impact))
const isMaterial = (finding: Pick<CloseoutFinding, "material" | "impact" | "priority">) => finding.material !== 0 || isUserVisible(finding.impact) || isSensitive(finding.impact) || materialPriorities.has(normalizeToken(finding.priority))

export const canonicalRepoKey = Effect.fn("ReviewFindings.canonicalRepoKey")(function*(repoPath: string) {
  const fs = yield* FileSystem.FileSystem
  const paths = yield* Path.Path
  const resolved = paths.resolve(repoPath)
  return yield* fs.realPath(resolved).pipe(Effect.catch(() => Effect.succeed(resolved)))
})

export const initialize = Effect.fn("ReviewFindings.initialize")(function*() {
  const sql = yield* SqlClient.SqlClient
  const statements = [
    `create table if not exists review_runs (id text primary key, repo_name text not null, repo_key text not null, repo_path text not null, branch text, target text not null, base text, head text, status text not null, decision_log_path text, started_at integer, update_seq integer not null default 0, updated_at integer not null)`,
    `create table if not exists issues (id text primary key, run_id text not null references review_runs(id) on delete cascade, decision_id text not null, status text not null, source text not null, fingerprint text not null, summary text not null, impact text, priority text, material integer not null default 0, user_impact text, decision text, text text not null, decision_log_path text, first_seen_at integer, last_seen_at integer, seen_count integer not null default 1, updated_at integer not null, unique(run_id, decision_id))`,
    `create table if not exists commands (id text primary key, run_id text not null references review_runs(id) on delete cascade, command text not null, result text not null, reason text not null, decision_id text, updated_at integer not null)`,
    `create index if not exists review_runs_repo_idx on review_runs(repo_name)`,
    `create index if not exists review_runs_repo_key_idx on review_runs(repo_key)`,
    `create index if not exists review_runs_branch_idx on review_runs(branch)`,
    `create index if not exists issues_run_idx on issues(run_id)`,
    `create index if not exists issues_status_idx on issues(status)`,
    `create index if not exists commands_run_idx on commands(run_id)`
  ]
  yield* Effect.forEach(statements, (statement) => sql.unsafe(statement), { discard: true })
})

const nextSequence = Effect.fn("ReviewFindings.nextSequence")(function*() {
  const sql = yield* SqlClient.SqlClient
  const rows = yield* sql<SequenceRow>`select coalesce(max(update_seq), 0) + 1 as sequence from review_runs`
  return rows[0]?.sequence ?? 1
})

const upsertRun = Effect.fn("ReviewFindings.upsertRun")(function*(run: ReviewRun) {
  const sql = yield* SqlClient.SqlClient
  const repoKey = yield* canonicalRepoKey(run.repoPath)
  const runId = stableId([repoKey, run.branch, run.target, run.base])
  const timestamp = nowSeconds()
  const updateSequence = yield* nextSequence()
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

const latestRun = Effect.fn("ReviewFindings.latestRun")(function*(run: Pick<ReviewRun, "repoPath" | "branch" | "target">) {
  const sql = yield* SqlClient.SqlClient
  const repoKey = yield* canonicalRepoKey(run.repoPath)
  const rows = yield* sql<RunRow>`select id from review_runs where repo_key = ${repoKey} and coalesce(branch, '') = ${run.branch} and target = ${run.target} order by update_seq desc, updated_at desc, rowid desc limit 1`
  return rows[0]?.id
})

export const recordFinding = Effect.fn("ReviewFindings.recordFinding")(function*(run: ReviewRun, input: Finding) {
  const sql = yield* SqlClient.SqlClient
  const runId = yield* upsertRun(run)
  const issueId = stableId([runId, input.decisionId])
  const timestamp = nowSeconds()
  const existing = yield* sql<ExistingIssueRow>`select first_seen_at, seen_count from issues where id = ${issueId}`
  const firstSeen = existing[0]?.first_seen_at ?? timestamp
  const seenCount = (existing[0]?.seen_count ?? 0) + 1
  const impact = normalizeToken(input.impact)
  const priority = normalizeToken(input.priority)
  const material = input.material || isUserVisible(impact) || isSensitive(impact) || materialPriorities.has(priority)
  const text = [input.decisionId, input.status, input.source, input.fingerprint, input.summary, impact, priority, input.userImpact, input.decision, input.text].filter(Boolean).join(" ")
  yield* sql`delete from issues where id = ${issueId}`
  yield* sql`
    insert into issues (id, run_id, decision_id, status, source, fingerprint, summary, impact, priority, material, user_impact, decision, text, decision_log_path, first_seen_at, last_seen_at, seen_count, updated_at)
    values (${issueId}, ${runId}, ${input.decisionId}, ${normalizeStatus(input.status)}, ${input.source}, ${input.fingerprint}, ${input.summary}, ${impact}, ${priority}, ${material ? 1 : 0}, ${input.userImpact}, ${input.decision}, ${text}, ${run.decisionLog}, ${firstSeen}, ${timestamp}, ${seenCount}, ${timestamp})`
  return { runId, issueId }
})

export class MissingReviewRun extends Error {
  readonly _tag = "MissingReviewRun"
  constructor() {
    super("record-command needs --base when no matching review run exists; record a finding first, or pass --base")
  }
}

export const recordCommand = Effect.fn("ReviewFindings.recordCommand")(function*(run: ReviewRun, command: RecordedCommand) {
  const sql = yield* SqlClient.SqlClient
  const runId = run.base.length > 0 ? yield* upsertRun(run) : yield* latestRun(run)
  if (runId === undefined) return yield* Effect.fail(new MissingReviewRun())
  const commandId = stableId([runId, command.command, command.reason, command.decisionId])
  yield* sql`insert into commands (id, run_id, command, result, reason, decision_id, updated_at)
    values (${commandId}, ${runId}, ${command.command}, ${command.result}, ${command.reason}, ${command.decisionId}, ${nowSeconds()})
    on conflict(id) do update set result=excluded.result, reason=excluded.reason, decision_id=excluded.decision_id, updated_at=excluded.updated_at`
  return { runId, commandId }
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
  const findings = runId === undefined ? [] : yield* sql<CloseoutFinding>`select decision_id, status, source, summary, coalesce(impact, '') as impact, coalesce(priority, '') as priority, coalesce(material, 0) as material, coalesce(user_impact, '') as user_impact, coalesce(decision, '') as decision, fingerprint from issues where run_id = ${runId} order by decision_id`
  const commands = runId === undefined ? [] : yield* sql<CommandRow>`select command, result, reason, coalesce(decision_id, '') as decision_id from commands where run_id = ${runId} order by updated_at, command`
  return {
    material_findings: findings.filter(isMaterial),
    user_visible_or_workflow_changes: findings.filter((finding) => isUserVisible(finding.impact)),
    security_data_permission_changes: findings.filter((finding) => isSensitive(finding.impact)),
    lower_risk_findings: findings.filter((finding) => !isMaterial(finding)),
    findings_found: findings,
    changes_made_while_reviewing: findings.filter((finding) => finding.status === "fixed"),
    verification_run: commands,
    still_open: findings.filter((finding) => ["open", "deferred", "provisional", "reopened"].includes(finding.status))
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
  if (filters.repoPath !== undefined) { where.push("review_runs.repo_key = ?"); params.push(yield* canonicalRepoKey(filters.repoPath)) }
  else if (filters.repo !== undefined) { where.push("review_runs.repo_name = ?"); params.push(filters.repo) }
  if (filters.branch !== undefined) { where.push("coalesce(review_runs.branch, '') = ?"); params.push(filters.branch) }
  if (filters.target !== undefined) { where.push("review_runs.target = ?"); params.push(filters.target) }
  if (filters.status !== undefined) { where.push("issues.status = ?"); params.push(filters.status) }
  const rows = yield* sql.unsafe<QueryRow>(`select issues.id, issues.decision_id, issues.status, issues.source, issues.fingerprint, issues.summary, coalesce(issues.decision, '') as decision, issues.text, coalesce(issues.decision_log_path, '') as decision_log_path, coalesce(issues.last_seen_at, 0) as last_seen_at, coalesce(issues.seen_count, 1) as seen_count, review_runs.repo_name as repo, coalesce(review_runs.branch, '') as branch, review_runs.target, coalesce(review_runs.head, '') as head from issues join review_runs on review_runs.id = issues.run_id${where.length === 0 ? "" : ` where ${where.join(" and ")}`}`, params)
  const terms = normalizeToken(query).split(/[^a-z0-9_.:/#-]+/u).filter(Boolean)
  const results = rows.flatMap((row): ReadonlyArray<QueryResult> => {
    const haystack = normalizeToken(`${row.text} ${row.summary} ${row.fingerprint}`)
    const matches = terms.filter((term) => haystack.includes(term)).length
    if (matches === 0) return []
    return [{ ...row, score: Math.round((matches / Math.max(terms.length, 1)) * 1_000_000) / 1_000_000 }]
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
    yield* sql`delete from review_runs where id not in (select distinct run_id from issues) and id not in (select distinct run_id from commands)`
  }
  return issues.length
})

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

export const printCloseout = (closeout: Closeout, json: boolean, materialOnly: boolean) => Effect.gen(function*() {
  if (json) return yield* Console.log(JSON.stringify(closeout, null, 2))
  const lines = [
    ...findingLines("Material findings", closeout.material_findings, true), "",
    ...findingLines("User-visible or workflow changes", closeout.user_visible_or_workflow_changes, true), "",
    ...findingLines("Security, data, and permission changes", closeout.security_data_permission_changes, true), ""
  ]
  if (!materialOnly) {
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
