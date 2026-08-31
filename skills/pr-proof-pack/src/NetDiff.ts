import * as Effect from "effect/Effect"
import * as Schema from "effect/Schema"

import { CheckedProcessError, checkedTrimmedText } from "../../../packages/effect-cli/CheckedProcess.ts"

const PullRequestBase = Schema.Struct({ baseRefName: Schema.String, baseRefOid: Schema.String })
const capture = checkedTrimmedText
const git = (args: ReadonlyArray<string>) => capture("git", args)
const optionalGit = (args: ReadonlyArray<string>) => git(args).pipe(Effect.option)
const resolveCommit = Effect.fn("NetDiff.resolveCommit")(function*(kind: "base" | "head", ref: string) {
  const revision = `${ref}^{commit}`
  const contextualize = (error: CheckedProcessError) => new CheckedProcessError({
    command: error.command, exitCode: error.exitCode, stderr: error.stderr,
    message: `Invalid ${kind} ref ${JSON.stringify(ref)}: ${error.message}`, cause: error
  })
  const knownRefs = new Set((yield* git(["for-each-ref", "--format=%(refname)"])).split("\n"))
  const candidates = (ref.startsWith("refs/") ? [ref] : [`refs/${ref}`, `refs/tags/${ref}`, `refs/heads/${ref}`, `refs/remotes/${ref}`, `refs/remotes/${ref}/HEAD`]).filter((candidate) => knownRefs.has(candidate))
  if (candidates.length > 1) {
    return yield* new CheckedProcessError({ command: "git rev-parse", exitCode: 128, stderr: "", message: `Invalid ${kind} ref ${JSON.stringify(ref)}: ambiguous ref matches ${candidates.join(", ")}` })
  }
  return yield* git(["rev-parse", "--verify", "--end-of-options", revision]).pipe(Effect.mapError(contextualize))
})

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

export interface NetDiffTarget {
  readonly base?: string
  readonly head?: string
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

export const proofHintForPath = (path: string) => {
  const lower = path.toLowerCase()
  const segments = lower.split("/")
  const originalFilename = path.split("/").at(-1) ?? ""
  const filename = segments.at(-1) ?? ""
  const filenameTokens = originalFilename.replace(/([A-Z]+)([A-Z][a-z])/g, "$1-$2").replace(/([a-z0-9])([A-Z])/g, "$1-$2").toLowerCase().split(/[._-]+/)
  const fileStem = filename.split(".", 1)[0] ?? filename
  const hasDocumentationDirectory = ["docs", "specs"].some((marker) => segments.includes(marker))
  const hasUiDirectory = ["components", "app", "pages"].some((marker) => segments.includes(marker))
  const hasRenderableUiDirectory = hasUiDirectory || segments.includes("routes")
  const isUiFile = [".tsx", ".jsx", ".vue", ".svelte", ".mdx", ".html", ".htm", ".astro"].some((extension) => filename.endsWith(extension))
  const isRenderableUiFile = hasRenderableUiDirectory && isUiFile && fileStem !== "readme"
  const isDocumentation = !isRenderableUiFile && (hasDocumentationDirectory || [".md", ".mdx"].some((extension) => filename.endsWith(extension)))
  const isStyleFile = [".css", ".scss", ".sass", ".less", ".css.ts", ".css.js", ".style.ts", ".styles.ts", ".styled.ts", ".style.js", ".styles.js", ".styled.js"].some((extension) => filename.endsWith(extension))
  const isUiSupportFile = hasUiDirectory && ((filenameTokens.includes("view") && filenameTokens.includes("model")) || (filenameTokens.includes("theme") && filenameTokens.includes("service")) || [".component.ts", ".component.js", ".directive.ts", ".directive.js", ".pipe.ts", ".pipe.js"].some((extension) => filename.endsWith(extension)) || ([".java", ".kt", ".kts", ".cs", ".swift", ".dart"].some((extension) => filename.endsWith(extension)) && ["view", "screen", "page", "activity", "fragment", "component", "window", "dialog", "widget"].some((token) => filenameTokens.includes(token))))
  const isSvelteKitModule = segments.includes("routes") && ["+page.ts", "+page.js", "+layout.ts", "+layout.js"].includes(filename)
  const isBackendMarked = ["api", "apis", "server", "servers", "route", "routes", "handler", "handlers", "controller", "controllers"].some((marker) => segments.includes(marker) || filenameTokens.includes(marker))
  const isUiPath = isRenderableUiFile || isUiSupportFile || isSvelteKitModule || (hasUiDirectory && (isStyleFile || [".routes.ts", ".routing.ts"].some((extension) => filename.endsWith(extension)))) || (hasRenderableUiDirectory && [".svg", ".png", ".jpg", ".jpeg", ".gif", ".webp", ".avif", ".ico", ".hbs", ".handlebars", ".ejs", ".pug", ".jade", ".slim", ".erb", ".xaml", ".storyboard", ".xib"].some((extension) => filename.endsWith(extension))) || (segments.includes("res") && segments.includes("layout") && filename.endsWith(".xml")) || (segments.includes("components") && [".ts", ".js", ".mjs", ".cjs"].some((extension) => filename.endsWith(extension)) && !isBackendMarked) || lower.includes("src/styles/") || lower.includes("src/styles.") || isStyleFile
  const isServerLanguage = [".rb", ".py", ".go", ".php"].some((extension) => filename.endsWith(extension))
  const isRouteHandler = ["route.ts", "route.js", "route.mjs", "route.cjs"].includes(filename)
  const pagesIndex = segments.indexOf("pages")
  const isPagesApi = pagesIndex >= 0 && segments[pagesIndex + 1] === "api"
  const isUiBackend = (segments.includes("app") && (isRouteHandler || (segments.includes("api") && !isUiFile && !isStyleFile))) || isPagesApi
  const comparisonFallback = "Compare direct-base and PR outcomes when the baseline is meaningful and reproducible; otherwise state the constraint and show the actual entry point and PR outcome."
  const visualUiFallback = "For a visual UI claim, show actual product pixels in provider-hosted screenshots; add a tightly edited, natural-speed recording for motion or interaction, and include both when both changed. A technical diagram never replaces this evidence."
  const uiHint = "Practical UI proof required: for a visual appearance, layout, responsive, or rendered-state claim, show actual product pixels. Match direct-base and PR outcomes when the baseline is meaningful and reproducible; otherwise state the constraint and show the actual entry point and PR outcome. Use provider-hosted screenshots and a tightly edited, natural-speed recording for motion or interaction; include both when both kinds of UI claim changed. A technical diagram never replaces this evidence. For a label, accessibility output, or textual state where appearance is not the claim, use copyable text instead. Tests, builds, CI, and automated E2E output are supporting checks only."
  const backendHint = `Practical backend proof required: ${comparisonFallback} Show representative requests, responses, and persisted state or side effects as copyable text. ${visualUiFallback} Contract-test output remains supporting validation.`
  if (isUiPath && !isUiBackend) return uiHint
  if (isUiBackend) return backendHint
  if (isDocumentation) return `Practical documentation proof required: show the changed instruction and the result of following it. Prefer copyable text and leave validators and link checks in the check run. ${visualUiFallback}`
  if (["cron", "queue", "job", "worker", "scheduler", "migration"].some((marker) => lower.includes(marker))) return `Practical operator proof required: ${comparisonFallback} Show the input, failure point or reason, and resulting resource, record, delivery, cleanup, or rollback. Prefer copyable text for textual state. ${visualUiFallback}`
  if (segments.includes("app") && isServerLanguage) return backendHint
  if (segments.includes("app") && ["action", "actions", "mailer", "mailers", "model", "models", "router", "routers"].some((marker) => segments.includes(marker))) return backendHint
  if (isBackendMarked) return backendHint
  return `Practical behavior proof required: ${comparisonFallback} Prefer copyable text for textual behavior. ${visualUiFallback} Tests, builds, CI, validators, and green checks are supporting checks only.`
}

const resolveBase = Effect.fn("NetDiff.resolveBase")(function*(head: string, explicitBase?: string) {
  if (explicitBase !== undefined) {
    const sha = yield* resolveCommit("base", explicitBase)
    const comparisonBase = yield* git(["merge-base", sha, head])
    return { source: "explicit", ref: explicitBase, sha, comparisonBase }
  }
  const gh = yield* capture("gh", ["pr", "view", "--json", "baseRefName,baseRefOid"]).pipe(Effect.flatMap(Schema.decodeUnknownEffect(Schema.fromJsonString(PullRequestBase))), Effect.option)
  if (gh._tag === "Some") {
    const remoteBase = `origin/${gh.value.baseRefName}`
    const remoteSha = yield* optionalGit(["rev-parse", "--verify", remoteBase])
    if (remoteSha._tag === "Some") {
      const mergeBase = yield* optionalGit(["merge-base", remoteSha.value, head])
      if (mergeBase._tag === "Some") return { source: "git remote base", ref: remoteBase, sha: remoteSha.value, comparisonBase: mergeBase.value }
    }
    if (gh.value.baseRefOid.length > 0) {
      const mergeBase = yield* optionalGit(["merge-base", gh.value.baseRefOid, head])
      if (mergeBase._tag === "Some") return { source: "gh pr view", ref: gh.value.baseRefName, sha: gh.value.baseRefOid, comparisonBase: mergeBase.value }
    }
  }
  for (const ref of ["origin/main", "origin/master", "main", "master"]) {
    const sha = yield* optionalGit(["rev-parse", "--verify", ref])
    if (sha._tag === "Some") {
      const mergeBase = yield* optionalGit(["merge-base", sha.value, head])
      if (mergeBase._tag === "Some") return { source: "git", ref, sha: sha.value, comparisonBase: mergeBase.value }
    }
  }
  const fallback = `${head}~1`
  const mergeBase = yield* git(["merge-base", fallback, head])
  return { source: "fallback", ref: fallback, sha: mergeBase, comparisonBase: mergeBase }
})

export const buildNetDiff = Effect.fn("NetDiff.build")(function*(paths: ReadonlyArray<string>, target: NetDiffTarget = {}) {
  const head = yield* resolveCommit("head", target.head ?? "HEAD")
  const base = yield* resolveBase(head, target.base)
  const requestedPaths = paths.map((path) => path.replace(/^(?:\.\/)+/u, ""))
  const pathspec = requestedPaths.length === 0 ? [] : ["--", ...requestedPaths]
  const [names, stat, numStat, log, touchedOutput] = yield* Effect.all([
    git(["diff", "--name-status", `${base.comparisonBase}...${head}`, ...pathspec]),
    git(["diff", "--stat", `${base.comparisonBase}...${head}`, ...pathspec]), git(["diff", "--numstat", `${base.comparisonBase}...${head}`, ...pathspec]),
    git(["log", "--oneline", `${base.comparisonBase}..${head}`, ...pathspec]),
    git(["log", "--name-only", "--pretty=format:", `${base.comparisonBase}..${head}`, ...pathspec])
  ], { concurrency: "unbounded" })
  const changedFiles = names.split("\n").filter(Boolean).map((line) => { const parts = line.split("\t"); return { status: parts[0] ?? "M", path: parts.at(-1) ?? line } })
  const net = new Set(changedFiles.map(({ path }) => path))
  const touched = [...new Set(touchedOutput.split("\n").map((line) => line.trim()).filter(Boolean))].sort()
  const touchedPaths = new Set(touched)
  const fileDetails = yield* Effect.forEach(paths.map((path, index) => ({ displayPath: path, gitPath: requestedPaths[index] ?? path })), ({ displayPath, gitPath }) => git(["log", "--oneline", `${base.comparisonBase}..${head}`, "--", gitPath]).pipe(Effect.map((output) => {
    const status = net.has(gitPath) ? "modified" : touchedPaths.has(gitPath) ? "no net diff" : "not touched in branch"
    return {
      path: displayPath,
      status,
      branch_commits: output.split("\n").filter(Boolean),
      proof_hint: status === "modified" ? proofHintForPath(gitPath) : "Omit from PR proof unless needed for context."
    } as const
  })), { concurrency: "unbounded" })
  return { base, head, changedFiles, diffStat: stat, changeBreakdown: changeBreakdownFromNumStat(parseNumStat(numStat)), commits: log.split("\n").filter(Boolean), branchOnlyChurnNoNetDiff: touched.filter((path) => !net.has(path)), fileDetails, proofPlan: changedFiles.map(({ path }) => ({ path, hint: proofHintForPath(path) })) } satisfies NetDiffReport
})

export const renderMarkdown = (report: NetDiffReport, proofPlan: boolean) => {
  const breakdown = report.changeBreakdown
  const lines = [`Selected base: ${report.base.ref} ${report.base.sha.slice(0, 12)}`, `Comparison base: ${report.base.comparisonBase.slice(0, 12)}`, `Base source: ${report.base.source}`, `Head: ${report.head.slice(0, 12)}`, "", "## Change Breakdown", ...(breakdown.parts.length === 0 ? ["No net diff."] : ["| Part | Files | +LOC | -LOC |", "| --- | ---: | ---: | ---: |", ...breakdown.parts.map((row) => `| ${row.part} | ${row.files} | +${row.additions} | -${row.deletions} |`), `| **Total** | **${breakdown.total.files}** | **+${breakdown.total.additions}** | **-${breakdown.total.deletions}** |`, ...(breakdown.total.binaryFiles === 0 ? [] : [``, `${breakdown.total.binaryFiles} binary ${breakdown.total.binaryFiles === 1 ? "file is" : "files are"} included in the file count and excluded from LOC totals.`])]), "", "## Net Changed Files", ...(report.changedFiles.length === 0 ? ["- None"] : report.changedFiles.map((row) => `- ${row.status} ${row.path}`)), "", "## Diff Stat", "```text", report.diffStat || "No net diff.", "```", "", "## Branch Commits", ...(report.commits.length === 0 ? ["- None"] : report.commits.map((line) => `- ${line}`)), "", "## Branch-Only Churn With No Net Diff", ...(report.branchOnlyChurnNoNetDiff.length === 0 ? ["- None"] : report.branchOnlyChurnNoNetDiff.map((path) => `- ${path}`))]
  if (report.fileDetails.length > 0) lines.push("", "## Requested File Details", ...report.fileDetails.flatMap((detail) => [
    `- ${detail.path}: ${detail.status}`,
    ...detail.branch_commits.map((commit) => `  - ${commit}`),
    `  - ${detail.proof_hint}`
  ]))
  if (proofPlan) lines.push("", "## Proof Plan", ...(report.proofPlan.length === 0 ? ["- No net changed files; remove stale PR proof for reverted behavior."] : report.proofPlan.map((item) => `- ${item.path}: ${item.hint}`)))
  return lines.join("\n")
}
