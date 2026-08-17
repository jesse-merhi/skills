import { NodeServices } from "@effect/platform-node"
import { assert, describe, it } from "@effect/vitest"
import * as Effect from "effect/Effect"
import * as Fiber from "effect/Fiber"
import * as FileSystem from "effect/FileSystem"
import * as Path from "effect/Path"
import * as PlatformError from "effect/PlatformError"
import * as Runtime from "effect/Runtime"
// @effect-diagnostics-next-line nodeBuiltinImport:off
import { existsSync } from "node:fs"

import { checkedInherit, CheckedProcessError, checkedText, platformErrorExitCode } from "./CheckedProcess.ts"

const live = <A, E>(effect: Effect.Effect<A, E, NodeServices.NodeServices>) => effect.pipe(
  // @effect-diagnostics-next-line strictEffectProvide:off
  Effect.provide(NodeServices.layer)
)

describe("checked process boundary", () => {
  it("maps typed platform signal failures to shell-compatible statuses", () => {
    const interrupted = PlatformError.systemError({ _tag: "Unknown", module: "ChildProcess", method: "exitCode", cause: new Error("Process interrupted due to receipt of signal: 'SIGTERM'") })
    const other = PlatformError.systemError({ _tag: "Unknown", module: "ChildProcess", method: "exitCode", cause: new Error("not a signal failure") })
    const unrelated = PlatformError.systemError({ _tag: "Unknown", module: "FileSystem", method: "readFile", cause: new Error("Process interrupted due to receipt of signal: 'SIGTERM'") })
    assert.strictEqual(platformErrorExitCode(interrupted), 143)
    assert.isUndefined(platformErrorExitCode(other))
    assert.isUndefined(platformErrorExitCode(unrelated))
  })

  it("exposes child exit codes to the Effect runtime", () => {
    assert.strictEqual(Runtime.getErrorExitCode(new CheckedProcessError({ command: "tool", exitCode: 127, message: "missing", stderr: "" })), 127)
  })

  it.effect("rejects non-zero commands with their stderr and exit code", () => live(
    checkedText(process.execPath, ["-e", "process.stderr.write('broken\\n'); process.exit(7)", "secret-value"], { displayCommand: "node [redacted]" }).pipe(
      Effect.flip,
      Effect.map((error) => {
        assert.strictEqual(error.exitCode, 7)
        assert.match(error.stderr, /broken/u)
        assert.strictEqual(error.command, "node [redacted]")
        assert.notMatch(error.message, /secret-value/u)
      })
    )
  ))

  it.effect("preserves stdout diagnostics from failing captured commands", () => live(
    checkedText(process.execPath, ["-e", "process.stdout.write('failure details\\n'); process.exit(8)"]).pipe(
      Effect.flip,
      Effect.map((error) => assert.match(error.message, /failure details/u))
    )
  ))

  it.effect("can omit captured stdout and redact stderr from failures", () => live(
    checkedText(process.execPath, ["-e", "process.stdout.write('signed-output'); process.stderr.write('failed secret-value'); process.exit(8)"], {
      displayCommand: "node [redacted]",
      includeStdoutInError: false,
      redactions: ["secret-value"]
    }).pipe(
      Effect.flip,
      Effect.map((error) => {
        assert.strictEqual(error.message, "failed [redacted]")
        assert.strictEqual(error.stderr, "failed [redacted]")
        assert.notInclude(error.message, "signed-output")
        assert.notInclude(error.message, "secret-value")
      })
    )
  ))

  it.effect("redacts stderr and maps the exit code when a real child receives SIGTERM", () => live(
    checkedText(process.execPath, ["-e", "process.stderr.write('secret-value'); process.kill(process.pid, 'SIGTERM')"], {
      displayCommand: "node [redacted]",
      redactions: ["secret-value"]
    }).pipe(
      Effect.flip,
      Effect.map((error) => {
        assert.strictEqual(error.exitCode, 143)
        assert.strictEqual(error.stderr, "[redacted]")
        assert.notInclude(error.message, "secret-value")
      })
    )
  ))

  it.live("force-kills a child that ignores interruption and releases scoped files", () => {
    let temporaryDirectory = ""
    return live(Effect.scoped(Effect.gen(function*() {
      const fileSystem = yield* FileSystem.FileSystem
      const paths = yield* Path.Path
      temporaryDirectory = yield* fileSystem.makeTempDirectoryScoped({ prefix: "checked-process-timeout-" })
      const readyPath = paths.join(temporaryDirectory, "ready")
      const child = yield* checkedText(process.execPath, [
        "-e",
        "const fs=require('node:fs');process.on('SIGTERM',()=>{});fs.writeFileSync(process.argv[1],'ready');setInterval(()=>{},1000)",
        readyPath
      ], {
        forceKillAfter: "50 millis"
      }).pipe(Effect.forkChild)
      while (!existsSync(readyPath)) yield* Effect.sleep("5 millis")
      const interruptedAt = Date.now()
      yield* Fiber.interrupt(child)
      assert.isBelow(Date.now() - interruptedAt, 1_000)
    }))).pipe(Effect.map(() => assert.isFalse(existsSync(temporaryDirectory))))
  }, 2_000)

  it.effect("returns stdout for an explicitly allowed diagnostic exit", () => live(
    checkedText(process.execPath, ["-e", "process.stdout.write('diagnostic json'); process.exit(1)"], { allowedExitCodes: [1] }).pipe(
      Effect.map((output) => assert.strictEqual(output, "diagnostic json"))
    )
  ))

  it.effect("maps a missing executable to command-not-found", () => live(
    checkedText("effect-test-command-that-does-not-exist", []).pipe(
      Effect.flip,
      Effect.map((error) => assert.strictEqual(error.exitCode, 127))
    )
  ))

  it.effect("drains stdout and stderr concurrently without deadlocking", () => live(
    checkedText(process.execPath, ["-e", "process.stdout.write('o'.repeat(200000)); process.stderr.write('e'.repeat(200000))"]).pipe(
      Effect.map((output) => assert.strictEqual(output.length, 200_000))
    )
  ))

  it.effect("pipes sensitive input without placing it in argv", () => live(
    checkedText(process.execPath, ["-e", "process.stdin.pipe(process.stdout)"], { stdin: "secret-through-stdin" }).pipe(
      Effect.map((output) => assert.strictEqual(output, "secret-through-stdin"))
    )
  ))

  it.effect("closes captured stdin when no input is supplied", () => live(
    checkedText(process.execPath, ["-e", "const timer=setTimeout(()=>process.exit(9),200); process.stdin.resume(); process.stdin.on('end',()=>{clearTimeout(timer); process.stdout.write('eof')})"]).pipe(
      Effect.map((output) => assert.strictEqual(output, "eof"))
    )
  ))

  it.effect("checks exit status while preserving inherited terminal I/O", () => live(
    checkedInherit(process.execPath, ["-e", "process.exit(9)"]).pipe(
      Effect.flip,
      Effect.map((error) => assert.strictEqual(error.exitCode, 9))
    )
  ))

  it.effect("supports stdin with inherited terminal output", () => live(
    checkedInherit(process.execPath, ["-e", "let input=''; process.stdin.on('data', chunk => input += chunk); process.stdin.on('end', () => process.exit(input === 'secret-through-stdin' ? 0 : 4))"], { stdin: "secret-through-stdin" })
  ))
})
