// Skill discovery walks large directory trees synchronously; Node's Dirent API
// avoids thousands of Effect allocations without changing lifecycle ownership.
// @effect-diagnostics-next-line nodeBuiltinImport:off
import fs from "node:fs"
// @effect-diagnostics-next-line nodeBuiltinImport:off
import path from "node:path"

export interface SkillFrontmatter {
  readonly name?: string
  readonly description?: string
  readonly body: string
}

export function expandHome(input: string, home: string): string {
  return input.replace(/^~(?=$|\/)/, home)
}

export function exists(input: string): boolean {
  try {
    fs.accessSync(input)
    return true
  } catch {
    return false
  }
}

export function walkFiles(root: string, predicate: (file: string) => boolean, maxDepth = 8): string[] {
  const out: string[] = []
  const seen = new Set<string>()
  function walk(dir: string, depth: number) {
    if (depth > maxDepth) return
    let real = dir
    try {
      real = fs.realpathSync(dir)
    } catch {
      return
    }
    if (seen.has(real)) return
    seen.add(real)
    let entries: fs.Dirent[]
    try {
      entries = fs.readdirSync(dir, { withFileTypes: true })
    } catch {
      return
    }
    for (const entry of entries) {
      if (entry.name === "node_modules" || entry.name === ".git") continue
      const file = path.join(dir, entry.name)
      if (entry.isDirectory() || entry.isSymbolicLink()) {
        let stat: fs.Stats
        try {
          stat = fs.statSync(file)
        } catch {
          continue
        }
        if (stat.isDirectory()) walk(file, depth + 1)
      } else if (entry.isFile() && predicate(file)) {
        out.push(file)
      }
    }
  }
  if (exists(root)) walk(root, 0)
  return out
}

export function sanitizeSingleLine(value: string): string {
  return value.replace(/[\r\n\t]+/g, " ").replace(/\s+/g, " ").trim()
}

function parseYamlScalar(raw: string): string {
  const value = raw.trim()
  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    return value.slice(1, -1)
  }
  return value
}

export function parseFrontmatter(file: string): SkillFrontmatter | null {
  const text = fs.readFileSync(file, "utf8")
  const lines = text.split(/\r?\n/)
  if (lines[0]?.trim() !== "---") return null
  const fm: string[] = []
  let end = -1
  for (let i = 1; i < lines.length; i++) {
    if (lines[i]?.trim() === "---") {
      end = i
      break
    }
    fm.push(lines[i] ?? "")
  }
  if (end < 0) return null
  let name: string | undefined
  let description: string | undefined
  for (let i = 0; i < fm.length; i++) {
    const line = fm[i] ?? ""
    const match = /^([A-Za-z0-9_-]+):\s*(.*)$/.exec(line)
    if (!match) continue
    const key = match[1]
    const raw = match[2] ?? ""
    if (key === "name") name = sanitizeSingleLine(parseYamlScalar(raw))
    if (key === "description") {
      if (raw.trim() === "|" || raw.trim() === ">") {
        const block: string[] = []
        for (let j = i + 1; j < fm.length; j++) {
          if (/^[A-Za-z0-9_-]+:\s*/.test(fm[j] ?? "")) break
          block.push((fm[j] ?? "").replace(/^\s{2}/, ""))
        }
        description = sanitizeSingleLine(block.join(" "))
      } else {
        description = sanitizeSingleLine(parseYamlScalar(raw))
      }
    }
  }
  return { ...(name === undefined ? {} : { name }), ...(description === undefined ? {} : { description }), body: lines.slice(end + 1).join("\n") }
}

// Plugin skills live at cache/<source>/<plugin>/<version>/skills/<skill>/SKILL.md,
// with one legacy staging directory that shifts the plugin one segment deeper.
export function pluginPrefixFor(file: string): string | null {
  const parts = file.split(path.sep)
  const cache = parts.indexOf("cache")
  const skills = parts.lastIndexOf("skills")
  if (cache >= 0 && skills > cache + 1) {
    const maybePlugin = parts[cache + 2]
    if (maybePlugin && maybePlugin !== "plugin-install-VGdwGs") return maybePlugin
    return parts[cache + 3] ?? null
  }
  return null
}
