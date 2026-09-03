import { NodeRuntime, NodeServices } from "@effect/platform-node"
import * as Console from "effect/Console"
import * as Effect from "effect/Effect"
import * as FileSystem from "effect/FileSystem"
import * as Option from "effect/Option"
import * as Path from "effect/Path"
import * as Runtime from "effect/Runtime"
import * as Schema from "effect/Schema"
import { Argument, Command, Flag, Prompt } from "effect/unstable/cli"

import { checkedText } from "../../../packages/effect-cli/CheckedProcess.ts"
import { trustedExecutable } from "../../../packages/effect-cli/TrustedExecutable.ts"
import { applyProfile, catalogueOptions, discoverCatalogue, loadProfile, renderAgentFile, renderConfigArgument, renderConfigBlocks } from "./SkillProfile.ts"

// The diff, the refusal, and the selector conflict are already written to
// stderr in the shape the caller expects, so the runtime must not log them again.
class SkillsProfileExit extends Schema.TaggedError<SkillsProfileExit>()("SkillsProfileExit", {
  exitCode: Schema.Number
}) {
  override get [Runtime.errorExitCode]() { return this.exitCode }
  override get [Runtime.errorReported]() { return false }
}

const renderDiff = Effect.fn("skillsProfile.renderDiff")(function*(target: string, content: string) {
  const fileSystem = yield* FileSystem.FileSystem
  const paths = yield* Path.Path
  return yield* Effect.scoped(Effect.gen(function*() {
    const directory = yield* fileSystem.makeTempDirectoryScoped({ prefix: "skills-profile." })
    const candidate = paths.join(directory, paths.basename(target))
    yield* fileSystem.writeFileString(candidate, content)
    const installed = (yield* fileSystem.exists(target)) ? target : "/dev/null"
    const git = yield* trustedExecutable("git")
    return yield* checkedText(git, ["diff", "--no-index", "--no-color", installed, candidate], { allowedExitCodes: [1] })
  }))
})

const skillsProfile = Command.make("skills-profile", {
  role: Argument.string("role"),
  asAgent: Flag.boolean("as-agent"),
  asConfigArg: Flag.boolean("as-config-arg"),
  asConfigBlocks: Flag.boolean("as-config-blocks"),
  list: Flag.boolean("list"),
  install: Flag.boolean("install"),
  check: Flag.boolean("check"),
  yes: Flag.boolean("yes"),
  repo: Flag.string("repo").pipe(Flag.atLeast(0)),
  codexHome: Flag.optional(Flag.string("codex-home"))
}, Effect.fn("skillsProfile.handler")(function*(args) {
  const selectors = [
    ...(args.asAgent ? ["--as-agent"] : []),
    ...(args.asConfigArg ? ["--as-config-arg"] : []),
    ...(args.asConfigBlocks ? ["--as-config-blocks"] : []),
    ...(args.list ? ["--list"] : [])
  ]
  const conflict = selectors.length > 1
    ? `choose one output: ${selectors.join(", ")}`
    : args.install && args.check
    ? "choose one of --install or --check"
    : undefined
  if (conflict !== undefined) {
    yield* Console.error(conflict)
    return yield* new SkillsProfileExit({ exitCode: 2 })
  }

  const fileSystem = yield* FileSystem.FileSystem
  const paths = yield* Path.Path
  const profile = yield* loadProfile(args.role)
  const options = yield* catalogueOptions({
    ...(Option.isSome(args.codexHome) ? { codexHome: args.codexHome.value } : {}),
    repos: args.repo
  })
  const applied = applyProfile(profile.definition.allow, discoverCatalogue(options))
  for (const missing of applied.missingAllow) {
    yield* Console.error(`warning: allowlist entry "${missing}" matched no discovered skill`)
  }

  const target = paths.join(options.codexHome, "agents", `${profile.definition.name}.toml`)
  const agentFile = () => renderAgentFile(profile, applied.disabledPaths)
  const installed = () => fileSystem.readFileString(target).pipe(Effect.option)

  if (args.check) {
    const content = yield* agentFile()
    const current = yield* installed()
    if (Option.isSome(current) && current.value === content) return
    yield* Console.error(Option.isNone(current) ? `missing: ${target}` : (yield* renderDiff(target, content)).trimEnd())
    return yield* new SkillsProfileExit({ exitCode: 1 })
  }

  if (args.install) {
    const content = yield* agentFile()
    const current = yield* installed()
    if (Option.isSome(current) && current.value === content) return yield* Console.log(`${target} is up to date`)
    yield* Console.log((yield* renderDiff(target, content)).trimEnd())
    if (!args.yes) {
      if (process.stdin.isTTY !== true) {
        yield* Console.error("refusing to write outside the repository without --yes")
        return yield* new SkillsProfileExit({ exitCode: 1 })
      }
      if (!(yield* Prompt.confirm({ message: `Write ${target}?` }))) return
    }
    yield* fileSystem.makeDirectory(paths.dirname(target), { recursive: true })
    yield* fileSystem.writeFileString(target, content)
    return yield* Console.log(`wrote ${target}`)
  }

  if (args.list) {
    const width = applied.entries.reduce((longest, entry) => Math.max(longest, entry.skill.name.length), 0)
    for (const entry of applied.entries) {
      yield* Console.log(`${entry.enabled ? "enabled " : "disabled"}  ${entry.skill.name.padEnd(width)}  ${entry.skill.path}`)
    }
    return
  }

  if (args.asConfigArg) return yield* Console.log(renderConfigArgument(applied.disabledPaths))
  if (args.asConfigBlocks) return yield* Console.log(renderConfigBlocks(applied.disabledPaths).trimEnd())
  yield* Console.log((yield* agentFile()).trimEnd())
})).pipe(Command.withDescription("Render a role's skill allowlist as the opt-out Codex agent and skills.config it needs"))

skillsProfile.pipe(Command.run({ version: "1.0.0" }),
  // @effect-diagnostics-next-line strictEffectProvide:off
  Effect.provide(NodeServices.layer), NodeRuntime.runMain)
