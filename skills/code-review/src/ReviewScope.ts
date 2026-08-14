import * as Effect from "effect/Effect"
import * as FileSystem from "effect/FileSystem"
import * as Path from "effect/Path"

import { checkedText, checkedTrimmedText } from "../../../packages/effect-cli/CheckedProcess.ts"
import { trustedExecutable } from "./NativeReview.ts"

export interface DiffCounts {
  readonly additions: number
  readonly deletions: number
  readonly binaryFiles: number
  readonly changedLines: number
}

export interface ScopeMeasurement {
  readonly production: DiffCounts
  readonly tests: DiffCounts
  readonly generated: DiffCounts
  readonly productionPaths: ReadonlyArray<string>
}

interface NumstatEntry {
  readonly additions: number
  readonly deletions: number
  readonly binary: boolean
  readonly path: string
}

const emptyCounts = (): { additions: number; deletions: number; binaryFiles: number; changedLines: number } => ({
  additions: 0,
  deletions: 0,
  binaryFiles: 0,
  changedLines: 0
})

const generatedNames = new Set([
  "Cargo.lock",
  "Gemfile.lock",
  "bun.lock",
  "bun.lockb",
  "composer.lock",
  "package-lock.json",
  "pnpm-lock.yaml",
  "poetry.lock",
  "uv.lock",
  "yarn.lock"
])

const isTestPath = (path: string): boolean => {
  const parts = path.split("/")
  const basename = parts.at(-1) ?? path
  return parts.some((part) => part === "test" || part === "tests" || part === "__tests__" || part === "__snapshots__")
    || /\.(?:spec|test)\.[^/]+$/u.test(basename)
}

const isGeneratedPath = (path: string): boolean => generatedNames.has(path.split("/").at(-1) ?? path)

const parseNumstat = (output: string): ReadonlyArray<NumstatEntry> => output.split("\0").flatMap((record) => {
  if (record.length === 0) return []
  const firstTab = record.indexOf("\t")
  const secondTab = record.indexOf("\t", firstTab + 1)
  if (firstTab < 0 || secondTab < 0) return []
  const additionsText = record.slice(0, firstTab)
  const deletionsText = record.slice(firstTab + 1, secondTab)
  const binary = additionsText === "-" || deletionsText === "-"
  return [{
    additions: binary ? 0 : Number(additionsText),
    deletions: binary ? 0 : Number(deletionsText),
    binary,
    path: record.slice(secondTab + 1)
  }]
})

const countBytes = (bytes: Uint8Array, path: string): NumstatEntry => {
  const binary = bytes.includes(0)
  if (binary) return { additions: 0, deletions: 0, binary: true, path }
  let additions = 0
  for (const byte of bytes) if (byte === 10) additions += 1
  if (bytes.length > 0 && bytes.at(-1) !== 10) additions += 1
  return { additions, deletions: 0, binary: false, path }
}

const addEntry = (counts: ReturnType<typeof emptyCounts>, entry: NumstatEntry): void => {
  counts.additions += entry.additions
  counts.deletions += entry.deletions
  counts.binaryFiles += entry.binary ? 1 : 0
  counts.changedLines += entry.additions + entry.deletions + (entry.binary ? 1 : 0)
}

export const measureScopeDiff = Effect.fn("ReviewScope.measureScopeDiff")(function*(repoPath: string, baseRef: string, targetRef = "HEAD") {
  const fs = yield* FileSystem.FileSystem
  const paths = yield* Path.Path
  const git = yield* trustedExecutable("git", repoPath)
  const targetOid = yield* checkedTrimmedText(git, ["rev-parse", "--verify", `${targetRef}^{commit}`], { cwd: repoPath })
  const checkoutOid = yield* checkedTrimmedText(git, ["rev-parse", "--verify", "HEAD^{commit}"], { cwd: repoPath })
  const includeWorkingTree = targetOid === checkoutOid
  const mergeBase = yield* checkedTrimmedText(git, ["merge-base", baseRef, targetOid], { cwd: repoPath })
  const tracked = yield* checkedText(git, ["diff", "--numstat", "--no-renames", "-z", mergeBase, ...(includeWorkingTree ? [] : [targetOid]), "--"], { cwd: repoPath })
  const untracked = includeWorkingTree
    ? yield* checkedText(git, ["ls-files", "--others", "--exclude-standard", "-z"], { cwd: repoPath })
    : ""
  const untrackedEntries = yield* Effect.forEach(untracked.split("\0").filter((path) => path.length > 0), (path) =>
    fs.readLink(paths.join(repoPath, path)).pipe(
      Effect.map(() => ({ additions: 0, deletions: 0, binary: true, path } satisfies NumstatEntry)),
      Effect.catch(() => fs.readFile(paths.join(repoPath, path)).pipe(Effect.map((bytes) => countBytes(bytes, path))))
    ))
  const entries = [...parseNumstat(tracked), ...untrackedEntries]
  const production = emptyCounts()
  const tests = emptyCounts()
  const generated = emptyCounts()
  const productionPaths = new Set<string>()
  for (const entry of entries) {
    if (isTestPath(entry.path)) addEntry(tests, entry)
    else if (isGeneratedPath(entry.path)) addEntry(generated, entry)
    else {
      addEntry(production, entry)
      productionPaths.add(entry.path)
    }
  }
  return {
    production,
    tests,
    generated,
    productionPaths: [...productionPaths].sort()
  } satisfies ScopeMeasurement
})
