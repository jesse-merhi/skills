import { assert, describe, it } from "@effect/vitest"
import { Effect } from "effect"
import { planReview, untilReviewStable } from "./NativeReview.ts"

describe("native review target", () => {
  it("reviews a dirty branch and its local overlay", () => {
    const plan = planReview("auto", "origin/main", "HEAD", true)
    assert.strictEqual(plan.label, "current branch against origin/main, including uncommitted changes")
    assert.deepStrictEqual(plan.targets.map((target) => target.args), [["--base", "origin/main"], ["--uncommitted"]])
  })

  it("uses the native commit protocol without preparing a synthetic tree", () => {
    assert.deepStrictEqual(planReview("commit", "origin/main", "abc123", false).targets[0]?.args, ["--commit", "abc123"])
  })

  it.effect("reruns when the target changes during review", () => {
    let identity = "a"
    let runs = 0
    return untilReviewStable({
      identity: Effect.sync(() => identity),
      operation: Effect.sync(() => { runs += 1; if (runs === 1) identity = "b"; return `result-${runs}` })
    }).pipe(Effect.map((result) => {
      assert.strictEqual(result.value, "result-2")
      assert.strictEqual(result.runs, 2)
    }))
  })
})
