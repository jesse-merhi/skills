import * as Effect from "effect/Effect"
import * as Option from "effect/Option"
import * as Schema from "effect/Schema"
// Catalogue discovery snapshots large directory trees synchronously; Node's
// Dirent API avoids thousands of Effect allocations without changing ownership.
// @effect-diagnostics-next-line nodeBuiltinImport:off
import fs from "node:fs"
import os from "node:os"
// @effect-diagnostics-next-line nodeBuiltinImport:off
import path from "node:path"
import { fileURLToPath } from "node:url"

import { checkedTrimmedText } from "../../../packages/effect-cli/CheckedProcess.ts"
import { trustedExecutable } from "../../../packages/effect-cli/TrustedExecutable.ts"
import { exists, parseFrontmatter, pluginPrefixFor, walkFiles } from "../../../packages/skill-catalog/SkillFiles.ts"

export class SkillProfileError extends Schema.TaggedError<SkillProfileError>()("SkillProfileError", {
  message: Schema.String
}) {}

export const ProfileDefinition = Schema.Struct({
  name: Schema.String,
  description: Schema.String,
  model: Schema.optional(Schema.String),
  model_reasoning_effort: Schema.Literals(["low", "medium", "high", "xhigh", "max", "ultra"]),
  sandbox_mode: Schema.Literals(["read-only", "workspace-write", "danger-full-access"]),
  instructions: Schema.String,
  allow: Schema.Array(Schema.String)
})
export type ProfileDefinition = typeof ProfileDefinition.Type

export interface LoadedProfile {
  readonly role: string
  readonly definition: ProfileDefinition
  readonly instructions: string
}

export interface DiscoveredSkill {
  readonly name: string
  readonly plugin: string | undefined
  readonly path: string
}

export interface CatalogueOptions {
  readonly codexHome: string
  readonly home: string
  readonly repos: ReadonlyArray<string>
}

export interface CatalogueEntry {
  readonly skill: DiscoveredSkill
  readonly enabled: boolean
}

export interface ProfileApplication {
  readonly entries: ReadonlyArray<CatalogueEntry>
  readonly disabledPaths: ReadonlyArray<string>
  readonly missingAllow: ReadonlyArray<string>
}

export interface SkillsConfigOptions {
  readonly codexHome?: string | undefined
  readonly cwd?: string | undefined
  readonly home?: string | undefined
  readonly repos?: ReadonlyArray<string> | undefined
}

export interface SkillsConfigResult {
  readonly argument: string
  readonly disabledCount: number
  readonly missingAllow: ReadonlyArray<string>
}

// Profiles ship beside this module, so the installed symlinked copy resolves
// them through its own module URL rather than the caller's working directory.
const profilesDirectory = fileURLToPath(new URL("../profiles/", import.meta.url))
const ProfileJson = Schema.fromJsonString(ProfileDefinition)

// Environment defaults are captured once at the module boundary.
// @effect-diagnostics-next-line processEnv:off
const profileEnvironment = { CODEX_HOME: process.env.CODEX_HOME }

export const loadProfile = Effect.fn("SkillProfile.loadProfile")(function*(role: string) {
  if (!/^[A-Za-z0-9][A-Za-z0-9_.-]*$/.test(role)) {
    return yield* new SkillProfileError({ message: `invalid profile name "${role}"; use letters, digits, dots, dashes, and underscores` })
  }
  const definitionPath = path.join(profilesDirectory, `${role}.json`)
  if (!exists(definitionPath)) return yield* new SkillProfileError({ message: `no such skill profile: ${definitionPath}` })
  const definition = yield* Schema.decodeUnknownEffect(ProfileJson)(fs.readFileSync(definitionPath, "utf8")).pipe(
    Effect.mapError((error) => new SkillProfileError({ message: `invalid skill profile ${definitionPath}: ${error}` }))
  )
  const instructionsPath = path.join(profilesDirectory, definition.instructions)
  if (!exists(instructionsPath)) {
    return yield* new SkillProfileError({ message: `skill profile ${role} points at missing instructions ${instructionsPath}` })
  }
  return { role, definition, instructions: fs.readFileSync(instructionsPath, "utf8") } satisfies LoadedProfile
})

const isSkillFile = (file: string) => path.basename(file) === "SKILL.md"

// Codex matches the path it discovered through each root, so a skill reached
// through a symlinked directory keeps the root-joined path, not its realpath.
export const discoverCatalogue = (options: CatalogueOptions): ReadonlyArray<DiscoveredSkill> => {
  const codexSkills = path.join(options.codexHome, "skills")
  // Codex keeps its system skills regardless of `skills.config`, so entries for
  // them would only be noise.
  const systemPrefix = `${path.join(codexSkills, ".system")}${path.sep}`
  const roots = [
    codexSkills,
    path.join(options.codexHome, "plugins", "cache"),
    path.join(options.home, ".agents", "skills"),
    ...options.repos.map((repo) => path.join(repo, ".agents", "skills"))
  ]
  const byPath = new Map<string, DiscoveredSkill>()
  for (const root of roots) {
    for (const file of walkFiles(root, isSkillFile, 10)) {
      if (file.startsWith(systemPrefix) || byPath.has(file)) continue
      const parsed = parseFrontmatter(file)
      if (parsed === null) continue
      byPath.set(file, {
        name: parsed.name === undefined || parsed.name.length === 0 ? path.basename(path.dirname(file)) : parsed.name,
        plugin: pluginPrefixFor(file) ?? undefined,
        path: file
      })
    }
  }
  return [...byPath.values()].sort((left, right) => left.path < right.path ? -1 : left.path > right.path ? 1 : 0)
}

export const applyProfile = (allow: ReadonlyArray<string>, catalogue: ReadonlyArray<DiscoveredSkill>): ProfileApplication => {
  const allowed = new Set(allow)
  const matched = new Set<string>()
  const entries = catalogue.map((skill) => {
    const names = skill.plugin === undefined ? [skill.name] : [skill.name, `${skill.plugin}:${skill.name}`]
    const hits = names.filter((name) => allowed.has(name))
    for (const hit of hits) matched.add(hit)
    return { skill, enabled: hits.length > 0 } satisfies CatalogueEntry
  })
  return {
    entries,
    disabledPaths: entries.filter((entry) => !entry.enabled).map((entry) => entry.skill.path),
    missingAllow: allow.filter((name) => !matched.has(name))
  }
}

const escapeTomlString = (value: string) => value.replaceAll("\\", "\\\\").replaceAll("\"", "\\\"")

export const renderConfigArgument = (disabledPaths: ReadonlyArray<string>): string =>
  `skills.config=[${disabledPaths.map((disabled) => `{path="${escapeTomlString(disabled)}",enabled=false}`).join(",")}]`

export const renderConfigBlocks = (disabledPaths: ReadonlyArray<string>): string =>
  disabledPaths.map((disabled) => `[[skills.config]]\npath = "${escapeTomlString(disabled)}"\nenabled = false\n`).join("\n")

export const renderAgentFile = Effect.fn("SkillProfile.renderAgentFile")(function*(profile: LoadedProfile, disabledPaths: ReadonlyArray<string>) {
  const instructions = profile.instructions.replace(/\n$/, "")
  if (instructions.includes("'''")) {
    return yield* new SkillProfileError({ message: `skill profile ${profile.role} instructions contain ''' and cannot be written as a TOML multi-line literal string` })
  }
  const header = [
    `# Generated by skills/skill-profiles/scripts/skills-profile from profiles/${profile.role}.json; edit the profile, then regenerate.`,
    `name = "${escapeTomlString(profile.definition.name)}"`,
    `description = "${escapeTomlString(profile.definition.description)}"`,
    ...(profile.definition.model === undefined ? [] : [`model = "${escapeTomlString(profile.definition.model)}"`]),
    `model_reasoning_effort = "${profile.definition.model_reasoning_effort}"`,
    `sandbox_mode = "${profile.definition.sandbox_mode}"`,
    "developer_instructions = '''",
    instructions,
    "'''"
  ].join("\n")
  return `${header}\n\n${renderConfigBlocks(disabledPaths)}`
})

const trustedProjectPaths = (codexHome: string): ReadonlyArray<string> => {
  const config = path.join(codexHome, "config.toml")
  if (!exists(config)) return []
  const projects: string[] = []
  for (const line of fs.readFileSync(config, "utf8").split(/\r?\n/)) {
    const match = /^\[projects\."(.+)"\]$/.exec(line)
    if (match?.[1] !== undefined) projects.push(match[1])
  }
  return projects
}

const realPath = (candidate: string) => {
  try {
    return fs.realpathSync(candidate)
  } catch {
    return path.resolve(candidate)
  }
}

// Codex also loads `.agents/skills` from every directory between the working
// directory and the repository root, so each of those ancestors is a root too.
const workingDirectoryRoots = (cwd: string, repository: string | undefined): ReadonlyArray<string> => {
  const roots: Array<string> = []
  let cursor = cwd
  while (true) {
    roots.push(cursor)
    const parent = path.dirname(cursor)
    if (cursor === repository || parent === cursor) return roots
    cursor = parent
  }
}

export const catalogueOptions = Effect.fn("SkillProfile.catalogueOptions")(function*(options?: SkillsConfigOptions) {
  const home = options?.home ?? os.homedir()
  const configured = profileEnvironment.CODEX_HOME
  const codexHome = options?.codexHome ?? (configured !== undefined && configured.length > 0 ? configured : path.join(home, ".codex"))
  const cwd = realPath(options?.cwd ?? process.cwd())
  const git = yield* trustedExecutable("git", cwd)
  const repository = yield* checkedTrimmedText(git, ["rev-parse", "--show-toplevel"], { cwd }).pipe(Effect.option)
  const toplevel = Option.isSome(repository) && repository.value.length > 0 ? realPath(repository.value) : undefined
  // Codex reports every repository root as a real absolute path, so extra and
  // trusted repositories are normalised the same way before their skills are listed.
  const repos = [
    ...workingDirectoryRoots(cwd, toplevel),
    ...trustedProjectPaths(codexHome).map(realPath),
    ...(options?.repos ?? []).map(realPath)
  ]
  return { codexHome, home, repos: [...new Set(repos)] } satisfies CatalogueOptions
})

export const skillsConfigArgument = Effect.fn("SkillProfile.skillsConfigArgument")(function*(role: string, options?: SkillsConfigOptions) {
  const profile = yield* loadProfile(role)
  const applied = applyProfile(profile.definition.allow, discoverCatalogue(yield* catalogueOptions(options)))
  return {
    argument: renderConfigArgument(applied.disabledPaths),
    disabledCount: applied.disabledPaths.length,
    missingAllow: applied.missingAllow
  } satisfies SkillsConfigResult
})
