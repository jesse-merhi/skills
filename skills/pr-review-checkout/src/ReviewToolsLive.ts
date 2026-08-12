import { ChildProcessSpawner, ChildProcess } from "effect/unstable/process"
import { Effect, Layer, Option, Path, Schema, Stream, String } from "effect"
import { PullRequest, ExternalToolError, ReviewTools } from "./PrReview.ts"

interface CommandResult {
  readonly exitCode: number
  readonly stderr: string
  readonly stdout: string
}

const run = Effect.fn("ReviewTools.run")(function*(
  spawner: ChildProcessSpawner.ChildProcessSpawner["Service"],
  executable: string,
  args: ReadonlyArray<string>,
  cwd?: string
) {
  return yield* Effect.scoped(Effect.gen(function*() {
    const command = ChildProcess.make(executable, args, cwd === undefined ? undefined : { cwd })
    const handle = yield* spawner.spawn(command).pipe(
      Effect.mapError((cause) => new ExternalToolError({ cause, operation: `${executable} ${args.join(" ")}` }))
    )
    const result = yield* Effect.all(
      {
        exitCode: handle.exitCode,
        stderr: Stream.mkString(Stream.decodeText(handle.stderr)),
        stdout: Stream.mkString(Stream.decodeText(handle.stdout))
      },
      { concurrency: "unbounded" }
    ).pipe(
      Effect.mapError((cause) => new ExternalToolError({ cause, operation: `${executable} ${args.join(" ")}` }))
    )
    return result satisfies CommandResult
  }))
})

const checked = Effect.fn("ReviewTools.checked")(function*(
  spawner: ChildProcessSpawner.ChildProcessSpawner["Service"],
  executable: string,
  args: ReadonlyArray<string>,
  cwd?: string
) {
  const result = yield* run(spawner, executable, args, cwd)
  if (result.exitCode !== 0) {
    return yield* new ExternalToolError({
      cause: new Error(result.stderr.trim() || `${executable} exited with ${result.exitCode}`),
      operation: `${executable} ${args.join(" ")}`
    })
  }
  return result.stdout
})

export interface WorktreeRecord {
  readonly branch: string | null
  readonly worktree: string
}

export const parseWorktrees = (output: string): ReadonlyArray<WorktreeRecord> =>
  output.split("\0\0").flatMap((record) => {
    const fields = record.split("\0")
    const branch = fields.find((field) => field.startsWith("branch "))?.slice("branch ".length)
    const worktree = fields.find((field) => field.startsWith("worktree "))?.slice("worktree ".length)
    return worktree === undefined ? [] : [{ branch: branch ?? null, worktree }]
  })

const decodePullRequest = Schema.decodeUnknownEffect(Schema.fromJsonString(PullRequest))

export const ReviewToolsLive = Layer.effect(
  ReviewTools,
  Effect.gen(function*() {
    const path = yield* Path.Path
    const spawner = yield* ChildProcessSpawner.ChildProcessSpawner
    const runChecked = (executable: string, args: ReadonlyArray<string>, cwd?: string) =>
      checked(spawner, executable, args, cwd)

    return ReviewTools.of({
      checkoutPullRequest: Effect.fn("ReviewTools.checkoutPullRequest")((worktree, prNumber) =>
        Effect.asVoid(runChecked("gh", ["pr", "checkout", globalThis.String(prNumber), "--detach"], worktree))
      ),
      createWorktree: Effect.fn("ReviewTools.createWorktree")(({ path, repository }) =>
        Effect.asVoid(runChecked("git", ["worktree", "add", "--detach", path], repository))
      ),
      diffStat: Effect.fn("ReviewTools.diffStat")((worktree, mergeBase) =>
        runChecked("git", ["diff", "--stat", `${mergeBase}...HEAD`], worktree)
      ),
      findBranchWorktree: Effect.fn("ReviewTools.findBranchWorktree")(function*(branch) {
        const output = yield* runChecked("git", ["worktree", "list", "--porcelain", "-z"])
        return Option.fromNullishOr(
          parseWorktrees(output).find((entry) => entry.branch === `refs/heads/${branch}`)?.worktree
        )
      }),
      hasWorktree: Effect.fn("ReviewTools.hasWorktree")(function*(path) {
        const output = yield* runChecked("git", ["worktree", "list", "--porcelain", "-z"])
        return parseWorktrees(output).some((entry) => entry.worktree === path)
      }),
      mergeBase: Effect.fn("ReviewTools.mergeBase")((worktree, base) =>
        runChecked("git", ["merge-base", `origin/${base}`, "HEAD"], worktree).pipe(Effect.map(String.trim))
      ),
      openEditor: Effect.fn("ReviewTools.openEditor")((worktree) =>
        Effect.asVoid(runChecked("code", [worktree]))
      ),
      pullRequest: Effect.fn("ReviewTools.pullRequest")(function*(prNumber) {
        const output = yield* runChecked("gh", [
          "pr",
          "view",
          globalThis.String(prNumber),
          "--json",
          "headRefName,baseRefName,url,isCrossRepository"
        ])
        return yield* decodePullRequest(output).pipe(
          Effect.mapError((cause) => new ExternalToolError({ cause, operation: "decode gh pr view output" }))
        )
      }),
      removeWorktree: Effect.fn("ReviewTools.removeWorktree")((repository, worktree) =>
        Effect.asVoid(runChecked("git", ["worktree", "remove", "--force", worktree], repository))
      ),
      repositoryRoot: runChecked("git", ["rev-parse", "--path-format=absolute", "--git-common-dir"]).pipe(
        Effect.map((commonDirectory) => path.dirname(String.trim(commonDirectory)))
      )
    })
  })
)
