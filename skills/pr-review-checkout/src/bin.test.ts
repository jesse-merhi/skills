// @effect-diagnostics-next-line nodeBuiltinImport:off
import { spawnSync } from "node:child_process"
// @effect-diagnostics-next-line nodeBuiltinImport:off
import { chmodSync, mkdtempSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
// @effect-diagnostics-next-line nodeBuiltinImport:off
import { join } from "node:path"
import { fileURLToPath } from "node:url"
import { assert, describe, it } from "@effect/vitest"

const executable = fileURLToPath(new URL("../scripts/pr-review.sh", import.meta.url))

const run = (...args: ReadonlyArray<string>) => spawnSync(executable, args, { encoding: "utf8" })

describe("pr-review.sh", () => {
  it("preserves the missing-argument usage and exit code", () => {
    const result = run()

    assert.strictEqual(result.status, 2)
    assert.strictEqual(result.stdout, "")
    assert.strictEqual(result.stderr, "usage: pr-review.sh <pr-number>\n")
  })

  it("rejects negative PR numbers before invoking gh", () => {
    const result = run("-1")

    assert.strictEqual(result.status, 1)
    assert.match(result.stdout, /USAGE/)
    assert.match(result.stderr, /Expected a value greater than 0/)
  })

  it("prints typed CLI help", () => {
    const result = run("--help")

    assert.strictEqual(result.status, 0)
    assert.match(result.stdout, /Open a GitHub pull request/)
    assert.strictEqual(result.stderr, "")
  })

  it("keeps external-tool failures off stdout", () => {
    const directory = mkdtempSync(join(tmpdir(), "pr-review-test-"))
    const gh = join(directory, "gh")
    try {
      writeFileSync(gh, "#!/bin/sh\nprintf 'gh failed\\n' >&2\nexit 1\n")
      chmodSync(gh, 0o755)
      const result = spawnSync(executable, ["42"], {
        encoding: "utf8",
        // @effect-diagnostics-next-line processEnv:off
        env: { ...process.env, PATH: `${directory}:${process.env.PATH ?? ""}` }
      })

      assert.strictEqual(result.status, 1)
      assert.strictEqual(result.stdout, "")
      assert.match(result.stderr, /gh failed/)
    } finally {
      rmSync(directory, { force: true, recursive: true })
    }
  })
})
