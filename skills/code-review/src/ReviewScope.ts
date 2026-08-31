import * as Effect from "effect/Effect"
import * as FileSystem from "effect/FileSystem"
import * as Path from "effect/Path"
import * as Schema from "effect/Schema"

import { checkedBytes, checkedText, checkedTrimmedText } from "../../../packages/effect-cli/CheckedProcess.ts"
import { trustedExecutable } from "./NativeReview.ts"

export class UnsupportedHistoricalGitVersion extends Schema.TaggedError<UnsupportedHistoricalGitVersion>()("UnsupportedHistoricalGitVersion", {
  message: Schema.String
}) {}

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
  readonly changedPaths: ReadonlyArray<string>
  readonly humanAuthoredPaths: ReadonlyArray<string>
  readonly humanAuthoredBinaryPaths: ReadonlyArray<string>
}

interface NumstatEntry {
  readonly additions: number
  readonly deletions: number
  readonly binary: boolean
  readonly path: string
  readonly classificationPath: string
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

const decodeQuotedPath = (path: string): string => {
  if (!path.startsWith('"') || !path.endsWith('"')) return path
  const bytes: Array<number> = []
  const escapes: Record<string, number> = { a: 7, b: 8, t: 9, n: 10, v: 11, f: 12, r: 13, "\\": 92, '"': 34 }
  for (let index = 1; index < path.length - 1; index++) {
    const character = path.at(index)
    if (character === undefined) break
    if (character !== "\\") {
      bytes.push(character.charCodeAt(0))
      continue
    }
    const escaped = path.at(++index)
    if (escaped === undefined) break
    if (/[0-7]/u.test(escaped)) {
      let octal = escaped
      while (octal.length < 3) {
        const next = path.at(index + 1)
        if (next === undefined || !/[0-7]/u.test(next)) break
        octal += next
        index++
      }
      bytes.push(Number.parseInt(octal, 8))
    } else {
      bytes.push(escapes[escaped] ?? escaped.charCodeAt(0))
    }
  }
  return new TextDecoder().decode(Uint8Array.from(bytes))
}

const parseNumstat = (output: string): ReadonlyArray<NumstatEntry> => output.split("\n").flatMap((line) => {
  const record = line.endsWith("\r") ? line.slice(0, -1) : line
  if (record.length === 0) return []
  const firstTab = record.indexOf("\t")
  const secondTab = record.indexOf("\t", firstTab + 1)
  if (firstTab < 0 || secondTab < 0) return []
  const additionsText = record.slice(0, firstTab)
  const deletionsText = record.slice(firstTab + 1, secondTab)
  const binary = additionsText === "-" || deletionsText === "-"
  const path = record.slice(secondTab + 1)
  return [{
    additions: binary ? 0 : Number(additionsText),
    deletions: binary ? 0 : Number(deletionsText),
    binary,
    path,
    classificationPath: decodeQuotedPath(path)
  }]
})

const addEntry = (counts: ReturnType<typeof emptyCounts>, entry: NumstatEntry): void => {
  counts.additions += entry.additions
  counts.deletions += entry.deletions
  counts.binaryFiles += entry.binary ? 1 : 0
  counts.changedLines += entry.additions + entry.deletions
}

const splitNulBytes = (output: Uint8Array): ReadonlyArray<Uint8Array> => {
  const records: Array<Uint8Array> = []
  let start = 0
  for (let index = 0; index < output.length; index++) {
    if (output[index] !== 0) continue
    if (index > start) records.push(output.slice(start, index))
    start = index + 1
  }
  if (start < output.length) records.push(output.slice(start))
  return records
}

const joinNulBytes = (paths: ReadonlyArray<Uint8Array>): Uint8Array => {
  const output = new Uint8Array(paths.reduce((length, path) => length + path.length + 1, 0))
  let offset = 0
  for (const path of paths) {
    output.set(path, offset)
    offset += path.length + 1
  }
  return output
}

const byteKey = (path: Uint8Array): string => Array.from(path, (byte) => byte.toString(16).padStart(2, "0")).join("")
const attributeName = new TextEncoder().encode(".gitattributes")
const isAttributePath = (path: Uint8Array): boolean => {
  if (path.length < attributeName.length) return false
  const offset = path.length - attributeName.length
  if (offset > 0 && path[offset - 1] !== 47) return false
  return attributeName.every((byte, index) => path[offset + index] === byte)
}

export const measureScopeDiff = Effect.fn("ReviewScope.measureScopeDiff")(function*(repoPath: string, baseRef: string, targetRef = "HEAD", workingTree?: boolean) {
  const fs = yield* FileSystem.FileSystem
  const paths = yield* Path.Path
  const git = yield* trustedExecutable("git", repoPath)
  const targetOid = yield* checkedTrimmedText(git, ["rev-parse", "--verify", `${targetRef}^{commit}`], { cwd: repoPath })
  const checkoutOid = yield* checkedTrimmedText(git, ["rev-parse", "--verify", "HEAD^{commit}"], { cwd: repoPath })
  const includeWorkingTree = workingTree ?? targetOid === checkoutOid
  const version = yield* checkedTrimmedText(git, ["version"], { cwd: repoPath })
  const versionMatch = /^git version (\d+)\.(\d+)/u.exec(version)
  const majorVersion = Number(versionMatch?.[1] ?? 0)
  const minorVersion = Number(versionMatch?.[2] ?? 0)
  const supportsSparseAdd = majorVersion > 2 || (majorVersion === 2 && minorVersion >= 34)
  const sparseOption = supportsSparseAdd ? ["--sparse"] as const : []
  if (!includeWorkingTree) {
    if (majorVersion < 2 || (majorVersion === 2 && minorVersion < 41)) {
      return yield* new UnsupportedHistoricalGitVersion({ message: `Historical-head scope measurement requires Git 2.41 or newer; found ${version}. Update Git or check out the requested head before measuring it.` })
    }
  }
  const mergeBase = yield* checkedTrimmedText(git, ["merge-base", baseRef, targetOid], { cwd: repoPath })
  const historicalOptions = { cwd: repoPath, env: { GIT_ATTR_SOURCE: targetOid }, extendEnv: true } as const
  const emptyTreeOid = yield* checkedTrimmedText(git, ["hash-object", "-t", "tree", "--stdin"], { cwd: repoPath, stdin: "" })
  const quotedDiff = ["-c", "core.quotePath=true", "diff"] as const
  const trackedDiffArguments = [...quotedDiff, "--numstat", "--no-renames", "--ignore-submodules=none", mergeBase, ...(includeWorkingTree ? [] : [targetOid]), "--"] as const
  const untracked = includeWorkingTree
    ? yield* checkedBytes(git, ["ls-files", "--others", "--exclude-standard", "-z"], { cwd: repoPath })
    : new Uint8Array()
  const untrackedPaths = splitNulBytes(untracked)
  const deletedAttributePaths = includeWorkingTree
    ? splitNulBytes(yield* checkedBytes(git, ["ls-files", "--deleted", "-z"], { cwd: repoPath })).filter(isAttributePath)
    : []
  const measured = includeWorkingTree ? yield* Effect.scoped(Effect.gen(function*() {
    const temporaryDirectory = yield* fs.makeTempDirectoryScoped({ prefix: "review-scope-index." })
    const temporaryIndex = paths.join(temporaryDirectory, "index")
    const processOptions = { cwd: repoPath, env: { GIT_INDEX_FILE: temporaryIndex, GIT_LITERAL_PATHSPECS: "1" }, extendEnv: true } as const
    const currentIndexPath = yield* checkedTrimmedText(git, ["rev-parse", "--git-path", "index"], { cwd: repoPath })
    const currentIndex = paths.resolve(repoPath, currentIndexPath)
    yield* fs.copy(currentIndex, temporaryIndex, { overwrite: true })
    const resetPaths = [...new Map([...untrackedPaths, ...deletedAttributePaths].map((path) => [byteKey(path), path])).values()]
    const noHooks = ["-c", "core.hooksPath=/dev/null", ...(supportsSparseAdd ? [] : ["-c", "core.sparseCheckout=false"])] as const
    if (resetPaths.length > 0) {
      yield* checkedText(git, [...noHooks, "rm", "-r", "--force", "--cached", "--ignore-unmatch", ...sparseOption, "--pathspec-from-file=-", "--pathspec-file-nul"], { ...processOptions, stdin: joinNulBytes(resetPaths) })
    }
    if (untrackedPaths.length > 0) {
      yield* checkedText(git, [...noHooks, "add", "--intent-to-add", "--force", ...sparseOption, "--pathspec-from-file=-", "--pathspec-file-nul"], { ...processOptions, stdin: untracked })
    }
    const indexRecords = splitNulBytes(yield* checkedBytes(git, ["ls-files", "-v", "-z"], processOptions))
    const isHiddenIndexRecord = (record: Uint8Array): boolean => {
      const status = record.at(0)
      return status !== undefined && record.at(1) === 32 && (status === 83 || (status >= 97 && status <= 122))
    }
    const hiddenPaths = indexRecords.filter(isHiddenIndexRecord).map((record) => record.slice(2))
    const presenceIndex = paths.join(temporaryDirectory, "presence-index")
    const presenceOptions = { ...processOptions, env: { ...processOptions.env, GIT_INDEX_FILE: presenceIndex } } as const
    yield* fs.copy(temporaryIndex, presenceIndex, { overwrite: true })
    if (hiddenPaths.length > 0) {
      const hiddenPathInput = joinNulBytes(hiddenPaths)
      yield* checkedText(git, [...noHooks, "update-index", "--no-assume-unchanged", "-z", "--stdin"], { ...presenceOptions, stdin: hiddenPathInput })
      yield* checkedText(git, [...noHooks, "update-index", "--no-skip-worktree", "-z", "--stdin"], { ...presenceOptions, stdin: hiddenPathInput })
    }
    const absentPathSet = new Set(splitNulBytes(yield* checkedBytes(git, ["ls-files", "--deleted", "-z"], presenceOptions)).map(byteKey))
    const materializedHiddenPaths = hiddenPaths.filter((path) => !absentPathSet.has(byteKey(path)))
    if (materializedHiddenPaths.length > 0) {
      const materializedPathInput = joinNulBytes(materializedHiddenPaths)
      yield* checkedText(git, [...noHooks, "update-index", "--no-assume-unchanged", "-z", "--stdin"], { ...processOptions, stdin: materializedPathInput })
      yield* checkedText(git, [...noHooks, "update-index", "--no-skip-worktree", "-z", "--stdin"], { ...processOptions, stdin: materializedPathInput })
    }
    const tracked = yield* checkedText(git, trackedDiffArguments, processOptions)
    const currentPaths = yield* checkedBytes(git, ["diff", "--name-only", "--no-renames", "--ignore-submodules=none", "--diff-filter=ACMRTUXB", "-z", mergeBase, "--"], processOptions)
    if (currentPaths.length === 0) return { tracked, currentSide: "", indexedCurrentSide: "" }
    const skipWorktreeSet = new Set(indexRecords
      .filter((record) => isHiddenIndexRecord(record) && absentPathSet.has(byteKey(record.slice(2))))
      .map((record) => byteKey(record.slice(2))))
    const currentPathRecords = splitNulBytes(currentPaths)
    const materializedCurrentPaths = currentPathRecords.filter((path) => !skipWorktreeSet.has(byteKey(path)))
    const materializedAttributePaths = materializedCurrentPaths.filter(isAttributePath)
    const changedSkipWorktreeSet = new Set(currentPathRecords.filter((path) => skipWorktreeSet.has(byteKey(path))).map(byteKey))
    let indexedCurrentSide = ""
    if (changedSkipWorktreeSet.size > 0) {
      const indexedSideIndex = paths.join(temporaryDirectory, "indexed-side-index")
      const indexedSideOptions = { ...processOptions, env: { ...processOptions.env, GIT_INDEX_FILE: indexedSideIndex } } as const
      yield* fs.copy(temporaryIndex, indexedSideIndex, { overwrite: true })
      const indexedPaths = splitNulBytes(yield* checkedBytes(git, ["ls-files", "-z"], indexedSideOptions))
      const removablePaths = indexedPaths.filter((path) => !isAttributePath(path) && !changedSkipWorktreeSet.has(byteKey(path)))
      if (removablePaths.length > 0) {
        yield* checkedText(git, [...noHooks, "rm", "-r", "--force", "--cached", "--ignore-unmatch", ...sparseOption, "--pathspec-from-file=-", "--pathspec-file-nul"], { ...indexedSideOptions, stdin: joinNulBytes(removablePaths) })
      }
      indexedCurrentSide = yield* checkedText(git, [...quotedDiff, "--cached", "--numstat", "--no-renames", "--ignore-submodules=none", "--diff-filter=ACMRTUXB", emptyTreeOid, "--"], indexedSideOptions)
    }
    if (materializedCurrentPaths.length === 0) return { tracked, currentSide: "", indexedCurrentSide }
    const currentSideIndex = paths.join(temporaryDirectory, "current-side-index")
    const currentSideOptions = { ...processOptions, env: { ...processOptions.env, GIT_INDEX_FILE: currentSideIndex } } as const
    yield* fs.copy(temporaryIndex, currentSideIndex, { overwrite: true })
    const nonAttributePaths = splitNulBytes(yield* checkedBytes(git, ["ls-files", "-z"], currentSideOptions)).filter((path) => !isAttributePath(path))
    if (nonAttributePaths.length > 0) {
      yield* checkedText(git, [...noHooks, "rm", "-r", "--force", "--cached", "--ignore-unmatch", ...sparseOption, "--pathspec-from-file=-", "--pathspec-file-nul"], { ...currentSideOptions, stdin: joinNulBytes(nonAttributePaths) })
    }
    yield* checkedText(git, [...noHooks, "add", "--intent-to-add", "--force", ...sparseOption, "--pathspec-from-file=-", "--pathspec-file-nul"], { ...currentSideOptions, stdin: joinNulBytes(materializedCurrentPaths) })
    const currentSide = yield* checkedText(git, [...quotedDiff, "--numstat", "--no-renames", "--ignore-submodules=none"], currentSideOptions)
    if (materializedAttributePaths.length === 0) return { tracked, currentSide, indexedCurrentSide }
    const attributeSideIndex = paths.join(temporaryDirectory, "attribute-side-index")
    const attributeSideOptions = { ...processOptions, env: { ...processOptions.env, GIT_INDEX_FILE: attributeSideIndex } } as const
    yield* fs.copy(temporaryIndex, attributeSideIndex, { overwrite: true })
    const materializedAttributeSet = new Set(materializedAttributePaths.map(byteKey))
    const attributeSidePaths = splitNulBytes(yield* checkedBytes(git, ["ls-files", "-z"], attributeSideOptions))
    const removableAttributeSidePaths = attributeSidePaths.filter((path) => !isAttributePath(path) || materializedAttributeSet.has(byteKey(path)))
    if (removableAttributeSidePaths.length > 0) {
      yield* checkedText(git, [...noHooks, "rm", "-r", "--force", "--cached", "--ignore-unmatch", ...sparseOption, "--pathspec-from-file=-", "--pathspec-file-nul"], { ...attributeSideOptions, stdin: joinNulBytes(removableAttributeSidePaths) })
    }
    yield* checkedText(git, [...noHooks, "add", "--intent-to-add", "--force", ...sparseOption, "--pathspec-from-file=-", "--pathspec-file-nul"], { ...attributeSideOptions, stdin: joinNulBytes(materializedAttributePaths) })
    const attributeCurrentSide = yield* checkedText(git, [...quotedDiff, "--numstat", "--no-renames", "--ignore-submodules=none"], attributeSideOptions)
    return { tracked, currentSide: `${currentSide}${attributeCurrentSide}`, indexedCurrentSide }
  })) : yield* Effect.scoped(Effect.gen(function*() {
    const temporaryDirectory = yield* fs.makeTempDirectoryScoped({ prefix: "review-scope-historical-index." })
    const temporaryIndex = paths.join(temporaryDirectory, "index")
    const processOptions = { ...historicalOptions, env: { ...historicalOptions.env, GIT_INDEX_FILE: temporaryIndex, GIT_LITERAL_PATHSPECS: "1" } } as const
    const noHooks = ["-c", "core.hooksPath=/dev/null", ...(supportsSparseAdd ? [] : ["-c", "core.sparseCheckout=false"])] as const
    yield* checkedText(git, [...noHooks, "read-tree", targetOid], processOptions)
    const currentPaths = splitNulBytes(yield* checkedBytes(git, ["diff", "--name-only", "--no-renames", "--ignore-submodules=none", "--diff-filter=ACMRTUXB", "-z", mergeBase, targetOid, "--"], historicalOptions))
    const currentPathSet = new Set(currentPaths.map(byteKey))
    const indexedPaths = splitNulBytes(yield* checkedBytes(git, ["ls-files", "-z"], processOptions))
    const removablePaths = indexedPaths.filter((path) => !isAttributePath(path) && !currentPathSet.has(byteKey(path)))
    if (removablePaths.length > 0) {
      yield* checkedText(git, [...noHooks, "rm", "-r", "--force", "--cached", "--ignore-unmatch", ...sparseOption, "--pathspec-from-file=-", "--pathspec-file-nul"], { ...processOptions, stdin: joinNulBytes(removablePaths) })
    }
    return {
      tracked: yield* checkedText(git, trackedDiffArguments, historicalOptions),
      currentSide: yield* checkedText(git, [...quotedDiff, "--cached", "--numstat", "--no-renames", "--ignore-submodules=none", "--diff-filter=ACMRTUXB", emptyTreeOid, "--"], processOptions),
      indexedCurrentSide: ""
    }
  }))
  const entries = parseNumstat(measured.tracked)
  const currentEntries = [...parseNumstat(measured.currentSide), ...parseNumstat(measured.indexedCurrentSide)]
  const currentEntriesByPath = new Map(currentEntries.map((entry) => [entry.path, entry]))
  const production = emptyCounts()
  const tests = emptyCounts()
  const generated = emptyCounts()
  const changedPaths = new Set<string>()
  const humanAuthoredPaths = new Set<string>()
  const humanAuthoredBinaryPaths = new Set<string>()
  for (const entry of entries) {
    changedPaths.add(entry.classificationPath)
    const currentEntry = currentEntriesByPath.get(entry.path)
    const countedEntry = entry.binary && currentEntry !== undefined && !currentEntry.binary
      ? { ...currentEntry, path: entry.path, classificationPath: entry.classificationPath }
      : entry
    if (isGeneratedPath(entry.classificationPath)) {
      addEntry(generated, countedEntry)
      continue
    }
    if (isTestPath(entry.classificationPath)) addEntry(tests, countedEntry)
    else addEntry(production, countedEntry)
    humanAuthoredPaths.add(entry.path)
    if (entry.binary && currentEntry?.binary === true) humanAuthoredBinaryPaths.add(entry.path)
  }
  return {
    production,
    tests,
    generated,
    changedPaths: [...changedPaths].sort(),
    humanAuthoredPaths: [...humanAuthoredPaths].sort(),
    humanAuthoredBinaryPaths: [...humanAuthoredBinaryPaths].sort()
  } satisfies ScopeMeasurement
})
