import { assert, describe, it } from "@effect/vitest"

import { encodeEnv, parseTtl, readEnv } from "./LocalTest.ts"

describe("local test state", () => {
  it("round-trips state values without shell evaluation", () => {
    const values = { PATH_VALUE: "/tmp/a path/$literal", EMPTY: "" }
    assert.deepStrictEqual(readEnv(encodeEnv(values)), values)
  })

  it("parses bounded duration syntax", () => {
    assert.strictEqual(parseTtl("30m"), 1_800)
    assert.strictEqual(parseTtl("8h"), 28_800)
    assert.throws(() => parseTtl("tomorrow"), /invalid --ttl/u)
  })
})
