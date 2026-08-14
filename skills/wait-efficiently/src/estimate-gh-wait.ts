import { NodeRuntime, NodeServices } from "@effect/platform-node"
import * as Console from "effect/Console"
import * as Effect from "effect/Effect"
import * as Option from "effect/Option"
import * as Schema from "effect/Schema"
import { Command, Flag } from "effect/unstable/cli"

import { checkedTrimmedText } from "../../../packages/effect-cli/CheckedProcess.ts"
import { estimateWaitNow, WorkflowRunFromJson, WorkflowRunsFromJson } from "./Wait.ts"

const PositiveInteger = Schema.Int.pipe(Schema.check(Schema.isGreaterThan(0)))

const captureJson = (args: ReadonlyArray<string>) => checkedTrimmedText("gh", args)

const estimateGhWait = Command.make(
  "estimate-gh-wait",
  {
    limit: Flag.integer("limit").pipe(Flag.withDefault(30), Flag.withSchema(PositiveInteger)),
    repo: Flag.optional(Flag.string("repo")),
    runId: Flag.integer("run-id").pipe(Flag.withSchema(PositiveInteger))
  },
  Effect.fn("estimateGhWait.handler")(function*({ limit, repo, runId }) {
    const repoArgs = Option.isSome(repo) ? ["--repo", repo.value] : []
    const fields = "databaseId,workflowName,event,headBranch,startedAt,updatedAt,status,conclusion"
    const currentJson = yield* captureJson(["run", "view", String(runId), ...repoArgs, "--json", fields])
    const current = yield* Schema.decodeUnknownEffect(Schema.fromJsonString(WorkflowRunFromJson))(currentJson)
    const historyJson = yield* captureJson([
      "run",
      "list",
      ...repoArgs,
      "--workflow",
      current.workflowName,
      "--status",
      "completed",
      "--limit",
      String(limit),
      "--json",
      fields
    ])
    const history = yield* Schema.decodeUnknownEffect(Schema.fromJsonString(WorkflowRunsFromJson))(historyJson)
    const estimate = yield* estimateWaitNow(current, history)
    yield* Console.log(JSON.stringify({ ...estimate, run_id: runId, workflow: current.workflowName }))
  })
).pipe(Command.withDescription("Estimate the next useful GitHub Actions observation from historical runs"))

estimateGhWait.pipe(
  Command.run({ version: "1.0.0" }),
  // @effect-diagnostics-next-line strictEffectProvide:off
  Effect.provide(NodeServices.layer),
  NodeRuntime.runMain
)
