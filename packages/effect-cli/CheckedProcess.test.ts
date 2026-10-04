import { NodeServices } from "@effect/platform-node"
import { assert, describe, it } from "@effect/vitest"
import * as Effect from "effect/Effect"

import { checkedText } from "./CheckedProcess.ts"

const live = <A, E>(effect: Effect.Effect<A, E, NodeServices.NodeServices>) => effect.pipe(
  // @effect-diagnostics-next-line strictEffectProvide:off
  Effect.provide(NodeServices.layer)
)

describe("checked process boundary", () => {
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

  it.effect("can omit both captured streams from sensitive command failures", () => live(
    checkedText(process.execPath, ["-e", "process.stdout.write('signed-output'); process.stderr.write('signed-stderr'); process.exit(8)"], {
      displayCommand: "node [sensitive lookup]",
      includeStderrInError: false,
      includeStdoutInError: false
    }).pipe(
      Effect.flip,
      Effect.map((error) => {
        assert.strictEqual(error.message, "node [sensitive lookup] exited 8")
        assert.strictEqual(error.stderr, "")
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

  it.effect("omits sensitive stderr when a child is interrupted", () => live(
    checkedText(process.execPath, ["-e", "process.stdout.write('signed-stdout'); process.stderr.write('signed-stderr'); process.kill(process.pid, 'SIGTERM')"], {
      displayCommand: "node [sensitive lookup]",
      includeStderrInError: false,
      includeStdoutInError: false
    }).pipe(
      Effect.flip,
      Effect.map((error) => {
        assert.strictEqual(error.exitCode, 143)
        assert.strictEqual(error.stderr, "")
        assert.notInclude(error.message, "signed-stderr")
        assert.notInclude(error.message, "signed-stdout")
      })
    )
  ))

  it.effect("drains stdout and stderr concurrently without deadlocking", () => live(
    checkedText(process.execPath, ["-e", "process.stdout.write('o'.repeat(200000)); process.stderr.write('e'.repeat(200000))"]).pipe(
      Effect.map((output) => assert.strictEqual(output.length, 200_000))
    )
  ))

  it.effect("closes captured stdin when no input is supplied", () => live(
    checkedText(process.execPath, ["-e", "const timer=setTimeout(()=>process.exit(9),200); process.stdin.resume(); process.stdin.on('end',()=>{clearTimeout(timer); process.stdout.write('eof')})"]).pipe(
      Effect.map((output) => assert.strictEqual(output, "eof"))
    )
  ))
})
