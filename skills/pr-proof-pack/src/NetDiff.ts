import * as Effect from "effect/Effect"
import * as Schema from "effect/Schema"

import { checkedTrimmedText } from "../../../packages/effect-cli/CheckedProcess.ts"

const PullRequestBase = Schema.Struct({ baseRefName: Schema.String, baseRefOid: Schema.String })
const capture = checkedTrimmedText
const git = (args: ReadonlyArray<string>) => capture("git", args)
const optionalGit = (args: ReadonlyArray<string>) => git(args).pipe(Effect.option)

export interface NetDiffReport {
  readonly base: { readonly source: string; readonly ref: string; readonly sha: string; readonly comparisonBase: string }
  readonly head: string
  readonly changedFiles: ReadonlyArray<{ readonly status: string; readonly path: string }>
  readonly diffStat: string
  readonly changeBreakdown: ChangeBreakdown
  readonly commits: ReadonlyArray<string>
  readonly branchOnlyChurnNoNetDiff: ReadonlyArray<string>
  readonly fileDetails: ReadonlyArray<{
    readonly path: string
    readonly status: "modified" | "no net diff" | "not touched in branch"
    readonly branch_commits: ReadonlyArray<string>
    readonly proof_hint: string
  }>
  readonly proofPlan: ReadonlyArray<{ readonly path: string; readonly hint: string }>
}

export interface FileChange {
  readonly path: string
  readonly additions: number
  readonly deletions: number
  readonly binary: boolean
}

export interface ChangeBreakdownPart {
  readonly part: string
  readonly files: number
  readonly additions: number
  readonly deletions: number
  readonly binaryFiles: number
}

export interface ChangeBreakdown {
  readonly parts: ReadonlyArray<ChangeBreakdownPart>
  readonly total: Omit<ChangeBreakdownPart, "part">
}

const breakdownParts = [
  "Implementation",
  "Tests and fixtures",
  "Documentation",
  "CI, config, and tooling",
  "Dependencies and generated files"
] as const

const changePart = (path: string): typeof breakdownParts[number] => {
  const lower = path.toLowerCase()
  const segments = lower.split("/")
  const basename = segments.at(-1) ?? lower
  if (segments.some((segment) => ["__fixtures__", "__tests__", "fixtures", "spec", "specs", "test", "tests"].includes(segment)) || /[.](?:spec|test)[.][^.]+$/u.test(basename)) return "Tests and fixtures"
  if (segments.some((segment) => ["doc", "docs", "documentation"].includes(segment)) || /[.](?:adoc|md|mdx|rst)$/u.test(basename)) return "Documentation"
  if (["bun.lock", "bun.lockb", "composer.lock", "deno.lock", "gemfile.lock", "package-lock.json", "pnpm-lock.yaml", "poetry.lock", "uv.lock", "yarn.lock"].includes(basename) || segments.some((segment) => ["dist", "generated", "third_party", "vendor"].includes(segment))) return "Dependencies and generated files"
  if (segments.some((segment) => [".circleci", ".github", "config", "configs", "script", "scripts", "tool", "tools"].includes(segment)) || /^(?:eslint|prettier|tsconfig|vitest|vite|webpack)[.-]/u.test(basename) || ["package.json", "turbo.json"].includes(basename)) return "CI, config, and tooling"
  return "Implementation"
}

export const parseNumStat = (output: string): ReadonlyArray<FileChange> => output.split("\n").filter(Boolean).map((line) => {
  const [added = "-", deleted = "-", ...pathParts] = line.split("\t")
  const binary = added === "-" || deleted === "-"
  return {
    path: pathParts.join("\t"),
    additions: binary ? 0 : Number(added),
    deletions: binary ? 0 : Number(deleted),
    binary
  }
})

export const changeBreakdownFromNumStat = (changes: ReadonlyArray<FileChange>): ChangeBreakdown => {
  const parts = new Map<string, Omit<ChangeBreakdownPart, "part">>()
  for (const change of changes) {
    const part = changePart(change.path)
    const current = parts.get(part) ?? { files: 0, additions: 0, deletions: 0, binaryFiles: 0 }
    parts.set(part, {
      files: current.files + 1,
      additions: current.additions + change.additions,
      deletions: current.deletions + change.deletions,
      binaryFiles: current.binaryFiles + (change.binary ? 1 : 0)
    })
  }
  const rows = breakdownParts.flatMap((part) => {
    const values = parts.get(part)
    return values === undefined ? [] : [{ part, ...values }]
  })
  return {
    parts: rows,
    total: rows.reduce((total, row) => ({
      files: total.files + row.files,
      additions: total.additions + row.additions,
      deletions: total.deletions + row.deletions,
      binaryFiles: total.binaryFiles + row.binaryFiles
    }), { files: 0, additions: 0, deletions: 0, binaryFiles: 0 })
  }
}

const proofKind = (path: string) => {
  const lower = path.toLowerCase()
  if (["/routes/", "/components/", "/app/", "/pages/", "src/styles", ".css"].some((marker) => lower.includes(marker))) return "Practical UI proof required: show matched direct-base and PR outcomes. Use provider-hosted screenshots for appearance or layout and a tightly edited, natural-speed recording for motion or interaction; use copyable text when the changed UI fact is textual. Tests, builds, CI, and automated E2E output are supporting checks only."
  if (["cron", "queue", "job", "worker", "scheduler", "migration"].some((marker) => lower.includes(marker))) return "Practical operator proof required: show the same input against the direct base and PR, including the failure point, reason, and resulting resource, record, delivery, cleanup, or rollback. Prefer copyable text for textual state and a trimmed recording only when the visible operator flow matters."
  if (["api", "server", "route", "handler", "controller"].some((marker) => lower.includes(marker))) return "Practical backend proof required: show matched direct-base and PR requests, responses, and persisted state or side effects as copyable text. Use visual evidence only when rendering or spatial output is part of the claim. Contract-test output remains supporting validation."
  if (["docs/", "specs/", ".md", ".mdx"].some((marker) => lower.includes(marker))) return "Practical documentation proof required: show the changed instruction and the result of following it. Use copyable text unless rendered layout or appearance is the claimed improvement; leave validators and link checks in the check run."
  return "Practical behavior proof required: show matched broken and fixed outcomes in the simplest format that preserves the claim. Prefer copyable text for textual behavior and provider-hosted media only for visual behavior. Tests, builds, CI, validators, and green checks are supporting checks only."
}

const resolveBase = Effect.gen(function*() {
  const gh = yield* capture("gh", ["pr", "view", "--json", "baseRefName,baseRefOid"]).pipe(Effect.flatMap(Schema.decodeUnknownEffect(Schema.fromJsonString(PullRequestBase))), Effect.option)
  if (gh._tag === "Some") {
    const remoteBase = `origin/${gh.value.baseRefName}`
    const remoteSha = yield* optionalGit(["rev-parse", "--verify", remoteBase])
    if (remoteSha._tag === "Some") {
      const mergeBase = yield* optionalGit(["merge-base", remoteSha.value, "HEAD"])
      if (mergeBase._tag === "Some") return { source: "git remote base", ref: remoteBase, sha: remoteSha.value, comparisonBase: mergeBase.value }
    }
    if (gh.value.baseRefOid.length > 0) {
      const mergeBase = yield* optionalGit(["merge-base", gh.value.baseRefOid, "HEAD"])
      if (mergeBase._tag === "Some") return { source: "gh pr view", ref: gh.value.baseRefName, sha: gh.value.baseRefOid, comparisonBase: mergeBase.value }
    }
  }
  for (const ref of ["origin/main", "origin/master", "main", "master"]) {
    const sha = yield* optionalGit(["rev-parse", "--verify", ref])
    if (sha._tag === "Some") {
      const mergeBase = yield* optionalGit(["merge-base", sha.value, "HEAD"])
      if (mergeBase._tag === "Some") return { source: "git", ref, sha: sha.value, comparisonBase: mergeBase.value }
    }
  }
  const mergeBase = yield* git(["merge-base", "HEAD~1", "HEAD"])
  return { source: "fallback", ref: "HEAD~1", sha: mergeBase, comparisonBase: mergeBase }
})

export const buildNetDiff = Effect.fn("NetDiff.build")(function*(paths: ReadonlyArray<string>) {
  const base = yield* resolveBase
  const requestedPaths = paths.map((path) => path.replace(/^(?:\.\/)+/u, ""))
  const pathspec = requestedPaths.length === 0 ? [] : ["--", ...requestedPaths]
  const [head, names, stat, numStat, log, touchedOutput] = yield* Effect.all([
    git(["rev-parse", "HEAD"]), git(["diff", "--name-status", `${base.comparisonBase}...HEAD`, ...pathspec]),
    git(["diff", "--stat", `${base.comparisonBase}...HEAD`, ...pathspec]), git(["diff", "--numstat", `${base.comparisonBase}...HEAD`, ...pathspec]),
    git(["log", "--oneline", `${base.comparisonBase}..HEAD`, ...pathspec]),
    git(["log", "--name-only", "--pretty=format:", `${base.comparisonBase}..HEAD`, ...pathspec])
  ], { concurrency: "unbounded" })
  const changedFiles = names.split("\n").filter(Boolean).map((line) => { const parts = line.split("\t"); return { status: parts[0] ?? "M", path: parts.at(-1) ?? line } })
  const net = new Set(changedFiles.map(({ path }) => path))
  const touched = [...new Set(touchedOutput.split("\n").map((line) => line.trim()).filter(Boolean))].sort()
  const touchedPaths = new Set(touched)
  const fileDetails = yield* Effect.forEach(paths.map((path, index) => ({ displayPath: path, gitPath: requestedPaths[index] ?? path })), ({ displayPath, gitPath }) => git(["log", "--oneline", `${base.comparisonBase}..HEAD`, "--", gitPath]).pipe(Effect.map((output) => {
    const status = net.has(gitPath) ? "modified" : touchedPaths.has(gitPath) ? "no net diff" : "not touched in branch"
    return {
      path: displayPath,
      status,
      branch_commits: output.split("\n").filter(Boolean),
      proof_hint: status === "modified" ? proofKind(gitPath) : "Omit from PR proof unless needed for context."
    } as const
  })), { concurrency: "unbounded" })
  return { base, head, changedFiles, diffStat: stat, changeBreakdown: changeBreakdownFromNumStat(parseNumStat(numStat)), commits: log.split("\n").filter(Boolean), branchOnlyChurnNoNetDiff: touched.filter((path) => !net.has(path)), fileDetails, proofPlan: changedFiles.map(({ path }) => ({ path, hint: proofKind(path) })) } satisfies NetDiffReport
})

export const renderMarkdown = (report: NetDiffReport, proofPlan: boolean) => {
  const breakdown = report.changeBreakdown
  const lines = [`Base: ${report.base.ref} ${report.base.comparisonBase.slice(0, 12)}`, `Base source: ${report.base.source}`, `Head: ${report.head.slice(0, 12)}`, "", "## Change Breakdown", ...(breakdown.parts.length === 0 ? ["No net diff."] : ["| Part | Files | +LOC | -LOC |", "| --- | ---: | ---: | ---: |", ...breakdown.parts.map((row) => `| ${row.part} | ${row.files} | +${row.additions} | -${row.deletions} |`), `| **Total** | **${breakdown.total.files}** | **+${breakdown.total.additions}** | **-${breakdown.total.deletions}** |`, ...(breakdown.total.binaryFiles === 0 ? [] : [``, `${breakdown.total.binaryFiles} binary ${breakdown.total.binaryFiles === 1 ? "file is" : "files are"} included in the file count and excluded from LOC totals.`])]), "", "## Net Changed Files", ...(report.changedFiles.length === 0 ? ["- None"] : report.changedFiles.map((row) => `- ${row.status} ${row.path}`)), "", "## Diff Stat", "```text", report.diffStat || "No net diff.", "```", "", "## Branch Commits", ...(report.commits.length === 0 ? ["- None"] : report.commits.map((line) => `- ${line}`)), "", "## Branch-Only Churn With No Net Diff", ...(report.branchOnlyChurnNoNetDiff.length === 0 ? ["- None"] : report.branchOnlyChurnNoNetDiff.map((path) => `- ${path}`))]
  if (report.fileDetails.length > 0) lines.push("", "## Requested File Details", ...report.fileDetails.flatMap((detail) => [
    `- ${detail.path}: ${detail.status}`,
    ...detail.branch_commits.map((commit) => `  - ${commit}`),
    `  - ${detail.proof_hint}`
  ]))
  if (proofPlan) lines.push("", "## Proof Plan", ...(report.proofPlan.length === 0 ? ["- No net changed files; remove stale PR proof for reverted behavior."] : report.proofPlan.map((item) => `- ${item.path}: ${item.hint}`)))
  return lines.join("\n")
}
