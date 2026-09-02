import { NodeServices } from "@effect/platform-node"
import * as Effect from "effect/Effect"
import * as Path from "effect/Path"
// @effect-diagnostics-next-line nodeBuiltinImport:off
import { spawnSync } from "node:child_process"
// @effect-diagnostics-next-line nodeBuiltinImport:off
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
// @effect-diagnostics-next-line nodeBuiltinImport:off
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"
import { afterEach, describe, expect, it } from "vitest"

import { analyzeSkill, lintSkillsRoot, type SkillSource } from "./SkillLayoutLint.ts"

const packageDirectory = dirname(fileURLToPath(import.meta.url))
const fixture = (name: string): string => join(packageDirectory, "fixtures", name)
const lintScript = join(packageDirectory, "lint.ts")

const temporaryDirectories: string[] = []

afterEach(() => {
  for (const directory of temporaryDirectories.splice(0)) rmSync(directory, { recursive: true, force: true })
})

const temporaryRoot = (): string => {
  const directory = mkdtempSync(join(tmpdir(), "skill-layout-lint-"))
  temporaryDirectories.push(directory)
  return directory
}

const run = <A, E>(effect: Effect.Effect<A, E, NodeServices.NodeServices>): Promise<A> =>
  // @effect-diagnostics-next-line strictEffectProvide:off
  Effect.runPromise(Effect.provide(effect, NodeServices.layer))

const lint = (root: string) => run(lintSkillsRoot(root))

const analyze = (skill: SkillSource) =>
  run(Effect.gen(function*() {
    const path = yield* Path.Path
    return analyzeSkill(path, skill)
  }))

const body = (lines: number): string => Array.from({ length: lines }, (_, index) => `line ${index + 1}`).join("\n")

const skillWithBody = (content: string): SkillSource => ({ content, directory: "/skills/long", references: [] })

const relativeFindings = (findings: ReadonlyArray<{ readonly path: string; readonly line: number | undefined; readonly message: string }>, root: string) =>
  findings.map((finding) => ({ line: finding.line, message: finding.message, path: finding.path.slice(root.length + 1) }))

describe("lintSkillsRoot", () => {
  it("reports no findings for a skill that keeps conditional detail in references", async () => {
    const report = await lint(fixture("clean"))

    expect(report.findings).toEqual([])
    expect(report.skillCount).toBe(1)
  })

  it("excludes upstream-license attribution files from the reference set", async () => {
    const report = await lint(fixture("clean"))

    expect(report.referenceCount).toBe(1)
  })

  it("flags only reference-to-reference links, with the line that made each link", async () => {
    const root = fixture("chain")
    const report = await lint(root)

    expect(relativeFindings(report.findings, root)).toEqual([
      { line: 3, message: "links to references/detail.md; a reference may link only back to SKILL.md", path: "chained/references/hub.md" },
      { line: 4, message: "links to references/detail.md; a reference may link only back to SKILL.md", path: "chained/references/hub.md" },
      { line: 5, message: "links to references/detail.md; a reference may link only back to SKILL.md", path: "chained/references/hub.md" },
      { line: 6, message: "links to references/references/detail.md; a reference may link only back to SKILL.md", path: "chained/references/hub.md" }
    ])
    expect(report.findings.every((finding) => finding.severity === "error")).toBe(true)
  })

  it("warns once for a reference linked from both a numbered step and Context pointers", async () => {
    const root = fixture("fanout")
    const report = await lint(root)

    expect(relativeFindings(report.findings, root)).toEqual([
      { line: undefined, message: "references/guide.md is linked from a numbered step and from Context pointers; decide whether to inline it", path: "both/SKILL.md" }
    ])
    expect(report.findings.every((finding) => finding.severity === "warning")).toBe(true)
  })

  it("discovers skills nested below the skills root", async () => {
    const report = await lint(fixture("nested"))

    expect(report.skillCount).toBe(1)
    expect(report.findings).toEqual([])
  })

  it("skips skills vendored under node_modules", async () => {
    const root = temporaryRoot()
    const vendored = join(root, "node_modules", "vendored")
    mkdirSync(join(vendored, "references"), { recursive: true })
    writeFileSync(join(vendored, "SKILL.md"), "---\nname: vendored\ndescription: 'y'\n---\n\n[a](references/a.md)\n")
    writeFileSync(join(vendored, "references", "a.md"), "[b](b.md)\n")

    const report = await lint(root)

    expect(report.skillCount).toBe(0)
    expect(report.findings).toEqual([])
  })
})

describe("analyzeSkill", () => {
  it("accepts a SKILL.md body of exactly 500 lines", async () => {
    const findings = await analyze(skillWithBody(`---\nname: long\ndescription: 'y'\n---\n${body(500)}`))

    expect(findings).toEqual([])
  })

  it("flags a SKILL.md body longer than 500 lines", async () => {
    const findings = await analyze(skillWithBody(`---\nname: long\ndescription: 'y'\n---\n${body(501)}`))

    expect(findings).toEqual([
      { line: undefined, message: "body is 501 lines; keep the SKILL.md body under 500 lines", path: "/skills/long/SKILL.md", severity: "error" }
    ])
  })

  it("counts every line when SKILL.md has no frontmatter", async () => {
    const findings = await analyze(skillWithBody(body(501)))

    expect(findings).toEqual([
      { line: undefined, message: "body is 501 lines; keep the SKILL.md body under 500 lines", path: "/skills/long/SKILL.md", severity: "error" }
    ])
  })
})

describe("lint.ts", () => {
  it("exits 1 and prints each error when a reference links another reference", () => {
    const result = spawnSync("bun", [lintScript, fixture("chain")], { encoding: "utf8" })

    expect(result.status).toBe(1)
    expect(result.stdout.trimEnd().split("\n")).toEqual([
      "error: chain/chained/references/hub.md:3: links to references/detail.md; a reference may link only back to SKILL.md",
      "error: chain/chained/references/hub.md:4: links to references/detail.md; a reference may link only back to SKILL.md",
      "error: chain/chained/references/hub.md:5: links to references/detail.md; a reference may link only back to SKILL.md",
      "error: chain/chained/references/hub.md:6: links to references/references/detail.md; a reference may link only back to SKILL.md"
    ])
  })

  it("exits 0 when only warnings remain", () => {
    const result = spawnSync("bun", [lintScript, fixture("fanout")], { encoding: "utf8" })

    expect(result.status).toBe(0)
    expect(result.stdout.trimEnd().split("\n")).toEqual([
      "warning: fanout/both/SKILL.md: references/guide.md is linked from a numbered step and from Context pointers; decide whether to inline it",
      "skill-layout-lint: 2 skills, 4 references, no errors"
    ])
  })

  it("summarises a clean tree", () => {
    const result = spawnSync("bun", [lintScript, fixture("clean")], { encoding: "utf8" })

    expect(result.status).toBe(0)
    expect(result.stdout.trim()).toBe("skill-layout-lint: 1 skills, 1 references, no errors")
  })
})
