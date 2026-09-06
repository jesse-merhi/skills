import * as Schema from "effect/Schema"
import { execFileSync } from "node:child_process"
import { createHash } from "node:crypto"
import { existsSync, lstatSync, readdirSync, readFileSync, readlinkSync, realpathSync } from "node:fs"
import path from "node:path"

import { discoverSkills } from "../../skills/writing-for-agents/scripts/materialize-skill-variants.mjs"
import { SourceBundle } from "./Model.ts"

export function repositoryKey(root) {
  const common = execFileSync("git", ["rev-parse", "--path-format=absolute", "--git-common-dir"], { cwd: root, encoding: "utf8" }).trim()
  return createHash("sha256").update(realpathSync(common)).digest("hex").slice(0, 16)
}

export function captureSkill(skill, head) {
  const files = []
  const visit = (directory) => {
    for (const entry of readdirSync(directory, { withFileTypes: true }).sort((left, right) => left.name.localeCompare(right.name))) {
      if (["node_modules", ".git"].includes(entry.name)) continue
      const filename = path.join(directory, entry.name)
      const relative = path.relative(skill.directory, filename).split(path.sep).join("/")
      const stat = lstatSync(filename)
      if (stat.isSymbolicLink()) {
        files.push({ path: relative, content: readlinkSync(filename), encoding: "symlink", mode: stat.mode })
      } else if (stat.isDirectory()) {
        visit(filename)
      } else if (stat.isFile()) {
        const bytes = readFileSync(filename)
        let content
        let encoding
        try {
          content = new TextDecoder("utf-8", { fatal: true, ignoreBOM: true }).decode(bytes)
          encoding = content.includes("\0") ? "base64" : "utf8"
        } catch {
          encoding = "base64"
        }
        files.push({ path: relative, content: encoding === "base64" ? bytes.toString("base64") : content, encoding, mode: stat.mode })
      } else {
        throw new Error(`Unsupported source file: ${filename}`)
      }
    }
  }
  const entryPath = realpathSync(path.join(skill.directory, "SKILL.md"))
  if (!entryPath.startsWith(realpathSync(skill.directory) + path.sep)) throw new Error(`Skill entry escapes its source: ${skill.name}`)
  visit(skill.directory)
  return Schema.decodeUnknownSync(SourceBundle)({
    name: skill.name,
    directory: skill.directory,
    entry: readFileSync(entryPath, "utf8"),
    files,
    head,
    capturedAt: new Date().toISOString(),
    fingerprint: createHash("sha256").update(JSON.stringify(files)).digest("hex")
  })
}

export function captureRepository(root) {
  const head = execFileSync("git", ["rev-parse", "HEAD"], { cwd: root, encoding: "utf8" }).trim()
  return discoverSkills(path.join(root, "skills")).map((skill) => captureSkill(skill, head))
}

export function capturePersonalRoots(roots, existing = []) {
  const sources = []
  const names = new Set(existing.map((source) => source.name))
  const directories = new Set(existing.map((source) => realpathSync(source.directory)))
  for (const root of roots) {
    if (!existsSync(root)) continue
    for (const entry of readdirSync(root, { withFileTypes: true })) {
      if (entry.name.startsWith(".") || (!entry.isDirectory() && !entry.isSymbolicLink())) continue
      const candidate = path.join(root, entry.name)
      if (!existsSync(path.join(candidate, "SKILL.md"))) continue
      const directory = realpathSync(candidate)
      if (directories.has(directory)) continue
      const [skill] = discoverSkills(directory)
      if (!skill || names.has(skill.name)) continue
      const source = captureSkill(skill, "external-local-snapshot")
      sources.push(source)
      names.add(skill.name)
      directories.add(directory)
    }
  }
  return sources
}
