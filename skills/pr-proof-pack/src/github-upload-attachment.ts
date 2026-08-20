import { NodeRuntime, NodeServices } from "@effect/platform-node"
import * as Console from "effect/Console"
import * as Effect from "effect/Effect"
import { Argument, Command, Flag } from "effect/unstable/cli"

import { uploadGitHubAttachment } from "./GitHubAttachment.ts"

const command = Command.make("github-upload-attachment", {
  pullRequest: Flag.string("pr").pipe(Flag.withDescription("Positive PR number or full https://github.com/<owner>/<repository>/pull/<number> URL")),
  evidencePath: Argument.file("evidence-path", { mustExist: true }).pipe(Argument.withDescription("Existing image or video file"))
}, Effect.fn("githubUploadAttachment.handler")(function*({ pullRequest, evidencePath }) {
  const assetUrl = yield* uploadGitHubAttachment({ pullRequest, evidencePath }).pipe(Effect.scoped)
  yield* Console.log(assetUrl)
})).pipe(Command.withDescription("Upload and verify one image or video attachment for a github.com pull request"))

command.pipe(Command.run({ version: "1.0.0" }),
  // @effect-diagnostics-next-line strictEffectProvide:off
  Effect.provide(NodeServices.layer), NodeRuntime.runMain)
