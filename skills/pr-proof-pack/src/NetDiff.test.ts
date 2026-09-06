import { assert, describe, it } from "@effect/vitest"

import { changeBreakdownFromNumStat, parseNumStat } from "./NetDiff.ts"

describe("PR net diff change breakdown", () => {
  it("groups direct-base LOC by reviewer-meaningful part", () => {
    const report = changeBreakdownFromNumStat(parseNumStat([
      "120\t18\tsrc/review/runner.ts",
      "44\t3\ttest/review/runner.test.ts",
      "12\t2\tdocs/review.md",
      "8\t1\t.github/workflows/check.yml",
      "2\t2\tpnpm-lock.yaml"
    ].join("\n")))

    assert.deepStrictEqual(report.parts, [
      { part: "Implementation", files: 1, additions: 120, deletions: 18, binaryFiles: 0 },
      { part: "Tests and fixtures", files: 1, additions: 44, deletions: 3, binaryFiles: 0 },
      { part: "Documentation", files: 1, additions: 12, deletions: 2, binaryFiles: 0 },
      { part: "CI, config, and tooling", files: 1, additions: 8, deletions: 1, binaryFiles: 0 },
      { part: "Dependencies and generated files", files: 1, additions: 2, deletions: 2, binaryFiles: 0 }
    ])
    assert.deepStrictEqual(report.total, { files: 5, additions: 186, deletions: 26, binaryFiles: 0 })
  })

  it("counts binary files without pretending they have textual LOC", () => {
    const report = changeBreakdownFromNumStat(parseNumStat("-\t-\tassets/proof.png\n3\t1\tREADME.md"))

    assert.deepStrictEqual(report.parts, [
      { part: "Implementation", files: 1, additions: 0, deletions: 0, binaryFiles: 1 },
      { part: "Documentation", files: 1, additions: 3, deletions: 1, binaryFiles: 0 }
    ])
    assert.deepStrictEqual(report.total, { files: 2, additions: 3, deletions: 1, binaryFiles: 1 })
  })

  it("reports an empty diff without inventing categories", () => {
    assert.deepStrictEqual(changeBreakdownFromNumStat(parseNumStat("")), {
      parts: [],
      total: { files: 0, additions: 0, deletions: 0, binaryFiles: 0 }
    })
  })
})
