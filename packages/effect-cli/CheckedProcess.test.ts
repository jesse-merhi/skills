import { NodeServices } from "@effect/platform-node"
import { assert, describe, it } from "@effect/vitest"
import { Effect } from "effect"
import { checkedText } from "./CheckedProcess.ts"

const live = <A, E>(effect: Effect.Effect<A, E, NodeServices.NodeServices>) => effect.pipe(
  // @effect-diagnostics-next-line strictEffectProvide:off
  Effect.provide(NodeServices.layer)
)

describe("checked process boundary", () => {
  it.effect("rejects non-zero commands with their stderr and exit code", () => live(
    checkedText(process.execPath, ["-e", "process.stderr.write('broken\\n'); process.exit(7)"]).pipe(
      Effect.flip,
      Effect.map((error) => {
        assert.strictEqual(error.exitCode, 7)
        assert.match(error.stderr, /broken/u)
      })
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
})
