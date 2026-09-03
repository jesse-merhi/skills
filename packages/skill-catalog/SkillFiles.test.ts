// File-system helpers are exercised against real directories, symlinks, and files.
// @effect-diagnostics-next-line nodeBuiltinImport:off
import { mkdirSync, mkdtempSync, rmSync, symlinkSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
// @effect-diagnostics-next-line nodeBuiltinImport:off
import { join } from "node:path"
import { afterEach, describe, expect, it } from "vitest"

import { expandHome, parseFrontmatter, pluginPrefixFor, walkFiles } from "./SkillFiles.ts"

const temporaryDirectories: string[] = []

const temporary = (prefix: string) => {
  const directory = mkdtempSync(join(tmpdir(), prefix))
  temporaryDirectories.push(directory)
  return directory
}

const writeSkill = (directory: string, body: string) => {
  mkdirSync(directory, { recursive: true })
  const file = join(directory, "SKILL.md")
  writeFileSync(file, body)
  return file
}

const isSkill = (file: string) => file.endsWith("SKILL.md")

afterEach(() => {
  for (const directory of temporaryDirectories.splice(0)) rmSync(directory, { recursive: true, force: true })
})

describe("walkFiles", () => {
  it("follows symlinked directories and reports the path it walked through", () => {
    const directory = temporary("skill-files-symlink-")
    const target = writeSkill(join(directory, "target", "demo"), "---\nname: demo\n---\n")
    mkdirSync(join(directory, "root"))
    symlinkSync(join(directory, "target", "demo"), join(directory, "root", "demo"))

    expect(walkFiles(join(directory, "root"), isSkill)).toEqual([join(directory, "root", "demo", "SKILL.md")])
    expect(walkFiles(join(directory, "target"), isSkill)).toEqual([target])
  })

  it("visits each real directory once when symlinks alias the same tree", () => {
    const directory = temporary("skill-files-dedupe-")
    writeSkill(join(directory, "root", "demo"), "---\nname: demo\n---\n")
    symlinkSync(join(directory, "root", "demo"), join(directory, "root", "alias"))

    // Either directory entry may be read first, so the walk owes one visit, not a fixed name.
    const walked = walkFiles(join(directory, "root"), isSkill)
    expect(walked).toHaveLength(1)
    expect([join(directory, "root", "alias", "SKILL.md"), join(directory, "root", "demo", "SKILL.md")]).toContain(walked[0])
  })

  it("skips node_modules and .git and stops at the depth limit", () => {
    const directory = temporary("skill-files-limits-")
    writeSkill(join(directory, "node_modules", "pkg"), "---\nname: pkg\n---\n")
    writeSkill(join(directory, ".git", "hooks"), "---\nname: hooks\n---\n")
    writeSkill(join(directory, "one"), "---\nname: one\n---\n")
    writeSkill(join(directory, "one", "two", "three"), "---\nname: three\n---\n")

    expect(walkFiles(directory, isSkill, 1)).toEqual([join(directory, "one", "SKILL.md")])
    expect(walkFiles(directory, isSkill, 3).sort()).toEqual([
      join(directory, "one", "SKILL.md"),
      join(directory, "one", "two", "three", "SKILL.md")
    ])
  })

  it("returns nothing for a missing root", () => {
    expect(walkFiles(join(temporary("skill-files-missing-"), "absent"), isSkill)).toEqual([])
  })
})

describe("parseFrontmatter", () => {
  it("reads a quoted name and a single-line description", () => {
    const directory = temporary("skill-files-frontmatter-")
    const file = writeSkill(join(directory, "demo"), `---
name: "demo"
description: 'Reviews one target.'
---
# Body
`)

    expect(parseFrontmatter(file)).toEqual({ name: "demo", description: "Reviews one target.", body: "# Body\n" })
  })

  it("joins a block description into one line", () => {
    const directory = temporary("skill-files-block-")
    const file = writeSkill(join(directory, "demo"), `---
name: demo
description: |
  First line.
  Second line.
other: ignored
---
body
`)

    expect(parseFrontmatter(file)?.description).toBe("First line. Second line.")
  })

  it("returns null when the file has no closing frontmatter fence", () => {
    const directory = temporary("skill-files-unterminated-")
    expect(parseFrontmatter(writeSkill(join(directory, "demo"), "---\nname: demo\n"))).toBeNull()
    expect(parseFrontmatter(writeSkill(join(directory, "plain"), "# no frontmatter\n"))).toBeNull()
  })
})

describe("path helpers", () => {
  it("expands a leading tilde against the supplied home", () => {
    expect(expandHome("~/skills", "/home/user")).toBe("/home/user/skills")
    expect(expandHome("~", "/home/user")).toBe("/home/user")
    expect(expandHome("~backup/skills", "/home/user")).toBe("~backup/skills")
  })

  it("names the plugin that owns a cached skill", () => {
    expect(pluginPrefixFor("/root/plugins/cache/source/my-plugin/1.0.0/skills/demo/SKILL.md")).toBe("my-plugin")
    expect(pluginPrefixFor("/root/skills/demo/SKILL.md")).toBeNull()
  })
})
