import { assert, describe, it } from "@effect/vitest"
import { DateTime, Effect, Schema } from "effect"

import { estimateWait, parseWaitDuration, type WorkflowRun, WorkflowRunFromJson } from "./Wait.ts"

const run = (databaseId: number, durationMinutes: number, headBranch = "main"): WorkflowRun => ({
  databaseId,
  event: "pull_request",
  headBranch,
  startedAt: Schema.decodeSync(Schema.DateTimeUtcFromString)("2026-07-11T00:00:00Z"),
  status: "completed",
  updatedAt: Schema.decodeSync(Schema.DateTimeUtcFromString)(`2026-07-11T00:${String(durationMinutes).padStart(2, "0")}:00Z`),
  workflowName: "Build"
})

describe("quiet wait", () => {
  it.effect("accepts documented duration units", () => Effect.gen(function*() {
    assert.strictEqual(yield* parseWaitDuration("300"), 300_000)
    assert.strictEqual(yield* parseWaitDuration("5m"), 300_000)
    assert.strictEqual(yield* parseWaitDuration("1.5h"), 5_400_000)
    assert.strictEqual(yield* parseWaitDuration("250ms"), 250)
  }))

  it.effect("rejects malformed and excessive durations", () => Effect.gen(function*() {
    assert.isTrue((yield* Effect.exit(parseWaitDuration("later")))._tag === "Failure")
    assert.isTrue((yield* Effect.exit(parseWaitDuration("25h")))._tag === "Failure")
  }))
})

describe("GitHub Actions wait estimate", () => {
  it("uses same-branch p75 minus elapsed time", () => {
    const current = Schema.decodeSync(WorkflowRunFromJson)({
      databaseId: 99,
      event: "pull_request",
      headBranch: "feature",
      startedAt: "2026-07-11T00:00:00Z",
      status: "in_progress",
      workflowName: "Build"
    })
    const result = estimateWait(
      current,
      [run(1, 6, "feature"), run(2, 8, "feature"), run(3, 10, "feature")],
      DateTime.toEpochMillis(Schema.decodeSync(Schema.DateTimeUtcFromString)("2026-07-11T00:02:00Z"))
    )
    assert.strictEqual(result.historical_p75_seconds, 600)
    assert.strictEqual(result.estimated_remaining_seconds, 480)
    assert.strictEqual(result.suggested_wait_seconds, 480)
  })

  it("uses the fallback with fewer than three samples", () => {
    const current = Schema.decodeSync(WorkflowRunFromJson)({
      databaseId: 99,
      event: "pull_request",
      headBranch: "feature",
      startedAt: "2026-07-11T00:00:00Z",
      status: "queued",
      workflowName: "Build"
    })
    const result = estimateWait(current, [run(1, 6), run(2, 8)], 0)
    assert.strictEqual(result.suggested_wait_seconds, 120)
    assert.strictEqual(result.fallback, true)
  })
})
