import { assert, describe, it } from "@effect/vitest"
import * as Effect from "effect/Effect"
import * as Exit from "effect/Exit"
// Executable-boundary coverage intentionally uses temporary files.
// @effect-diagnostics-next-line nodeBuiltinImport:off
import { execFile as execFileCallback } from "node:child_process"
// @effect-diagnostics-next-line nodeBuiltinImport:off
import { mkdtemp, rm, writeFile } from "node:fs/promises"
import { tmpdir } from "node:os"
// @effect-diagnostics-next-line nodeBuiltinImport:off
import { join } from "node:path"
import { promisify } from "node:util"

import { encodeEnv, parseTtl, readEnv, startDetached } from "./LocalTest.ts"

const execFile = promisify(execFileCallback)
const root = new URL("../../..", import.meta.url).pathname

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

  it("returns a typed failure when a detached executable cannot spawn", async () => {
    const directory = await mkdtemp(join(tmpdir(), "local-test-spawn-"))
    try {
      const exit = await Effect.runPromiseExit(startDetached("definitely-not-a-real-command", [], {
        stderr: join(directory, "stderr.log"),
        stdout: join(directory, "stdout.log")
      }))
      assert.strictEqual(Exit.isFailure(exit), true)
    } finally {
      await rm(directory, { force: true, recursive: true })
    }
  })

  it("inspects config from another working directory without exposing auth", async () => {
    const directory = await mkdtemp(join(tmpdir(), "local-test-config-"))
    const config = join(directory, "openclaw.json")
    await writeFile(config, JSON.stringify({ gateway: { mode: "local", auth: { token: "never-print-this" } } }))
    try {
      const { stdout } = await execFile(join(root, "skills/openclaw/openclaw-local-test/scripts/inspect-config"), [config], { cwd: directory })
      assert.match(stdout, /"token": "\[redacted\]"/u)
      assert.strictEqual(/never-print-this/u.test(stdout), false)
    } finally {
      await rm(directory, { force: true, recursive: true })
    }
  })
})
