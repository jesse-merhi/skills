import type * as PlatformError from "effect/PlatformError"

import * as Effect from "effect/Effect"
import * as FileSystem from "effect/FileSystem"
import * as Path from "effect/Path"

export type Severity = "error" | "warning"

export interface Finding {
  readonly severity: Severity
  readonly path: string
  readonly line: number | undefined
  readonly message: string
}

export interface ReferenceSource {
  readonly path: string
  readonly content: string
}

export interface SkillSource {
  readonly directory: string
  readonly content: string
  readonly references: ReadonlyArray<ReferenceSource>
}

export interface LintReport {
  readonly findings: ReadonlyArray<Finding>
  readonly referenceCount: number
  readonly skillCount: number
}

export const maximumBodyLines = 500

const skillFileName = "SKILL.md"
const referencesDirectoryName = "references"
const attributionPrefix = "upstream-license"

const fenceDelimiter = /^\s*(?:`{3,}|~{3,})/u
const linkPattern = /\[[^\]]*\]\(([^)]*)\)/gu
const numberedItemStart = /^\s*\d+[.)]\s/u
const headingPattern = /^(#{1,6})\s+(.*)$/u
const indented = /^\s/u
const urlScheme = /^[A-Za-z][A-Za-z\d+.-]*:/u
const whitespace = /\s+/u

const splitLines = (content: string): Array<string> => {
  const lines = content.split("\n")
  if (lines.length > 1 && lines.at(-1) === "") lines.pop()
  return lines
}

const fenceMask = (lines: ReadonlyArray<string>): Array<boolean> => {
  let open = false
  return lines.map((line) => {
    if (!fenceDelimiter.test(line)) return open
    open = !open
    return true
  })
}

const linkTargets = (line: string): Array<string> => {
  const targets: Array<string> = []
  for (const match of line.matchAll(linkPattern)) {
    const target = (match[1] ?? "").trim().split(whitespace)[0]?.split("#")[0] ?? ""
    if (target.length === 0 || urlScheme.test(target)) continue
    targets.push(target)
  }
  return targets
}

const containedPath = (path: Path.Path, base: string, target: string): string | undefined => {
  const relative = path.relative(base, target)
  const escapes = relative.length === 0 || relative === ".." || relative.startsWith(`..${path.sep}`)
  return escapes || path.isAbsolute(relative) ? undefined : relative
}

const bodyLineCount = (content: string): number => {
  const lines = splitLines(content)
  if (lines[0]?.trim() !== "---") return lines.length
  const closing = lines.findIndex((line, index) => index > 0 && line.trim() === "---")
  return closing === -1 ? lines.length : lines.length - closing - 1
}

const bodyFindings = (skillPath: string, content: string): Array<Finding> => {
  const count = bodyLineCount(content)
  if (count <= maximumBodyLines) return []
  return [{
    line: undefined,
    message: `body is ${count} lines; keep the SKILL.md body under ${maximumBodyLines} lines`,
    path: skillPath,
    severity: "error"
  }]
}

const chainFindings = (path: Path.Path, skillDirectory: string, skillPath: string, reference: ReferenceSource): Array<Finding> => {
  const directory = path.dirname(reference.path)
  const lines = splitLines(reference.content)
  const fenced = fenceMask(lines)
  const findings: Array<Finding> = []
  lines.forEach((line, index) => {
    if (fenced[index] === true) return
    for (const target of linkTargets(line)) {
      const resolved = path.resolve(directory, target)
      if (!resolved.endsWith(".md") || resolved === skillPath) continue
      const relative = containedPath(path, skillDirectory, resolved)
      if (relative === undefined) continue
      findings.push({
        line: index + 1,
        message: `links to ${relative}; a reference may link only back to ${skillFileName}`,
        path: reference.path,
        severity: "error"
      })
    }
  })
  return findings
}

interface LineContext {
  readonly inNumberedItem: boolean
  readonly inContextPointers: boolean
}

const lineContexts = (lines: ReadonlyArray<string>, fenced: ReadonlyArray<boolean>): Array<LineContext> => {
  let inNumberedItem = false
  let pointerLevel: number | undefined = undefined
  return lines.map((line, index) => {
    if (fenced[index] === true) return { inContextPointers: pointerLevel !== undefined, inNumberedItem }
    const heading = headingPattern.exec(line)
    if (heading !== null) {
      const level = heading[1]?.length ?? 1
      if (pointerLevel !== undefined && level <= pointerLevel) pointerLevel = undefined
      const inContextPointers = pointerLevel !== undefined
      if (heading[2]?.trim().toLowerCase() === "context pointers") pointerLevel = level
      inNumberedItem = false
      return { inContextPointers, inNumberedItem }
    }
    if (numberedItemStart.test(line)) inNumberedItem = true
    else if (inNumberedItem && line.trim().length > 0 && !indented.test(line)) inNumberedItem = false
    return { inContextPointers: pointerLevel !== undefined, inNumberedItem }
  })
}

const fanOutFindings = (path: Path.Path, skillDirectory: string, skillPath: string, content: string): Array<Finding> => {
  const lines = splitLines(content)
  const fenced = fenceMask(lines)
  const contexts = lineContexts(lines, fenced)
  const referencesDirectory = path.join(skillDirectory, referencesDirectoryName)
  const steps = new Set<string>()
  const pointers = new Set<string>()
  lines.forEach((line, index) => {
    const context = contexts[index]
    if (fenced[index] === true || context === undefined) return
    if (!context.inNumberedItem && !context.inContextPointers) return
    for (const target of linkTargets(line)) {
      const resolved = path.resolve(skillDirectory, target)
      if (containedPath(path, referencesDirectory, resolved) === undefined) continue
      const display = path.relative(skillDirectory, resolved)
      if (context.inNumberedItem) steps.add(display)
      if (context.inContextPointers) pointers.add(display)
    }
  })
  return [...steps].filter((target) => pointers.has(target)).sort().map((target) => ({
    line: undefined,
    message: `${target} is linked from a numbered step and from Context pointers; decide whether to inline it`,
    path: skillPath,
    severity: "warning"
  }))
}

export const analyzeSkill = (path: Path.Path, skill: SkillSource): Array<Finding> => {
  const skillPath = path.join(skill.directory, skillFileName)
  return [
    ...bodyFindings(skillPath, skill.content),
    ...skill.references.flatMap((reference) => chainFindings(path, skill.directory, skillPath, reference)),
    ...fanOutFindings(path, skill.directory, skillPath, skill.content)
  ]
}

export const formatFinding = (finding: Finding): string =>
  `${finding.severity}: ${finding.path}${finding.line === undefined ? "" : `:${finding.line}`}: ${finding.message}`

export const isError = (finding: Finding): boolean => finding.severity === "error"

const walkFiles: (directory: string) => Effect.Effect<
  Array<string>,
  PlatformError.PlatformError,
  FileSystem.FileSystem | Path.Path
> = Effect.fn("SkillLayoutLint.walkFiles")(function*(directory: string) {
  const fileSystem = yield* FileSystem.FileSystem
  const path = yield* Path.Path
  const entries = yield* fileSystem.readDirectory(directory)
  const files: Array<string> = []
  for (const entry of entries.toSorted()) {
    if (entry === "node_modules") continue
    const full = path.join(directory, entry)
    const info = yield* fileSystem.stat(full)
    if (info.type === "Directory") files.push(...(yield* walkFiles(full)))
    else if (info.type === "File") files.push(full)
  }
  return files
})

export const lintSkillsRoot = Effect.fn("SkillLayoutLint.lintSkillsRoot")(function*(root: string) {
  const fileSystem = yield* FileSystem.FileSystem
  const path = yield* Path.Path
  const files = yield* walkFiles(root)
  const skillPaths = files.filter((file) => path.basename(file) === skillFileName)
  const findings: Array<Finding> = []
  let referenceCount = 0
  for (const skillPath of skillPaths) {
    const directory = path.dirname(skillPath)
    const prefix = path.join(directory, referencesDirectoryName) + path.sep
    const referencePaths = files.filter((file) =>
      file.startsWith(prefix) && file.endsWith(".md") && !path.basename(file).startsWith(attributionPrefix))
    const content = yield* fileSystem.readFileString(skillPath)
    const references = yield* Effect.forEach(referencePaths, (referencePath) =>
      Effect.map(fileSystem.readFileString(referencePath), (referenceContent) => ({ content: referenceContent, path: referencePath })))
    referenceCount += references.length
    findings.push(...analyzeSkill(path, { content, directory, references }))
  }
  const report: LintReport = { findings, referenceCount, skillCount: skillPaths.length }
  return report
})
