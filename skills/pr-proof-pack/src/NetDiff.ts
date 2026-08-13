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

const proofKind = (path: string) => {
  const lower = path.toLowerCase()
  if (["/routes/", "/components/", "/app/", "/pages/", "src/styles", ".css"].some((marker) => lower.includes(marker))) return "PR-visible screenshot required if human-visible UI changed."
  if (["cron", "queue", "job", "worker", "scheduler", "migration"].some((marker) => lower.includes(marker))) return "Mermaid/table: scheduled, queued, or cleanup behavior changed."
  if (["api", "server", "route", "handler", "controller"].some((marker) => lower.includes(marker))) return "Mermaid/API example: request, response, or integration behavior changed."
  if (["docs/", "specs/", ".md", ".mdx"].some((marker) => lower.includes(marker))) return "No screenshot by default: docs/spec text changed."
  return "Mermaid/table/API example: explain the net behavior change; avoid screenshots by default."
}

const resolveBase = Effect.gen(function*() {
  const gh = yield* capture("gh", ["pr", "view", "--json", "baseRefName,baseRefOid"]).pipe(Effect.flatMap(Schema.decodeUnknownEffect(Schema.fromJsonString(PullRequestBase))), Effect.option)
  if (gh._tag === "Some" && gh.value.baseRefOid.length > 0) {
    const mergeBase = yield* optionalGit(["merge-base", gh.value.baseRefOid, "HEAD"])
    if (mergeBase._tag === "Some") return { source: "gh pr view", ref: gh.value.baseRefName, sha: gh.value.baseRefOid, comparisonBase: mergeBase.value }
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
  const pathspec = paths.length === 0 ? [] : ["--", ...paths]
  const [head, names, stat, log, touchedOutput] = yield* Effect.all([
    git(["rev-parse", "HEAD"]), git(["diff", "--name-status", `${base.comparisonBase}...HEAD`, ...pathspec]),
    git(["diff", "--stat", `${base.comparisonBase}...HEAD`, ...pathspec]), git(["log", "--oneline", `${base.comparisonBase}..HEAD`, ...pathspec]),
    git(["log", "--name-only", "--pretty=format:", `${base.comparisonBase}..HEAD`, ...pathspec])
  ], { concurrency: "unbounded" })
  const changedFiles = names.split("\n").filter(Boolean).map((line) => { const parts = line.split("\t"); return { status: parts[0] ?? "M", path: parts.at(-1) ?? line } })
  const net = new Set(changedFiles.map(({ path }) => path))
  const touched = [...new Set(touchedOutput.split("\n").map((line) => line.trim()).filter(Boolean))].sort()
  const touchedPaths = new Set(touched)
  const fileDetails = yield* Effect.forEach(paths, (path) => git(["log", "--oneline", `${base.comparisonBase}..HEAD`, "--", path]).pipe(Effect.map((output) => {
    const status = net.has(path) ? "modified" : touchedPaths.has(path) ? "no net diff" : "not touched in branch"
    return {
      path,
      status,
      branch_commits: output.split("\n").filter(Boolean),
      proof_hint: status === "modified" ? proofKind(path) : "Omit from PR proof unless needed for context."
    } as const
  })), { concurrency: "unbounded" })
  return { base, head, changedFiles, diffStat: stat, commits: log.split("\n").filter(Boolean), branchOnlyChurnNoNetDiff: touched.filter((path) => !net.has(path)), fileDetails, proofPlan: changedFiles.map(({ path }) => ({ path, hint: proofKind(path) })) } satisfies NetDiffReport
})

export const renderMarkdown = (report: NetDiffReport, proofPlan: boolean) => {
  const lines = [`Base: ${report.base.ref} ${report.base.comparisonBase.slice(0, 12)}`, `Base source: ${report.base.source}`, `Head: ${report.head.slice(0, 12)}`, "", "## Net Changed Files", ...(report.changedFiles.length === 0 ? ["- None"] : report.changedFiles.map((row) => `- ${row.status} ${row.path}`)), "", "## Diff Stat", "```text", report.diffStat || "No net diff.", "```", "", "## Branch Commits", ...(report.commits.length === 0 ? ["- None"] : report.commits.map((line) => `- ${line}`)), "", "## Branch-Only Churn With No Net Diff", ...(report.branchOnlyChurnNoNetDiff.length === 0 ? ["- None"] : report.branchOnlyChurnNoNetDiff.map((path) => `- ${path}`))]
  if (report.fileDetails.length > 0) lines.push("", "## Requested File Details", ...report.fileDetails.flatMap((detail) => [
    `- ${detail.path}: ${detail.status}`,
    ...detail.branch_commits.map((commit) => `  - ${commit}`),
    `  - ${detail.proof_hint}`
  ]))
  if (proofPlan) lines.push("", "## Proof Plan", ...(report.proofPlan.length === 0 ? ["- No net changed files; remove stale PR proof for reverted behavior."] : report.proofPlan.map((item) => `- ${item.path}: ${item.hint}`)))
  return lines.join("\n")
}
