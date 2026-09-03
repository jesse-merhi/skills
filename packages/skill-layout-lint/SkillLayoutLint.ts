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
  readonly root: string
  readonly directory: string
  readonly content: string
  readonly references: ReadonlyArray<ReferenceSource>
}

export interface LintReport {
  readonly findings: ReadonlyArray<Finding>
  readonly referenceCount: number
  readonly skillCount: number
}

const maximumBodyLines = 500

const skillFileName = "SKILL.md"
const referencesDirectoryName = "references"
const attributionPrefix = "upstream-license"
const vendorDirectoryName = "node_modules"

const fenceDelimiter = /^\s*(`{3,}|~{3,})/u
const linkPattern = /\[[^\]]*\]\(([^)]*)\)/gu
const linkDefinitionPattern = /^\s{0,3}\[[^\]]+\]:\s*<?([^\s>]+)>?/u
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
  let open: { readonly character: string; readonly length: number } | undefined = undefined
  return lines.map((line) => {
    const delimiter = fenceDelimiter.exec(line)?.[1]
    if (delimiter === undefined) return open !== undefined
    if (open === undefined) open = { character: delimiter[0] ?? "", length: delimiter.length }
    else if (delimiter[0] === open.character && delimiter.length >= open.length) open = undefined
    return true
  })
}

const linkTargets = (line: string): Array<string> => {
  const targets: Array<string> = []
  const candidates = [...line.matchAll(linkPattern)].map((match) => match[1] ?? "")
  const definition = linkDefinitionPattern.exec(line)?.[1]
  if (definition !== undefined) candidates.push(definition)
  for (const candidate of candidates) {
    const target = candidate.trim().split(whitespace)[0]?.split("#")[0] ?? ""
    if (target.length === 0 || urlScheme.test(target)) continue
    targets.push(target)
  }
  return targets
}

const isWithin = (path: Path.Path, base: string, target: string): boolean => target.startsWith(base + path.sep)

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
    message: `body is ${count} lines; keep the SKILL.md body at ${maximumBodyLines} lines or fewer`,
    path: skillPath,
    severity: "error"
  }]
}

const chainFindings = (path: Path.Path, skill: SkillSource, skillPath: string, reference: ReferenceSource): Array<Finding> => {
  const directory = path.dirname(reference.path)
  const lines = splitLines(reference.content)
  const fenced = fenceMask(lines)
  const findings: Array<Finding> = []
  lines.forEach((line, index) => {
    if (fenced[index] === true) return
    for (const target of linkTargets(line)) {
      const resolved = path.resolve(directory, target)
      if (!resolved.endsWith(".md") || resolved === skillPath) continue
      if (!isWithin(path, skill.root, resolved)) continue
      findings.push({
        line: index + 1,
        message: `links to ${path.relative(skill.directory, resolved)}; a reference may link only back to its own ${skillFileName}`,
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
      if (!isWithin(path, referencesDirectory, resolved)) continue
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

const undisclosedFindings = (path: Path.Path, skill: SkillSource): Array<Finding> => {
  const lines = splitLines(skill.content)
  const fenced = fenceMask(lines)
  const linked = new Set<string>()
  lines.forEach((line, index) => {
    if (fenced[index] === true) return
    for (const target of linkTargets(line)) linked.add(path.resolve(skill.directory, target))
  })
  return skill.references.filter((reference) => !linked.has(reference.path)).map((reference) => ({
    line: undefined,
    message: `${path.relative(skill.directory, reference.path)} is not linked from ${skillFileName}; link every reference from ${skillFileName} or delete it`,
    path: reference.path,
    severity: "error"
  }))
}

export const analyzeSkill = (path: Path.Path, skill: SkillSource): Array<Finding> => {
  const skillPath = path.join(skill.directory, skillFileName)
  return [
    ...bodyFindings(skillPath, skill.content),
    ...skill.references.flatMap((reference) => chainFindings(path, skill, skillPath, reference)),
    ...undisclosedFindings(path, skill),
    ...fanOutFindings(path, skill.directory, skillPath, skill.content)
  ]
}

export const formatFinding = (finding: Finding): string =>
  `${finding.severity}: ${finding.path}${finding.line === undefined ? "" : `:${finding.line}`}: ${finding.message}`

export const isError = (finding: Finding): boolean => finding.severity === "error"

export const lintSkillsRoot = Effect.fn("SkillLayoutLint.lintSkillsRoot")(function*(root: string) {
  const fileSystem = yield* FileSystem.FileSystem
  const path = yield* Path.Path
  const entries = yield* fileSystem.readDirectory(root, { recursive: true })
  const files = entries
    .filter((entry) => !entry.split(path.sep).includes(vendorDirectoryName))
    .map((entry) => path.join(root, entry))
    .toSorted()
  const skillPaths = files.filter((file) => path.basename(file) === skillFileName)
  const findings: Array<Finding> = []
  let referenceCount = 0
  for (const skillPath of skillPaths) {
    const directory = path.dirname(skillPath)
    const referencesDirectory = path.join(directory, referencesDirectoryName)
    const referencePaths = files.filter((file) =>
      isWithin(path, referencesDirectory, file) && file.endsWith(".md") && !path.basename(file).startsWith(attributionPrefix))
    const content = yield* fileSystem.readFileString(skillPath)
    const references = yield* Effect.forEach(referencePaths, (referencePath) =>
      Effect.map(fileSystem.readFileString(referencePath), (referenceContent) => ({ content: referenceContent, path: referencePath })))
    referenceCount += references.length
    findings.push(...analyzeSkill(path, { content, directory, references, root }))
  }
  const report: LintReport = { findings, referenceCount, skillCount: skillPaths.length }
  return report
})
