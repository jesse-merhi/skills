import { NodeServices } from "@effect/platform-node"
import { assert, describe, it } from "@effect/vitest"
import * as Cause from "effect/Cause"
import * as Effect from "effect/Effect"
import * as Exit from "effect/Exit"
// Executable resolution is exercised against real directories and real PATH entries.
// @effect-diagnostics-next-line nodeBuiltinImport:off
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises"
import { tmpdir } from "node:os"
// @effect-diagnostics-next-line nodeBuiltinImport:off
import { isAbsolute, join } from "node:path"

import { trustedExecutable, TrustedExecutableError } from "./TrustedExecutable.ts"

const live = <A, E>(effect: Effect.Effect<A, E, NodeServices.NodeServices>) =>
  effect.pipe(
    // @effect-diagnostics-next-line strictEffectProvide:off
    Effect.provide(NodeServices.layer)
  )

describe("trustedExecutable", () => {
  it("resolves a real tool to an absolute path outside the reviewed checkout", async () => {
    const directory = await mkdtemp(join(tmpdir(), "trusted-executable-"))
    try {
      await mkdir(join(directory, ".git"), { recursive: true })
      await mkdir(join(directory, "bin"), { recursive: true })
      await writeFile(join(directory, "bin", "git"), "#!/bin/sh\nexit 0\n", { mode: 0o755 })

      const resolved = await Effect.runPromise(live(trustedExecutable("git", directory)))

      assert.isTrue(isAbsolute(resolved))
      assert.notInclude(resolved, directory)
    } finally {
      await rm(directory, { recursive: true, force: true })
    }
  })

  it("names the tool it could not resolve and points at the override", async () => {
    const failure = await Effect.runPromise(live(Effect.exit(trustedExecutable("not-an-installed-tool"))))

    assert.isTrue(Exit.isFailure(failure))
    if (Exit.isFailure(failure)) {
      const error = Cause.squash(failure.cause)
      assert.instanceOf(error, TrustedExecutableError)
      assert.match(error.message, /could not resolve trusted not-an-installed-tool executable/u)
    }
  })
})
