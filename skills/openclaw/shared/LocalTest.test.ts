import { assert, describe, it } from "@effect/vitest"
import * as Effect from "effect/Effect"
import * as Exit from "effect/Exit"
// @effect-diagnostics-next-line nodeBuiltinImport:off
import { mkdtemp, rm } from "node:fs/promises"
// A raw server is required to reproduce a peer that accepts HTTP and never responds.
// @effect-diagnostics-next-line nodeBuiltinImport:off
import { createServer } from "node:http"
import { tmpdir } from "node:os"
// @effect-diagnostics-next-line nodeBuiltinImport:off
import { join } from "node:path"

import { encodeEnv, parseTtl, readEnv, startDetached, startDetachedObserved, waitForUrl } from "./LocalTest.ts"

describe("local test state", () => {
  it("round-trips state values without shell evaluation", () => {
    const values = { PATH_VALUE: "/tmp/a path/$literal", EMPTY: "" }
    assert.deepStrictEqual(readEnv(encodeEnv(values)), values)
  })

  it("strips unquoted dotenv comments without truncating quoted hashes", () => {
    assert.deepStrictEqual(readEnv('URL=http://127.0.0.1:3210 # local\nTOKEN="value # retained"\n'), { URL: "http://127.0.0.1:3210", TOKEN: "value # retained" })
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

  it("reports a signal exit even when observation starts after the child exits", async () => {
    const directory = await mkdtemp(join(tmpdir(), "local-test-signal-"))
    try {
      const child = await Effect.runPromise(startDetachedObserved(process.execPath, ["-e", "process.kill(process.pid, 'SIGTERM')"], {
        stderr: join(directory, "stderr.log"),
        stdout: join(directory, "stdout.log")
      }))
      await new Promise((resolve) => setTimeout(resolve, 100))
      const code = await Effect.runPromise(child.exited.pipe(Effect.timeout("1 second")))
      assert.strictEqual(code, 1)
    } finally {
      await rm(directory, { force: true, recursive: true })
    }
  })

  it("bounds each health request before retrying", async () => {
    const server = createServer(() => undefined)
    await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve))
    const address = server.address()
    if (address === null || typeof address === "string") throw new Error("test server did not bind to a TCP port")
    try {
      const startedAt = Date.now()
      const exit = await Effect.runPromiseExit(waitForUrl(`http://127.0.0.1:${address.port}`, 0, 25))
      assert.strictEqual(Exit.isFailure(exit), true)
      assert.isBelow(Date.now() - startedAt, 1_000)
    } finally {
      server.closeAllConnections()
      await new Promise<void>((resolve) => server.close(() => resolve()))
    }
  })

})
