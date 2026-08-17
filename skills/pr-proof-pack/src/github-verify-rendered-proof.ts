import { NodeRuntime, NodeServices } from "@effect/platform-node"
import * as Console from "effect/Console"
import * as Effect from "effect/Effect"
import { Command, Flag } from "effect/unstable/cli"

import { renderedProofLines, verifyGitHubRenderedProof } from "./GitHubRenderedProof.ts"

const command = Command.make("github-verify-rendered-proof", {
  head: Flag.string("head").pipe(Flag.withDescription("Expected final pull request head SHA")),
  pullRequest: Flag.string("pr").pipe(Flag.withDescription("Full https://github.com/<owner>/<repository>/pull/<number> URL"))
}, Effect.fn("githubVerifyRenderedProof.handler")(function*({ head, pullRequest }) {
  const result = yield* verifyGitHubRenderedProof(pullRequest, head).pipe(Effect.scoped)
  yield* Console.log(renderedProofLines(result).join("\n"))
})).pipe(Command.withDescription("Verify rendered GitHub PR media without printing signed URLs"))

command.pipe(Command.run({ version: "1.0.0" }),
  // @effect-diagnostics-next-line strictEffectProvide:off
  Effect.provide(NodeServices.layer), NodeRuntime.runMain)
