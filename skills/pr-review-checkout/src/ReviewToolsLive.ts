import {
  Cause,
  Crypto,
  Effect,
  Exit,
  FileSystem,
  Layer,
  Option,
  Path,
  PlatformError,
  Ref,
  Schema,
  Stream,
  String
} from "effect"
import { ChildProcess, ChildProcessSpawner } from "effect/unstable/process"

import type { PrepareManagedWorktreeInput, PullRequestNumber as PullRequestNumberType } from "./PrReview.ts"

import { platformErrorExitCode } from "../../../packages/effect-cli/CheckedProcess.ts"
import { ExternalToolError, PullRequest, PullRequestNumber, ReviewTools } from "./PrReview.ts"

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
  identity: Schema.optional(Schema.NonEmptyString),
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
      Effect.mapError((cause) => {
        const notFound = cause instanceof PlatformError.PlatformError && cause.reason._tag === "NotFound"
        return new ExternalToolError({
          cause: notFound ? new Error(`${executable}: command not found`) : cause,
          ...(notFound ? { exitCode: 127 } : {}),
          operation: `${executable} ${args.join(" ")}`
        })
      })
    )
    const result = yield* Effect.all(
      {
        exitCode: Effect.exit(handle.exitCode),
        stderr: Stream.mkString(Stream.decodeText(handle.stderr)),
        stdout: Stream.mkString(Stream.decodeText(handle.stdout))
      },
      { concurrency: "unbounded" }
    ).pipe(
      Effect.mapError((cause) => new ExternalToolError({ cause, operation: `${executable} ${args.join(" ")}` }))
    )
    if (Exit.isFailure(result.exitCode)) {
      const platformError = Cause.findErrorOption(result.exitCode.cause)
      const cause = Option.isSome(platformError) ? platformError.value : Cause.squash(result.exitCode.cause)
      const exitCode = Option.isSome(platformError) ? platformErrorExitCode(platformError.value) : undefined
      return yield* new ExternalToolError({
        cause,
        ...(exitCode === undefined ? {} : { exitCode }),
        stderr: result.stderr,
        operation: `${executable} ${args.join(" ")}`
      })
    }
    return {
      exitCode: result.exitCode.value,
      stderr: result.stderr,
      stdout: result.stdout
    } satisfies CommandResult
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

export const createAndArmBranchOwnership = <A, E, R>(
  create: Effect.Effect<A, E, R>,
  ownsBranch: Ref.Ref<boolean>
) => Effect.uninterruptible(create.pipe(Effect.andThen(Ref.set(ownsBranch, true))))

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

export const repositoryIdentity = (value: string) => {
  const scp = value.includes("://") ? null : /^(?:[^@]+@)?([^:]+):(.+)$/.exec(value)
  const scpHost = scp?.[1]
  const scpPath = scp?.[2]
  if (scpHost !== undefined && scpPath !== undefined) {
    return `${scpHost.toLowerCase()}/${scpPath.replace(/\.git\/?$/, "").toLowerCase()}`
  }
  try {
    const url = new URL(value)
    const path = decodeURIComponent(url.pathname).replace(/^\//, "").replace(/\.git\/?$/, "")
    return url.protocol === "file:"
      ? `file:/${path}`
      : `${url.hostname.toLowerCase()}/${path.toLowerCase()}`
  } catch {
    return null
  }
}

export const repositoryPathIdentity = (value: string) => {
  const identity = repositoryIdentity(value)
  if (identity === null || identity.startsWith("file:/")) {
    return identity
  }
  return identity.slice(identity.indexOf("/") + 1)
}

export const repositoryHost = (value: string) => {
  const scp = value.includes("://") ? null : /^(?:[^@]+@)?([^:]+):.+$/.exec(value)
  const scpHost = scp?.[1]
  if (scpHost !== undefined) {
    return scpHost.toLowerCase()
  }
  try {
    const url = new URL(value)
    return url.protocol === "ssh:" ? url.hostname.toLowerCase() :
      url.protocol === "http:" || url.protocol === "https:" ? url.hostname.toLowerCase() : null
  } catch {
    return null
  }
}

export const isSshRepository = (value: string) =>
  (!value.includes("://") && /^(?:[^@]+@)?[^:]+:.+$/.test(value)) || value.startsWith("ssh://")

export const sshResolvedHost = (configuration: string) => {
  for (const line of configuration.split("\n")) {
    const match = /^hostname\s+(.+)$/i.exec(line.trim())
    if (match?.[1] !== undefined) {
      return match[1].toLowerCase()
    }
  }
  return null
}

export const isVerifiedRepositoryAlias = (
  baseUrl: string,
  candidateUrl: string,
  resolvedCandidateHost: string
) => isSshRepository(candidateUrl) &&
  repositoryHost(baseUrl) === resolvedCandidateHost.toLowerCase() &&
  repositoryPathIdentity(baseUrl) !== null &&
  repositoryPathIdentity(candidateUrl) === repositoryPathIdentity(baseUrl)

export const authenticatedGitArgs = (args: ReadonlyArray<string>) => [
  "-c",
  "credential.helper=",
  "-c",
  "credential.helper=!gh auth git-credential",
  ...args
] as const

export const pullRefTrackingRef = (prNumber: PullRequestNumberType) =>
  `refs/remotes/agent-pr-review/pr-${prNumber}/head`

export const managedRemoteName = (managedBranch: string) => managedBranch.replaceAll("/", "-")

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
  readonly processIdentity?: (pid: number) => Effect.Effect<Option.Option<string>>
}

export const acquireProcessLock = Effect.fn("ReviewTools.acquireProcessLock")(function*(
  options: ProcessLockOptions
) {
  const fileSystem = yield* FileSystem.FileSystem
  const pathService = yield* Path.Path
  const pid = options.pid ?? globalThis.process.pid
  const alive = options.isAlive ?? isProcessAlive
  const processIdentity = options.processIdentity ?? (() => Effect.succeed(Option.none()))

  const createLock = Effect.gen(function*() {
    const candidate = yield* fileSystem.makeTempDirectory({
      directory: pathService.dirname(options.lockPath),
      prefix: ".pr-review-lock-"
    })
    return yield* Effect.gen(function*() {
      const nonce = pathService.basename(candidate)
      const identity = yield* processIdentity(pid)
      const encoded = yield* encodeProcessLockOwner(new ProcessLockOwner({
        ...(Option.isSome(identity) ? { identity: identity.value } : {}),
        nonce,
        pid
      }))
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
      const currentIdentity = yield* processIdentity(existingOwner.value.pid)
      const sameProcess = existingOwner.value.identity === undefined || Option.isNone(currentIdentity) ||
        currentIdentity.value === existingOwner.value.identity
      if (sameProcess) {
        return yield* new ExternalToolError({
          cause: new Error(`another pr-review process (${existingOwner.value.pid}) owns the lock`),
          operation: `acquire ${options.lockPath}`
        })
      }
    }

    if (Option.isSome(existingOwner)) {
      yield* fileSystem.remove(
        pathService.join(options.lockPath, `owner-${existingOwner.value.nonce}.json`),
        { force: true }
      ).pipe(
        Effect.mapError((cause) => new ExternalToolError({ cause, operation: `remove stale owner of ${options.lockPath}` }))
      )
    }
    // The non-recursive removal is the compare-and-delete step: if another
    // process has already installed its owner file, ENOTEMPTY preserves it.
    yield* fileSystem.remove(options.lockPath, { recursive: false }).pipe(Effect.ignore)
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
    const processIdentity = (pid: number) => runChecked("ps", ["-o", "lstart=", "-p", globalThis.String(pid)]).pipe(
      Effect.map(String.trim),
      Effect.map((identity) => identity.length > 0 ? Option.some(identity) : Option.none()),
      Effect.catchTag("ExternalToolError", () => Effect.succeed(Option.none()))
    )
    const removeWorktree = (repository: string, worktree: string) =>
      Effect.asVoid(runChecked("git", ["worktree", "remove", "--force", worktree], repository))
    const deleteBranch = (repository: string, branch: string) =>
      Effect.asVoid(runChecked("git", ["branch", "--delete", "--force", branch], repository))
    const removeRemote = (repository: string, remote: string) =>
      Effect.asVoid(runChecked("git", ["remote", "remove", remote], repository))
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
    const writeManagedOwner = Effect.fn("ReviewTools.writeManagedOwner")(function*(
      ownerPath: string,
      owner: ManagedWorktreeOwner
    ) {
      const encoded = yield* encodeManagedOwner(owner).pipe(
        Effect.mapError((cause) => new ExternalToolError({ cause, operation: "encode managed worktree ownership" }))
      )
      const nonce = yield* crypto.randomUUIDv4.pipe(
        Effect.mapError((cause) => new ExternalToolError({ cause, operation: "create ownership temporary file" }))
      )
      const temporaryPath = `${ownerPath}.tmp-${nonce}`
      yield* fileSystem.writeFileString(temporaryPath, encoded).pipe(
        Effect.andThen(fileSystem.rename(temporaryPath, ownerPath)),
        Effect.ensuring(fileSystem.remove(temporaryPath, { force: true }).pipe(Effect.ignore)),
        Effect.mapError((cause) => new ExternalToolError({
          cause,
          operation: `record ownership at ${ownerPath}`
        }))
      )
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
      yield* writeManagedOwner(ownerPath, expectedOwner(input, managedBranch))
    })
    const resolveBaseRemote = Effect.fn("ReviewTools.resolveBaseRemote")(function*(
      input: PrepareManagedWorktreeInput
    ) {
      const baseIdentity = repositoryIdentity(input.baseRepositoryUrl)
      const baseHost = repositoryHost(input.baseRepositoryUrl)
      const remotes = yield* runChecked("git", ["remote"], input.repository).pipe(
        Effect.map((output) => output.split("\n").filter((remote) => remote.length > 0))
      )
      const remoteUrls = yield* Effect.forEach(remotes, (remote) =>
        runChecked("git", ["remote", "get-url", remote], input.repository).pipe(
          Effect.map((url) => ({ remote, url: url.trim() }))
        ))
      for (const candidate of remoteUrls) {
        if (repositoryIdentity(candidate.url) === baseIdentity) {
          return Option.some(candidate.remote)
        }
      }
      if (baseHost !== null) {
        for (const candidate of remoteUrls) {
          if (!isSshRepository(candidate.url)) {
            continue
          }
          const candidateHost = repositoryHost(candidate.url)
          if (candidateHost === null) {
            continue
          }
          const configuration = yield* runChecked("ssh", ["-G", candidateHost], input.repository).pipe(Effect.option)
          const resolvedHost = Option.isSome(configuration) ? sshResolvedHost(configuration.value) : null
          if (
            resolvedHost !== null &&
            isVerifiedRepositoryAlias(
              input.baseRepositoryUrl,
              candidate.url,
              resolvedHost
            )
          ) {
            return Option.some(candidate.remote)
          }
        }
      }
      return Option.none<string>()
    })
    const resolveBaseSource = Effect.fn("ReviewTools.resolveBaseSource")((input: PrepareManagedWorktreeInput) =>
      resolveBaseRemote(input).pipe(Effect.map(Option.getOrElse(() => input.baseRepositoryUrl))))
    const checkoutPullRequest = (
      input: PrepareManagedWorktreeInput,
      managedBranch: string,
      force: boolean
    ) => runChecked("gh", pullRequestCheckoutArgs(input.prNumber, managedBranch, force), input.path).pipe(
      Effect.as("head" as const),
      Effect.catchTag("ExternalToolError", (error) => Effect.gen(function*() {
        const source = yield* resolveBaseSource(input).pipe(Effect.mapError(() => error))
        if (!input.isCrossRepository) {
          const headProbe = yield* Effect.exit(runChecked(
            "git",
            authenticatedGitArgs([
              "ls-remote",
              "--exit-code",
              source,
              `refs/heads/${input.headRefName}`
            ]),
            input.path
          ))
          if (Exit.isSuccess(headProbe)) {
            return yield* error
          }
          const probeError = Cause.squash(headProbe.cause)
          if (!(probeError instanceof ExternalToolError) || probeError.exitCode !== 2) {
            return yield* error
          }
        }
        yield* runChecked(
          "git",
          authenticatedGitArgs(["fetch", "--quiet", source, `pull/${input.prNumber}/head`]),
          input.path
        ).pipe(Effect.mapError(() => error))
        if (force) {
          yield* runChecked("git", ["checkout", "--quiet", managedBranch], input.path)
          yield* runChecked("git", ["reset", "--quiet", "--hard", "FETCH_HEAD"], input.path)
        } else {
          yield* runChecked("git", ["checkout", "--quiet", "-b", managedBranch, "FETCH_HEAD"], input.path)
        }
        return "pull-ref" as const
      }))
    )
    const readManagedBranchConfig = (
      repository: string,
      managedBranch: string,
      name: "merge" | "remote"
    ) => runChecked(
      "git",
      ["config", "--get", `branch.${managedBranch}.${name}`],
      repository
    ).pipe(Effect.map(String.trim), Effect.option)
    const restoreManagedBranchConfig = (
      repository: string,
      managedBranch: string,
      name: "merge" | "remote",
      value: Option.Option<string>
    ) => Option.match(value, {
      onNone: () => runChecked(
        "git",
        ["config", "--unset-all", `branch.${managedBranch}.${name}`],
        repository
      ).pipe(Effect.ignore),
      onSome: (configured) => runChecked(
        "git",
        ["config", `branch.${managedBranch}.${name}`, configured],
        repository
      ).pipe(Effect.ignore)
    })
    const restoreManagedRemote = Effect.fn("ReviewTools.restoreManagedRemote")(function*(
      repository: string,
      remote: string,
      url: Option.Option<string>,
      fetch: Option.Option<string>
    ) {
      if (Option.isNone(url)) {
        yield* removeRemote(repository, remote).pipe(Effect.ignore)
        return
      }
      const exists = yield* runChecked("git", ["remote", "get-url", remote], repository).pipe(Effect.option)
      yield* Option.isSome(exists)
        ? runChecked("git", ["remote", "set-url", remote, url.value], repository)
        : runChecked("git", ["remote", "add", remote, url.value], repository)
      yield* Option.match(fetch, {
        onNone: () => runChecked("git", ["config", "--unset-all", `remote.${remote}.fetch`], repository).pipe(
          Effect.ignore
        ),
        onSome: (value) => runChecked(
          "git",
          ["config", "--replace-all", `remote.${remote}.fetch`, value],
          repository
        )
      })
    })
    const refreshManagedBranchMerge = Effect.fn("ReviewTools.refreshManagedBranchMerge")(function*(
      input: PrepareManagedWorktreeInput,
      managedBranch: string,
      source: "head" | "pull-ref"
    ) {
      const trackingRef = pullRefTrackingRef(input.prNumber)
      const helperRemote = managedRemoteName(managedBranch)
      const configuredRemote = yield* readManagedBranchConfig(input.repository, managedBranch, "remote")
      const configuredMerge = yield* readManagedBranchConfig(input.repository, managedBranch, "merge")
      const configuredRemoteUrl = Option.isSome(configuredRemote) && configuredRemote.value !== "."
        ? yield* runChecked(
          "git",
          ["remote", "get-url", configuredRemote.value],
          input.repository
        ).pipe(Effect.map(String.trim), Effect.option)
        : Option.none<string>()
      const baseRemote = yield* resolveBaseRemote(input)
      const baseRemoteUrl = Option.isSome(baseRemote)
        ? yield* runChecked("git", ["remote", "get-url", baseRemote.value], input.repository).pipe(
          Effect.map(String.trim)
        )
        : input.baseRepositoryUrl
      const remoteUrl = source === "pull-ref"
        ? baseRemoteUrl
        : Option.getOrElse(
          configuredRemoteUrl,
          () => Option.isSome(configuredRemote) && configuredRemote.value !== "." && (
            configuredRemote.value.includes(":") || configuredRemote.value.includes("/")
            )
            ? configuredRemote.value
            : baseRemoteUrl
        )
      const sourceRef = source === "pull-ref"
        ? `refs/pull/${input.prNumber}/head`
        : Option.isSome(configuredMerge) && configuredMerge.value.startsWith("refs/heads/")
        ? `refs/heads/${input.headRefName}`
        : input.isCrossRepository
        ? Option.isSome(configuredMerge) && configuredMerge.value.startsWith("refs/pull/")
          ? configuredMerge.value
          : `refs/pull/${input.prNumber}/head`
        : `refs/heads/${input.headRefName}`
      const helperExists = yield* runChecked(
        "git",
        ["remote", "get-url", helperRemote],
        input.repository
      ).pipe(Effect.option)
      if (Option.isSome(helperExists)) {
        yield* runChecked("git", ["remote", "set-url", helperRemote, remoteUrl], input.repository)
      } else {
        yield* runChecked("git", ["remote", "add", helperRemote, remoteUrl], input.repository)
      }
      yield* runChecked(
        "git",
        ["config", "--replace-all", `remote.${helperRemote}.fetch`, `+${sourceRef}:${trackingRef}`],
        input.repository
      )
      yield* runChecked("git", ["update-ref", trackingRef, "HEAD"], input.path)
      yield* runChecked(
        "git",
        ["config", `branch.${managedBranch}.remote`, helperRemote],
        input.repository
      )
      yield* runChecked(
        "git",
        ["config", `branch.${managedBranch}.merge`, sourceRef],
        input.repository
      )
    })
    const validateManagedCheckout = Effect.fn("ReviewTools.validateManagedCheckout")(function*(
      input: PrepareManagedWorktreeInput,
      managedBranch: string
    ) {
      const activeBranch = yield* runChecked("git", ["branch", "--show-current"], input.path).pipe(
        Effect.map(String.trim)
      )
      if (activeBranch.length > 0 && activeBranch !== managedBranch) {
        return yield* new ExternalToolError({
          cause: new Error(
            `managed worktree is on ${JSON.stringify(activeBranch)}, expected ${JSON.stringify(managedBranch)}`
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
      if (activeBranch === managedBranch) {
        return { _tag: "ready" as const }
      }
      if (activeBranch.length === 0) {
        const branch = yield* runChecked(
          "git",
          ["branch", "--list", "--format=%(refname:short)", managedBranch],
          input.repository
        ).pipe(Effect.map(String.trim))
        return { _tag: "incomplete" as const, branchExists: branch === managedBranch }
      }
      return { _tag: "incomplete" as const, branchExists: false }
    })
    const removeOwnedWorktree = Effect.fn("ReviewTools.removeOwnedWorktree")(function*(
      repository: string,
      worktree: string,
      managedBranch: string
    ) {
      const output = yield* runChecked("git", ["worktree", "list", "--porcelain", "-z"], repository)
      const registeredPath = yield* fileSystem.realPath(worktree).pipe(Effect.orElseSucceed(() => worktree))
      const owned = parseWorktrees(output).some((entry) =>
        entry.worktree === registeredPath && entry.branch === `refs/heads/${managedBranch}`
      )
      if (owned) {
        yield* removeWorktree(repository, worktree)
      }
    })

    return ReviewTools.of({
      prepareManagedWorktree: Effect.fn("ReviewTools.prepareManagedWorktree")(function*(input) {
        const lockPath = `${input.path}.lock`
        yield* fileSystem.makeDirectory(pathService.dirname(input.path), { recursive: true }).pipe(
          Effect.mapError((cause) => new ExternalToolError({ cause, operation: "create worktree parent directory" }))
        )
        return yield* Effect.acquireUseRelease(
          acquireProcessLock({ lockPath, processIdentity }).pipe(
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
              const state = yield* validateManagedCheckout(input, owner.managedBranch)
              if (state._tag === "incomplete") {
                return yield* createWorktreeWithRollback(
                  Effect.gen(function*() {
                    const source = yield* checkoutPullRequest(input, owner.managedBranch, state.branchExists)
                    yield* refreshManagedBranchMerge(input, owner.managedBranch, source)
                    yield* writeOwner(input, owner.managedBranch)
                    return {
                      branch: owner.managedBranch,
                      created: true,
                      remote: managedRemoteName(owner.managedBranch)
                    }
                  }),
                  removeWorktree(input.repository, input.path).pipe(
                    Effect.ignore,
                    Effect.andThen(deleteBranch(input.repository, owner.managedBranch).pipe(Effect.ignore)),
                    Effect.andThen(removeRemote(
                      input.repository,
                      managedRemoteName(owner.managedBranch)
                    ).pipe(Effect.ignore)),
                    Effect.andThen(runChecked(
                      "git",
                      ["update-ref", "-d", pullRefTrackingRef(input.prNumber)],
                      input.repository
                    ).pipe(Effect.ignore))
                  )
                )
              }
              const ownerPath = yield* markerPath(input.path)
              const previousCommit = yield* runChecked("git", ["rev-parse", "HEAD"], input.path).pipe(
                Effect.map(String.trim)
              )
              const previousMerge = yield* readManagedBranchConfig(input.repository, owner.managedBranch, "merge")
              const previousRemote = yield* readManagedBranchConfig(input.repository, owner.managedBranch, "remote")
              const helperRemote = managedRemoteName(owner.managedBranch)
              const previousHelperRemoteUrl = yield* runChecked(
                "git",
                ["remote", "get-url", helperRemote],
                input.repository
              ).pipe(Effect.map(String.trim), Effect.option)
              const previousHelperRemoteFetch = yield* runChecked(
                "git",
                ["config", "--get", `remote.${helperRemote}.fetch`],
                input.repository
              ).pipe(Effect.map(String.trim), Effect.option)
              const trackingRef = pullRefTrackingRef(input.prNumber)
              const previousTrackingRef = yield* runChecked(
                "git",
                ["rev-parse", "--verify", trackingRef],
                input.repository
              ).pipe(Effect.map(String.trim), Effect.option)
              return yield* createWorktreeWithRollback(
                Effect.gen(function*() {
                  const source = yield* checkoutPullRequest(input, owner.managedBranch, true)
                  yield* refreshManagedBranchMerge(input, owner.managedBranch, source)
                  yield* writeOwner(input, owner.managedBranch)
                  return {
                    branch: owner.managedBranch,
                    created: false,
                    remote: managedRemoteName(owner.managedBranch)
                  }
                }),
                runChecked("git", ["reset", "--hard", previousCommit], input.path).pipe(
                  Effect.ignore,
                  Effect.andThen(restoreManagedBranchConfig(
                    input.repository,
                    owner.managedBranch,
                    "merge",
                    previousMerge
                  )),
                  Effect.andThen(restoreManagedBranchConfig(
                    input.repository,
                    owner.managedBranch,
                    "remote",
                    previousRemote
                  )),
                  Effect.andThen(Option.match(previousTrackingRef, {
                    onNone: () => runChecked("git", ["update-ref", "-d", trackingRef], input.repository).pipe(
                      Effect.ignore
                    ),
                    onSome: (commit) => runChecked("git", ["update-ref", trackingRef, commit], input.repository).pipe(
                      Effect.ignore
                    )
                  })),
                  Effect.andThen(restoreManagedRemote(
                    input.repository,
                    helperRemote,
                    previousHelperRemoteUrl,
                    previousHelperRemoteFetch
                  ).pipe(Effect.ignore)),
                  Effect.andThen(writeManagedOwner(ownerPath, owner).pipe(Effect.ignore))
                )
              )
            }

            const nonce = yield* crypto.randomUUIDv4.pipe(
              Effect.mapError((cause) => new ExternalToolError({ cause, operation: "create managed branch name" }))
            )
            const managedBranch = `agent-pr-review/pr-${input.prNumber}-${nonce}`
            const ownsBranch = yield* Ref.make(false)
            return yield* createWorktreeWithRollback(
              Effect.gen(function*() {
                yield* createAndArmBranchOwnership(
                  runChecked(
                    "git",
                    ["update-ref", `refs/heads/${managedBranch}`, "HEAD", ""],
                    input.repository
                  ),
                  ownsBranch
                )
                yield* runChecked("git", ["worktree", "add", input.path, managedBranch], input.repository)
                yield* writeOwner(input, managedBranch)
                const source = yield* checkoutPullRequest(input, managedBranch, true)
                yield* refreshManagedBranchMerge(input, managedBranch, source)
                return { branch: managedBranch, created: true, remote: managedRemoteName(managedBranch) }
              }),
              Ref.get(ownsBranch).pipe(Effect.flatMap((owned) => owned
                ? removeOwnedWorktree(input.repository, input.path, managedBranch).pipe(
                  Effect.ignore,
                  Effect.andThen(deleteBranch(input.repository, managedBranch).pipe(Effect.ignore)),
                  Effect.andThen(removeRemote(
                    input.repository,
                    managedRemoteName(managedBranch)
                  ).pipe(Effect.ignore)),
                  Effect.andThen(runChecked(
                    "git",
                    ["update-ref", "-d", pullRefTrackingRef(input.prNumber)],
                    input.repository
                  ).pipe(Effect.ignore))
                )
                : Effect.void))
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
