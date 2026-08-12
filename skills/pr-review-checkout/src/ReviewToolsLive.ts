import { ChildProcessSpawner, ChildProcess } from "effect/unstable/process"
import {
  Cause,
  Crypto,
  Effect,
  Exit,
  FileSystem,
  Layer,
  Option,
  Path,
  Schema,
  Stream,
  String
} from "effect"
import { ExternalToolError, PullRequest, PullRequestNumber, ReviewTools } from "./PrReview.ts"
import type { PrepareManagedWorktreeInput, PullRequestNumber as PullRequestNumberType } from "./PrReview.ts"

interface CommandResult {
  readonly exitCode: number
  readonly stderr: string
  readonly stdout: string
}

export class ManagedWorktreeOwner extends Schema.Class<ManagedWorktreeOwner>(
  "skills/pr-review-checkout/ManagedWorktreeOwner"
)({
  headRefName: Schema.NonEmptyString,
  managedBranch: Schema.NonEmptyString,
  prNumber: PullRequestNumber,
  repository: Schema.NonEmptyString
}) {}

export class ProcessLockOwner extends Schema.Class<ProcessLockOwner>("skills/pr-review-checkout/ProcessLockOwner")({
  nonce: Schema.NonEmptyString,
  pid: Schema.Int.pipe(Schema.check(Schema.isGreaterThan(0)))
}) {}

const managedOwnerCodec = Schema.fromJsonString(ManagedWorktreeOwner)
const processLockOwnerCodec = Schema.fromJsonString(ProcessLockOwner)
const decodeManagedOwner = Schema.decodeUnknownEffect(managedOwnerCodec)
const decodeProcessLockOwner = Schema.decodeUnknownEffect(processLockOwnerCodec)
const encodeManagedOwner = Schema.encodeEffect(managedOwnerCodec)
const encodeProcessLockOwner = Schema.encodeEffect(processLockOwnerCodec)

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
      exitCode: result.exitCode,
      stderr: result.stderr,
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

export const createWorktreeWithRollback = <A, E, R, R2>(
  create: Effect.Effect<A, E, R>,
  rollback: Effect.Effect<void, never, R2>
) => create.pipe(
  Effect.onExit((exit) => Exit.isFailure(exit) ? rollback : Effect.void)
)

export const pullRequestCheckoutArgs = (
  prNumber: PullRequestNumberType,
  managedBranch: string,
  force: boolean
) => [
  "pr",
  "checkout",
  globalThis.String(prNumber),
  "--branch",
  managedBranch,
  ...(force ? ["--force"] : [])
] as const

const decodePullRequest = Schema.decodeUnknownEffect(Schema.fromJsonString(PullRequest))

const isProcessAlive = (pid: number) => Effect.sync(() => {
  try {
    globalThis.process.kill(pid, 0)
    return true
  } catch (cause) {
    if (typeof cause === "object" && cause !== null && "code" in cause && cause.code === "ESRCH") {
      return false
    }
    return true
  }
})

export interface ProcessLockOptions {
  readonly isAlive?: (pid: number) => Effect.Effect<boolean>
  readonly lockPath: string
  readonly pid?: number
}

export const acquireProcessLock = Effect.fn("ReviewTools.acquireProcessLock")(function*(
  options: ProcessLockOptions
) {
  const fileSystem = yield* FileSystem.FileSystem
  const pathService = yield* Path.Path
  const pid = options.pid ?? globalThis.process.pid
  const alive = options.isAlive ?? isProcessAlive

  const createLock = Effect.gen(function*() {
    const candidate = yield* fileSystem.makeTempDirectory({
      directory: pathService.dirname(options.lockPath),
      prefix: ".pr-review-lock-"
    })
    return yield* Effect.gen(function*() {
      const nonce = pathService.basename(candidate)
      const encoded = yield* encodeProcessLockOwner(new ProcessLockOwner({ nonce, pid }))
      yield* fileSystem.writeFileString(pathService.join(candidate, `owner-${nonce}.json`), encoded)
      yield* fileSystem.rename(candidate, options.lockPath)
    }).pipe(
      Effect.onExit(() => fileSystem.remove(candidate, { force: true, recursive: true }).pipe(Effect.ignore))
    )
  })

  const acquire = (retries: number): Effect.Effect<void, ExternalToolError> => Effect.gen(function*() {
    const attempt = yield* Effect.exit(createLock)
    if (Exit.isSuccess(attempt)) {
      return
    }

    const lockExists = yield* fileSystem.exists(options.lockPath).pipe(
      Effect.mapError((cause) => new ExternalToolError({ cause, operation: `inspect ${options.lockPath}` }))
    )
    if (!lockExists) {
      if (retries > 0) {
        return yield* acquire(retries - 1)
      }
      return yield* new ExternalToolError({
        cause: Cause.squash(attempt.cause),
        operation: `acquire ${options.lockPath}`
      })
    }

    const ownerFile = yield* fileSystem.readDirectory(options.lockPath).pipe(
      Effect.map((entries) => entries.find((entry) => entry.startsWith("owner-") && entry.endsWith(".json"))),
      Effect.mapError((cause) => new ExternalToolError({ cause, operation: `inspect owner of ${options.lockPath}` }))
    )
    const existingOwner = ownerFile === undefined
      ? Option.none<ProcessLockOwner>()
      : yield* fileSystem.readFileString(pathService.join(options.lockPath, ownerFile)).pipe(
        Effect.flatMap(decodeProcessLockOwner),
        Effect.option
      )
    if (Option.isSome(existingOwner) && (yield* alive(existingOwner.value.pid))) {
      return yield* new ExternalToolError({
        cause: new Error(`another pr-review process (${existingOwner.value.pid}) owns the lock`),
        operation: `acquire ${options.lockPath}`
      })
    }

    if (Option.isSome(existingOwner)) {
      yield* fileSystem.remove(
        pathService.join(options.lockPath, `owner-${existingOwner.value.nonce}.json`),
        { force: true }
      ).pipe(
        Effect.mapError((cause) => new ExternalToolError({ cause, operation: `remove stale owner of ${options.lockPath}` }))
      )
    }
    yield* fileSystem.remove(options.lockPath).pipe(Effect.ignore)
    if (retries > 0) {
      return yield* acquire(retries - 1)
    }
    return yield* new ExternalToolError({
      cause: new Error("could not acquire process lock after removing its stale owner"),
      operation: `acquire ${options.lockPath}`
    })
  })

  return yield* acquire(2)
})

export const ReviewToolsLive = Layer.effect(
  ReviewTools,
  Effect.gen(function*() {
    const fileSystem = yield* FileSystem.FileSystem
    const crypto = yield* Crypto.Crypto
    const pathService = yield* Path.Path
    const spawner = yield* ChildProcessSpawner.ChildProcessSpawner
    const runChecked = (executable: string, args: ReadonlyArray<string>, cwd?: string) =>
      checked(spawner, executable, args, cwd)
    const removeWorktree = (repository: string, worktree: string) =>
      Effect.asVoid(runChecked("git", ["worktree", "remove", "--force", worktree], repository))
    const deleteBranch = (repository: string, branch: string) =>
      Effect.asVoid(runChecked("git", ["branch", "--delete", "--force", branch], repository))
    const markerPath = Effect.fn("ReviewTools.markerPath")(function*(worktree: string) {
      const gitDirectory = yield* runChecked("git", ["rev-parse", "--git-dir"], worktree).pipe(Effect.map(String.trim))
      return pathService.join(
        pathService.isAbsolute(gitDirectory) ? gitDirectory : pathService.join(worktree, gitDirectory),
        "agent-pr-review-owner.json"
      )
    })
    const expectedOwner = (input: PrepareManagedWorktreeInput, managedBranch: string) => new ManagedWorktreeOwner({
      headRefName: input.headRefName,
      managedBranch,
      prNumber: input.prNumber,
      repository: input.repository
    })
    const validateOwner = Effect.fn("ReviewTools.validateOwner")(function*(input: PrepareManagedWorktreeInput) {
      const ownerPath = yield* markerPath(input.path)
      const actual = yield* fileSystem.readFileString(ownerPath).pipe(
        Effect.flatMap(decodeManagedOwner),
        Effect.mapError((cause) => new ExternalToolError({
          cause,
          operation: `validate managed worktree ownership at ${input.path}`
        }))
      )
      const expectedBranchPrefix = `agent-pr-review/pr-${input.prNumber}-`
      if (
        actual.prNumber !== input.prNumber ||
        actual.repository !== input.repository ||
        !actual.managedBranch.startsWith(expectedBranchPrefix)
      ) {
        return yield* new ExternalToolError({
          cause: new Error("the worktree ownership marker belongs to a different pull request"),
          operation: `validate managed worktree ownership at ${input.path}`
        })
      }
      return actual
    })
    const writeOwner = Effect.fn("ReviewTools.writeOwner")(function*(
      input: PrepareManagedWorktreeInput,
      managedBranch: string
    ) {
      const ownerPath = yield* markerPath(input.path)
      const encoded = yield* encodeManagedOwner(expectedOwner(input, managedBranch)).pipe(
        Effect.mapError((cause) => new ExternalToolError({ cause, operation: "encode managed worktree ownership" }))
      )
      yield* fileSystem.writeFileString(ownerPath, encoded).pipe(
        Effect.mapError((cause) => new ExternalToolError({ cause, operation: `record ownership at ${input.path}` }))
      )
    })
    const checkoutPullRequest = (
      input: PrepareManagedWorktreeInput,
      managedBranch: string,
      force: boolean
    ) => Effect.asVoid(runChecked("gh", pullRequestCheckoutArgs(input.prNumber, managedBranch, force), input.path))
    const updateManagedBranchMerge = Effect.fn("ReviewTools.updateManagedBranchMerge")((
      repository: string,
      managedBranch: string,
      headRefName: string
    ) => Effect.asVoid(runChecked(
      "git",
      ["config", `branch.${managedBranch}.merge`, `refs/heads/${headRefName}`],
      repository
    )))
    const validateManagedCheckout = Effect.fn("ReviewTools.validateManagedCheckout")(function*(
      input: PrepareManagedWorktreeInput,
      managedBranch: string
    ) {
      const activeBranch = yield* runChecked("git", ["branch", "--show-current"], input.path).pipe(
        Effect.map(String.trim)
      )
      if (activeBranch !== managedBranch) {
        return yield* new ExternalToolError({
          cause: new Error(
            `managed worktree is on ${JSON.stringify(activeBranch || "detached HEAD")}, expected ${JSON.stringify(managedBranch)}`
          ),
          operation: `validate active branch at ${input.path}`
        })
      }
      const status = yield* runChecked("git", ["status", "--porcelain", "--untracked-files=all"], input.path)
      if (status.length > 0) {
        return yield* new ExternalToolError({
          cause: new Error("managed worktree has uncommitted changes; refusing to force-refresh it"),
          operation: `validate clean worktree at ${input.path}`
        })
      }
    })

    return ReviewTools.of({
      prepareManagedWorktree: Effect.fn("ReviewTools.prepareManagedWorktree")(function*(input) {
        const lockPath = `${input.path}.lock`
        yield* fileSystem.makeDirectory(pathService.dirname(input.path), { recursive: true }).pipe(
          Effect.mapError((cause) => new ExternalToolError({ cause, operation: "create worktree parent directory" }))
        )
        return yield* Effect.acquireUseRelease(
          acquireProcessLock({ lockPath }).pipe(
            Effect.provideService(FileSystem.FileSystem, fileSystem),
            Effect.provideService(Path.Path, pathService)
          ),
          () => Effect.gen(function*() {
            const output = yield* runChecked(
              "git",
              ["worktree", "list", "--porcelain", "-z"],
              input.repository
            )
            const registeredPath = yield* fileSystem.realPath(input.path).pipe(
              Effect.orElseSucceed(() => input.path)
            )
            const exists = parseWorktrees(output).some((entry) => entry.worktree === registeredPath)
            if (exists) {
              const owner = yield* validateOwner(input)
              yield* validateManagedCheckout(input, owner.managedBranch)
              yield* checkoutPullRequest(input, owner.managedBranch, true)
              yield* updateManagedBranchMerge(input.repository, owner.managedBranch, input.headRefName)
              yield* writeOwner(input, owner.managedBranch)
              return { branch: owner.managedBranch, created: false }
            }

            const nonce = yield* crypto.randomUUIDv4.pipe(
              Effect.mapError((cause) => new ExternalToolError({ cause, operation: "create managed branch name" }))
            )
            const managedBranch = `agent-pr-review/pr-${input.prNumber}-${nonce}`
            return yield* createWorktreeWithRollback(
              Effect.gen(function*() {
                yield* runChecked("git", ["worktree", "add", "--detach", input.path], input.repository)
                yield* writeOwner(input, managedBranch)
                yield* checkoutPullRequest(input, managedBranch, false)
                yield* updateManagedBranchMerge(input.repository, managedBranch, input.headRefName)
                return { branch: managedBranch, created: true }
              }),
              removeWorktree(input.repository, input.path).pipe(
                Effect.ignore,
                Effect.andThen(deleteBranch(input.repository, managedBranch).pipe(Effect.ignore))
              )
            )
          }),
          () => fileSystem.remove(lockPath, { force: true, recursive: true }).pipe(Effect.ignore)
        )
      }),
      diffStat: Effect.fn("ReviewTools.diffStat")((worktree, mergeBase) =>
        runChecked("git", ["diff", "--stat", `${mergeBase}...HEAD`], worktree)
      ),
      findBranchWorktree: Effect.fn("ReviewTools.findBranchWorktree")(function*(branch) {
        const output = yield* runChecked("git", ["worktree", "list", "--porcelain", "-z"])
        return Option.fromNullishOr(
          parseWorktrees(output).find((entry) => entry.branch === `refs/heads/${branch}`)?.worktree
        )
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
      repositoryRoot: Effect.gen(function*() {
        const output = yield* runChecked("git", ["worktree", "list", "--porcelain", "-z"])
        const mainWorktree = parseWorktrees(output)[0]
        if (mainWorktree === undefined) {
          return yield* new ExternalToolError({
            cause: new Error("git worktree list returned no worktrees"),
            operation: "resolve main worktree"
          })
        }
        return mainWorktree.worktree
      })
    })
  })
)
