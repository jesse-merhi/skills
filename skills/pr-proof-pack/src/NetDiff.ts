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
  readonly changeBreakdown: ChangeBreakdown
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
  const numStat = yield* git(["diff", "--numstat", `${base.comparisonBase}...${head}`, "--", ...paths])
  return { base, head, changeBreakdown: changeBreakdownFromNumStat(parseNumStat(numStat)) } satisfies NetDiffReport
})

export const renderMarkdown = (report: NetDiffReport) => {
  const { parts, total } = report.changeBreakdown
  const lines = [
    `Selected base: ${report.base.ref} ${report.base.sha.slice(0, 12)}`,
    `Comparison base: ${report.base.comparisonBase.slice(0, 12)}`,
    `Base source: ${report.base.source}`,
    `Head: ${report.head.slice(0, 12)}`,
    "",
    "## Change Breakdown"
  ]
  if (parts.length === 0) return [...lines, "No net diff."].join("\n")
  lines.push(
    "| Part | Files | +LOC | -LOC |",
    "| --- | ---: | ---: | ---: |",
    ...parts.map((part) => `| ${part.part} | ${part.files} | +${part.additions} | -${part.deletions} |`),
    `| **Total** | **${total.files}** | **+${total.additions}** | **-${total.deletions}** |`
  )
  if (total.binaryFiles > 0) {
    lines.push("", `${total.binaryFiles} binary ${total.binaryFiles === 1 ? "file is" : "files are"} included in the file count and excluded from LOC totals.`)
  }
  return lines.join("\n")
}
