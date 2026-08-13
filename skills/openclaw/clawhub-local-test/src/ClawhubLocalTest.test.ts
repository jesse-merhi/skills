import { assert, describe, it } from "@effect/vitest"
// This executable-level test verifies filesystem installation behavior.
// @effect-diagnostics-next-line nodeBuiltinImport:off
import { execFile as execFileCallback } from "node:child_process"
// @effect-diagnostics-next-line nodeBuiltinImport:off
import { mkdtemp, rm, symlink } from "node:fs/promises"
import { tmpdir } from "node:os"
// @effect-diagnostics-next-line nodeBuiltinImport:off
import { join } from "node:path"
import { promisify } from "node:util"

import { publisherAbuseFixturesExist, validateConvexTarget } from "./ClawhubLocalTest.ts"

const execFile = promisify(execFileCallback)
const launcher = new URL("../scripts/clawhub-local-test", import.meta.url).pathname

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

  it("runs when installed as a symlink", async () => {
    const directory = await mkdtemp(join(tmpdir(), "clawhub-launcher-"))
    const installed = join(directory, "clawhub-local-test")
    try {
      await symlink(launcher, installed)
      const { stdout } = await execFile(installed, ["--help"])
      assert.match(stdout, /Manage a guarded local ClawHub/u)
    } finally {
      await rm(directory, { recursive: true, force: true })
    }
  })
})
