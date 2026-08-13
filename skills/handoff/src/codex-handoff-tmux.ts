import { NodeRuntime, NodeServices } from "@effect/platform-node"
import { Config, Console, Effect, FileSystem, Option, Path, Schema } from "effect"
import { Command, Flag } from "effect/unstable/cli"

import { checkedInherit, checkedTrimmedText } from "../../../packages/effect-cli/CheckedProcess.ts"

const quote = (value: string) => value.replace(/([^A-Za-z0-9_./:%-])/gu, "\\$1")
class HandoffError extends Schema.TaggedError<HandoffError>()("HandoffError", { message: Schema.String }) {}
const run = (command: string, args: ReadonlyArray<string>, cwd?: string) => checkedTrimmedText(command, args, cwd === undefined ? undefined : { cwd })

const cli = Command.make("codex-handoff-tmux", {
  file: Flag.string("file"), focus: Flag.string("focus").pipe(Flag.withDefault("")), cwd: Flag.string("cd").pipe(Flag.withDefault(process.cwd())),
  mode: Flag.choice("mode", ["new", "fork-last"] as const).pipe(Flag.withDefault("new")), windowName: Flag.string("window-name").pipe(Flag.withDefault("handoff")),
  pane: Flag.boolean("pane"), tmuxTarget: Flag.optional(Flag.string("tmux-target")), worktree: Flag.optional(Flag.string("worktree")), worktreeName: Flag.optional(Flag.string("worktree-name")),
  branch: Flag.optional(Flag.string("branch")), base: Flag.string("base").pipe(Flag.withDefault("HEAD")), dryRun: Flag.boolean("dry-run"), runCodex: Flag.boolean("run-codex")
}, Effect.fn("Handoff.handler")(function*(args) {
  const fs = yield* FileSystem.FileSystem
  const paths = yield* Path.Path
  const handoffInfo = yield* fs.stat(args.file).pipe(Effect.option)
  if (Option.isNone(handoffInfo)) return yield* new HandoffError({ message: `Handoff file does not exist: ${args.file}` })
  if (handoffInfo.value.type !== "File") return yield* new HandoffError({ message: `Handoff path is not a file: ${args.file}` })
  const cwdInfo = yield* fs.stat(args.cwd).pipe(Effect.option)
  if (Option.isNone(cwdInfo)) return yield* new HandoffError({ message: `Working directory does not exist: ${args.cwd}` })
  if (cwdInfo.value.type !== "Directory") return yield* new HandoffError({ message: `Working path is not a directory: ${args.cwd}` })
  if (Option.isSome(args.worktree) && Option.isSome(args.worktreeName)) return yield* new HandoffError({ message: "Use only one of --worktree or --worktree-name." })

  let workdir = args.cwd
  const wantsWorktree = Option.isSome(args.worktree) || Option.isSome(args.worktreeName)
  if (wantsWorktree) {
    const repoTop = yield* run("git", ["-C", args.cwd, "rev-parse", "--show-toplevel"])
    const worktreePath = Option.isSome(args.worktree) ? args.worktree.value : paths.join(paths.dirname(repoTop), Option.getOrThrow(args.worktreeName))
    const name = paths.basename(worktreePath)
    const branch = Option.getOrElse(args.branch, () => `work/${name.toLowerCase().replace(/[^a-z0-9._-]+/gu, "-").replace(/^-+|-+$/gu, "")}`)
    if (args.dryRun) {
      yield* Console.log(`Dry run: would prepare dedicated worktree before launching Codex: ${worktreePath}`)
      workdir = worktreePath
    } else if (!(yield* fs.exists(worktreePath))) {
      const branchExists = yield* run("git", ["-C", repoTop, "show-ref", "--verify", "--quiet", `refs/heads/${branch}`]).pipe(Effect.as(true), Effect.catch(() => Effect.succeed(false)))
      yield* run("git", ["-C", repoTop, "worktree", "add", ...(branchExists ? [] : ["-b", branch]), worktreePath, ...(branchExists ? [branch] : [args.base])])
      yield* Console.log(`Created git worktree ${worktreePath} on branch ${branch} from ${args.base}`)
      workdir = worktreePath
    } else {
      const existingTop = yield* run("git", ["-C", worktreePath, "rev-parse", "--show-toplevel"]).pipe(
        Effect.mapError(() => new HandoffError({ message: `Worktree path exists but is not a git worktree: ${worktreePath}` }))
      )
      workdir = existingTop
      yield* Console.log(`Using existing git worktree: ${existingTop}`)
    }
  }

  const prompt = [`Read the handoff document before acting:\n\n${args.file}\n`, ...(args.focus.length === 0 ? [] : [`Next session focus:\n\n${args.focus}\n`]), `Working directory:\n\n${workdir}\n`, ...(wantsWorktree ? ["This directory was prepared as this worker's dedicated git worktree. Do not use the coordinator worktree for implementation.\n"] : []), "Start by reading the handoff, then continue from it. Keep the final reply short and report what you did."].join("\n")
  if (args.runCodex) {
    const codexArgs = args.mode === "fork-last" ? ["fork", "--last", "--cd", workdir, prompt] : ["--cd", workdir, prompt]
    yield* checkedInherit("codex", codexArgs, { cwd: workdir, displayCommand: "codex [handoff prompt]" })
    return
  }
  const tmux = yield* Config.option(Config.string("TMUX"))
  if (Option.isNone(tmux)) {
    yield* Console.log(`No tmux session detected; handoff file is ready: ${args.file}`)
    return
  }
  const tmuxPane = yield* Config.option(Config.string("TMUX_PANE"))
  const target = Option.getOrElse(args.tmuxTarget, () => Option.getOrElse(tmuxPane, () => ""))
  if (args.pane && target.length === 0) return yield* new HandoffError({ message: "Pane placement requires TMUX_PANE or --tmux-target." })
  const helper = new URL("../scripts/codex-handoff-tmux", import.meta.url).pathname
  const nested = [helper, "--run-codex", "--file", args.file, "--focus", args.focus, "--cd", workdir, "--mode", args.mode, ...(wantsWorktree ? ["--worktree", workdir] : [])].map(quote).join(" ")
  const tmuxArgs = args.pane ? ["split-window", "-h", "-c", workdir, "-t", target, nested] : ["new-window", "-c", workdir, "-n", args.windowName, nested]
  if (args.dryRun) yield* Console.log(`tmux ${tmuxArgs.map(quote).join(" ")}`)
  else {
    yield* run("tmux", tmuxArgs)
    yield* Console.log(`Opened tmux ${args.pane ? "pane" : `window ${args.windowName}`} with Codex handoff: ${args.file}`)
  }
})).pipe(Command.withDescription("Open a tmux window or pane for a Codex handoff"))

cli.pipe(Command.run({ version: "2.0.0" }),
  // @effect-diagnostics-next-line strictEffectProvide:off
  Effect.provide(NodeServices.layer), NodeRuntime.runMain)
