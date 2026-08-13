import { assert, describe, it } from "@effect/vitest"
import { publisherAbuseFixturesExist, validateConvexTarget } from "./ClawhubLocalTest.ts"

describe("ClawHub Convex target guard", () => {
  it("accepts loopback local and matching cloud dev targets", () => {
    assert.deepStrictEqual(validateConvexTarget("http://127.0.0.1:3210", "anonymous:local"), { kind: "local", importDeployment: "local" })
    assert.deepStrictEqual(validateConvexTarget("https://test-team.convex.cloud", "dev:test-team"), { kind: "dev", importDeployment: "test-team" })
  })

  it("rejects production and mismatched targets before destructive import", () => {
    assert.throws(() => validateConvexTarget("https://prod.convex.cloud", "prod:prod"), /refusing to import/u)
    assert.throws(() => validateConvexTarget("https://other.convex.cloud", "dev:test-team"), /does not match/u)
  })

  it("preserves existing publisher-abuse fixtures", () => {
    assert.strictEqual(publisherAbuseFixturesExist("1\n"), true)
    assert.strictEqual(publisherAbuseFixturesExist("0\n"), false)
  })
})
