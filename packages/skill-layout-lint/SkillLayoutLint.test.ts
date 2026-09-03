import { NodeServices } from "@effect/platform-node"
import { assert, describe, it } from "@effect/vitest"
import * as Effect from "effect/Effect"
import * as FileSystem from "effect/FileSystem"
import * as Path from "effect/Path"
// @effect-diagnostics-next-line nodeBuiltinImport:off
import { spawnSync } from "node:child_process"
import { fileURLToPath } from "node:url"

import { analyzeSkill, type Finding, lintSkillsRoot, type SkillSource } from "./SkillLayoutLint.ts"

const live = <A, E, R>(effect: Effect.Effect<A, E, R>) => effect.pipe(
  // @effect-diagnostics-next-line strictEffectProvide:off
  Effect.provide(NodeServices.layer)
)

const localPath = (relative: string): string => fileURLToPath(new URL(relative, import.meta.url))
const fixture = (name: string): string => localPath(`fixtures/${name}`)
const lintScript = localPath("lint.ts")

const relativeFindings = (findings: ReadonlyArray<Finding>, root: string) =>
  findings.map((finding) => ({ line: finding.line, message: finding.message, path: finding.path.slice(root.length + 1) }))

const body = (lines: number): string => Array.from({ length: lines }, (_, index) => `line ${index + 1}`).join("\n")

const skillWithBody = (content: string): SkillSource => ({ content, directory: "/skills/long", references: [], root: "/skills" })

describe("lintSkillsRoot", () => {
  it.effect("reports no findings for a skill that keeps conditional detail in references", () => live(Effect.gen(function*() {
    const report = yield* lintSkillsRoot(fixture("clean"))

    assert.deepStrictEqual(report.findings, [])
    assert.strictEqual(report.skillCount, 1)
  })))

  it.effect("excludes upstream-license attribution files from the reference set", () => live(Effect.gen(function*() {
    const report = yield* lintSkillsRoot(fixture("clean"))

    assert.strictEqual(report.referenceCount, 1)
  })))

  it.effect("flags every link a reference makes to another file in the skills tree", () => live(Effect.gen(function*() {
    const root = fixture("chain")
    const report = yield* lintSkillsRoot(root)

    assert.deepStrictEqual(relativeFindings(report.findings, root), [
      { line: 3, message: "links to references/detail.md; a reference may link only back to its own SKILL.md", path: "chained/references/hub.md" },
      { line: 4, message: "links to references/detail.md; a reference may link only back to its own SKILL.md", path: "chained/references/hub.md" },
      { line: 5, message: "links to references/detail.md; a reference may link only back to its own SKILL.md", path: "chained/references/hub.md" },
      { line: 6, message: "links to references/references/detail.md; a reference may link only back to its own SKILL.md", path: "chained/references/hub.md" },
      { line: 8, message: "links to ../other/references/thing.md; a reference may link only back to its own SKILL.md", path: "chained/references/hub.md" },
      { line: 26, message: "links to references/detail.md; a reference may link only back to its own SKILL.md", path: "chained/references/hub.md" },
      { line: 30, message: "links to references/detail.md; a reference may link only back to its own SKILL.md", path: "chained/references/hub.md" }
    ])
    assert.isTrue(report.findings.every((finding) => finding.severity === "error"))
  })))

  it.effect("warns once for a reference linked from both a numbered step and Context pointers", () => live(Effect.gen(function*() {
    const root = fixture("fanout")
    const report = yield* lintSkillsRoot(root)

    assert.deepStrictEqual(relativeFindings(report.findings, root), [
      { line: undefined, message: "references/guide.md is linked from a numbered step and from Context pointers; decide whether to inline it", path: "both/SKILL.md" }
    ])
    assert.isTrue(report.findings.every((finding) => finding.severity === "warning"))
  })))

  it.effect("reports a reference that SKILL.md never links", () => live(Effect.gen(function*() {
    const root = fixture("orphan")
    const report = yield* lintSkillsRoot(root)

    assert.deepStrictEqual(relativeFindings(report.findings, root), [
      { line: undefined, message: "references/hidden.md is not linked from SKILL.md; link every reference from SKILL.md or delete it", path: "lonely/references/hidden.md" }
    ])
    assert.isTrue(report.findings.every((finding) => finding.severity === "error"))
  })))

  it.effect("discovers skills nested below the skills root", () => live(Effect.gen(function*() {
    const report = yield* lintSkillsRoot(fixture("nested"))

    assert.strictEqual(report.skillCount, 1)
    assert.deepStrictEqual(report.findings, [])
  })))

  it.effect("skips skills vendored under node_modules", () => live(Effect.gen(function*() {
    const fileSystem = yield* FileSystem.FileSystem
    const path = yield* Path.Path
    const root = yield* fileSystem.makeTempDirectoryScoped({ prefix: "skill-layout-lint-" })
    const vendored = path.join(root, "node_modules", "vendored")
    yield* fileSystem.makeDirectory(path.join(vendored, "references"), { recursive: true })
    yield* fileSystem.writeFileString(path.join(vendored, "SKILL.md"), "---\nname: vendored\ndescription: 'y'\n---\n\n[a](references/a.md)\n")
    yield* fileSystem.writeFileString(path.join(vendored, "references", "a.md"), "[b](b.md)\n")

    const report = yield* lintSkillsRoot(root)

    assert.strictEqual(report.skillCount, 0)
    assert.deepStrictEqual(report.findings, [])
  })))
})

describe("analyzeSkill", () => {
  it.effect("accepts a SKILL.md body of exactly 500 lines", () => live(Effect.gen(function*() {
    const path = yield* Path.Path

    assert.deepStrictEqual(analyzeSkill(path, skillWithBody(`---\nname: long\ndescription: 'y'\n---\n${body(500)}\n`)), [])
  })))

  it.effect("flags a SKILL.md body longer than 500 lines", () => live(Effect.gen(function*() {
    const path = yield* Path.Path

    assert.deepStrictEqual(analyzeSkill(path, skillWithBody(`---\nname: long\ndescription: 'y'\n---\n${body(501)}`)), [
      { line: undefined, message: "body is 501 lines; keep the SKILL.md body at 500 lines or fewer", path: "/skills/long/SKILL.md", severity: "error" }
    ])
  })))

  it.effect("counts every line when SKILL.md has no frontmatter", () => live(Effect.gen(function*() {
    const path = yield* Path.Path

    assert.deepStrictEqual(analyzeSkill(path, skillWithBody(body(501))), [
      { line: undefined, message: "body is 501 lines; keep the SKILL.md body at 500 lines or fewer", path: "/skills/long/SKILL.md", severity: "error" }
    ])
  })))
})

describe("lint.ts", () => {
  it("exits 1 and prints one error line per finding", () => {
    const result = spawnSync("bun", [lintScript, fixture("chain")], { encoding: "utf8" })
    const lines = result.stdout.trimEnd().split("\n")

    assert.strictEqual(result.status, 1)
    assert.strictEqual(lines.length, 7)
    assert.isTrue(lines.every((line) => line.startsWith("error: chain/chained/references/hub.md:")))
  })

  it("exits 0 when only warnings remain", () => {
    const result = spawnSync("bun", [lintScript, fixture("fanout")], { encoding: "utf8" })

    assert.strictEqual(result.status, 0)
    assert.deepStrictEqual(result.stdout.trimEnd().split("\n"), [
      "warning: fanout/both/SKILL.md: references/guide.md is linked from a numbered step and from Context pointers; decide whether to inline it",
      "skill-layout-lint: 2 skills, 4 references, no errors"
    ])
  })
})
