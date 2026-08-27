import { assert, describe, it } from "@effect/vitest"

import { allowedScopeGrowth, deriveRuntimeOutcome } from "./ReviewFindings.ts"

describe("review scope growth", () => {
  it("uses exactly 30 percent with no absolute floor", () => {
    assert.strictEqual(allowedScopeGrowth(1, 30), 0)
    assert.strictEqual(allowedScopeGrowth(40, 30), 12)
    assert.strictEqual(allowedScopeGrowth(600, 30), 180)
  })
})

describe("review finding risk outcomes", () => {
  it("derives every severity and disposition from likelihood and impact", () => {
    const cases = [
      ["likely", "low", "p3", "accept"], ["likely", "medium", "p2", "accept"],
      ["likely", "high", "p1", "accept"], ["likely", "critical", "p0", "accept"],
      ["possible", "low", "", "reject"], ["possible", "medium", "p2", "accept"],
      ["possible", "high", "p1", "accept"], ["possible", "critical", "p1", "accept"],
      ["rare", "low", "", "reject"], ["rare", "medium", "", "reject"],
      ["rare", "high", "p2", "consult"], ["rare", "critical", "p1", "consult"],
      ["unknown", "low", "", "investigate"], ["unknown", "medium", "", "investigate"],
      ["unknown", "high", "", "investigate"], ["unknown", "critical", "", "investigate"],
      ["theoretical", "low", "", "reject"], ["theoretical", "medium", "", "reject"],
      ["theoretical", "high", "", "reject"], ["theoretical", "critical", "", "reject"]
    ] as const
    for (const [likelihood, impact, severity, disposition] of cases) {
      assert.deepStrictEqual(deriveRuntimeOutcome(likelihood, impact), { severity, disposition })
    }
  })
})
