import { NodeServices } from "@effect/platform-node"
import { assert, describe, it } from "@effect/vitest"
import * as Effect from "effect/Effect"
import * as PlatformError from "effect/PlatformError"
import * as Runtime from "effect/Runtime"

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
