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
  if (["/routes/", "/components/", "/app/", "/pages/", "src/styles", ".css"].some((marker) => lower.includes(marker))) return "Practical UI proof required: upload a deliberately paced manual interaction video plus screenshots of every distinct changed state with Computer Use. Tests, builds, CI, and automated E2E output are supporting checks only."
  if (["cron", "queue", "job", "worker", "scheduler", "migration"].some((marker) => lower.includes(marker))) return "Practical operator proof required: show the real input, run or dry run, and resulting resource, record, delivery, cleanup, or rollback. Add a flow diagram only when it would materially clarify the behavior; do not use test or CI output as evidence."
  if (["api", "server", "route", "handler", "controller"].some((marker) => lower.includes(marker))) return "Practical backend proof required: show a representative real request, response, and persisted state or side effect. Add a copyable API example; use a boundary diagram only when it materially clarifies the behavior. Do not use contract-test output as evidence."
  if (["docs/", "specs/", ".md", ".mdx"].some((marker) => lower.includes(marker))) return "Practical documentation proof required: show the rendered document being used to complete the changed task or the exact comprehension improvement. Leave validators and link checks in the check run; they are not Visual proof."
  return "Practical behavior proof required: show the real product or operator outcome with uploaded visual evidence. Tests, builds, CI, validators, and green checks do not satisfy Visual proof. Add an explanation visual only when it materially helps."
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
  const [head, names, stat, log, touchedOutput] = yield* Effect.all([
    git(["rev-parse", "HEAD"]), git(["diff", "--name-status", `${base.comparisonBase}...HEAD`, ...pathspec]),
    git(["diff", "--stat", `${base.comparisonBase}...HEAD`, ...pathspec]), git(["log", "--oneline", `${base.comparisonBase}..HEAD`, ...pathspec]),
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
