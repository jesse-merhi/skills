import * as Effect from "effect/Effect"
import * as Schema from "effect/Schema"

import { checkedTrimmedText } from "../../../packages/effect-cli/CheckedProcess.ts"
import { trustedExecutable } from "./ReviewEnvironment.ts"

export class ReviewContextError extends Schema.TaggedError<ReviewContextError>()("ReviewContextError", {
  message: Schema.String
}) {}

export interface ReviewContextInput {
  readonly repo: string
  readonly repoPath: string
  readonly branch: string
  readonly target: string
  readonly base: string
  readonly head: string
}

export interface SavedReviewContext {
  readonly repo: string
  readonly target: string
  readonly base: string
}

export interface LocalReviewContext extends ReviewContextInput {
  readonly currentHead: string
  readonly remote?: string
}

const GitOid = Schema.String.pipe(Schema.check(Schema.isPattern(/^[0-9a-f]{40}$/u)))
const PullRequestUrl = Schema.URLFromString.pipe(Schema.check(Schema.makeFilter((url) =>
  url.protocol === "https:" &&
    url.port === "" &&
    url.username === "" &&
    url.password === "" &&
    url.search === "" &&
    url.hash === "" &&
    /^\/[^/]+\/[^/]+\/pull\/[1-9][0-9]*$/u.test(url.pathname)
    ? undefined
    : "Expected a full HTTPS pull request URL"
)))
const PullRequest = Schema.Struct({
  url: Schema.NonEmptyString,
  baseRefName: Schema.NonEmptyString,
  baseRefOid: GitOid,
  headRefName: Schema.NonEmptyString,
  headRefOid: GitOid,
  headRepository: Schema.Struct({ nameWithOwner: Schema.NonEmptyString }),
  state: Schema.Literal("OPEN")
})
const PullRequestResponse = Schema.fromJsonString(PullRequest)
const PullRequestCandidates = Schema.fromJsonString(Schema.Array(Schema.Struct({ url: Schema.NonEmptyString })))

const gitText = Effect.fn("ReviewContext.gitText")(function*(repoPath: string, args: ReadonlyArray<string>, message: string) {
  const git = yield* trustedExecutable("git", repoPath)
  return yield* checkedTrimmedText(git, args, { cwd: repoPath }).pipe(
    Effect.mapError(() => new ReviewContextError({ message }))
  )
})

const selectRemote = Effect.fn("ReviewContext.selectRemote")(function*(repoPath: string, branch: string) {
  const remotesText = yield* gitText(repoPath, ["remote"], "Could not read configured Git remotes; pass --repo <owner/repo> explicitly")
  const remotes = remotesText.split("\n").map((remote) => remote.trim()).filter((remote) => remote.length > 0)
  const configured = yield* gitText(repoPath, ["config", "--get", `branch.${branch}.remote`], "").pipe(
    Effect.orElseSucceed(() => "")
  )
  if (configured.length > 0 && configured !== "." && remotes.includes(configured)) return configured
  if (remotes.includes("origin")) return "origin"
  const onlyRemote = remotes[0]
  if (remotes.length === 1 && onlyRemote !== undefined) return onlyRemote
  if (remotes.length === 0) return yield* new ReviewContextError({ message: "No configured Git remote identifies this repository; pass --repo <owner/repo> explicitly" })
  return yield* new ReviewContextError({ message: `Multiple Git remotes are configured and none is selected for branch '${branch}'; pass --repo <owner/repo> explicitly` })
})

interface ParsedRemote {
  readonly host: string
  readonly repository: string
}

export const parseGitRemote = Effect.fn("ReviewContext.parseGitRemote")(function*(remoteUrl: string) {
  const scp = remoteUrl.includes("://") ? null : /^(?:[^@/]+@)?([^:/]+):(.+)$/u.exec(remoteUrl)
  let host: string
  let pathname: string
  if (scp !== null) {
    host = scp[1] ?? ""
    pathname = scp[2] ?? ""
  } else {
    const url = yield* Effect.try({
      try: () => new URL(remoteUrl),
      catch: () => new ReviewContextError({ message: "The configured Git remote does not identify a GitHub repository; pass --repo <owner/repo> explicitly" })
    })
    if (url.protocol !== "https:" && url.protocol !== "ssh:") {
      return yield* new ReviewContextError({ message: "The configured Git remote does not identify a GitHub repository; pass --repo <owner/repo> explicitly" })
    }
    host = url.hostname
    pathname = url.pathname.replace(/^\//u, "")
  }
  const repositoryPath = pathname.replace(/[.]git$/u, "").replace(/\/$/u, "")
  const parts = repositoryPath.split("/")
  if (host.length === 0 || parts.length !== 2 || parts.some((part) => part.length === 0)) {
    return yield* new ReviewContextError({ message: "The configured Git remote does not identify a GitHub repository; pass --repo <owner/repo> explicitly" })
  }
  return { host, repository: host === "github.com" ? repositoryPath : `${host}/${repositoryPath}` } satisfies ParsedRemote
})

export const resolveLocalReviewContext = Effect.fn("ReviewContext.resolveLocal")(function*(input: ReviewContextInput) {
  const cwd = input.repoPath.length > 0 ? input.repoPath : process.cwd()
  const repoPath = input.repoPath.length > 0
    ? input.repoPath
    : yield* gitText(cwd, ["rev-parse", "--show-toplevel"], "review start requires a Git repository; run it inside the checkout or pass --repo-path <checkout>")
  const branch = input.branch.length > 0
    ? input.branch
    : yield* gitText(repoPath, ["symbolic-ref", "--quiet", "--short", "HEAD"], "review start cannot infer a branch from detached HEAD; check out the review branch or pass --branch <branch>")
  const currentHead = yield* gitText(repoPath, ["rev-parse", "--verify", "HEAD^{commit}"], "review start requires a committed HEAD or an explicit --head <commit>")
  return { ...input, repoPath, branch, currentHead } satisfies LocalReviewContext
})

const resolveRepository = Effect.fn("ReviewContext.resolveRepository")(function*(context: LocalReviewContext) {
  if (context.repo.length > 0) {
    const remote = yield* selectRemote(context.repoPath, context.branch).pipe(Effect.option)
    return remote._tag === "Some" ? { ...context, remote: remote.value } : context
  }
  const remote = yield* selectRemote(context.repoPath, context.branch)
  const remoteUrl = yield* gitText(context.repoPath, ["remote", "get-url", remote], `Could not read Git remote '${remote}'; pass --repo <owner/repo> explicitly`)
  const parsed = yield* parseGitRemote(remoteUrl)
  return { ...context, repo: parsed.repository, remote }
})

const parsePullRequestUrl = (input: string) => Schema.decodeUnknownEffect(PullRequestUrl)(input).pipe(
  Effect.mapError(() => new ReviewContextError({ message: "GitHub returned an invalid pull request URL; pass --target and --base explicitly" }))
)

const pullRequestParts = (url: URL) => {
  const parts = url.pathname.split("/").filter((part) => part.length > 0)
  return { repository: parts.slice(0, 2).join("/"), number: parts[3] ?? "" }
}

const isConfiguredPullRef = Effect.fn("ReviewContext.isConfiguredPullRef")(function*(context: LocalReviewContext, pullRequestNumber: string) {
  if (context.remote === undefined) return false
  const configuredRemote = yield* gitText(context.repoPath, ["config", "--get", `branch.${context.branch}.remote`], "").pipe(Effect.orElseSucceed(() => ""))
  const configuredMerge = yield* gitText(context.repoPath, ["config", "--get", `branch.${context.branch}.merge`], "").pipe(Effect.orElseSucceed(() => ""))
  return configuredRemote === context.remote && configuredMerge === `refs/pull/${pullRequestNumber}/head`
})

const lookupPullRequest = Effect.fn("ReviewContext.lookupPullRequest")(function*(context: LocalReviewContext) {
  const gh = yield* trustedExecutable("gh", context.repoPath).pipe(
    Effect.mapError(() => new ReviewContextError({ message: `Could not resolve GitHub CLI for '${context.repo}'; install or configure gh, or pass --target and --base explicitly` }))
  )
  const requestedPullRequest = yield* Schema.decodeUnknownEffect(PullRequestUrl)(context.target).pipe(Effect.option)
  const output = yield* checkedTrimmedText(gh, [
    "pr", "view", ...(requestedPullRequest._tag === "Some" ? [requestedPullRequest.value.href] : []),
    "--json", "url,baseRefName,baseRefOid,headRefName,headRefOid,headRepository,state"
  ], { cwd: context.repoPath }).pipe(
    Effect.mapError(() => new ReviewContextError({ message: `GitHub could not resolve one open pull request for the current branch '${context.branch}'; resolve the PR or provider failure, or pass --base <ref> explicitly` }))
  )
  const pullRequest = yield* Schema.decodeUnknownEffect(PullRequestResponse)(output).pipe(
    Effect.mapError(() => new ReviewContextError({ message: "GitHub returned an invalid open pull request response; pass --base <ref> explicitly" }))
  )
  const resolvedUrl = yield* parsePullRequestUrl(pullRequest.url)
  if (requestedPullRequest._tag === "Some" && resolvedUrl.href !== requestedPullRequest.value.href) {
    return yield* new ReviewContextError({ message: "GitHub resolved a different pull request than --target; pass the intended --target and --base explicitly" })
  }
  const contextParts = context.repo.split("/")
  const repository = contextParts.slice(-2).join("/")
  const expectedHost = contextParts.length === 2 ? "github.com" : contextParts[0] ?? ""
  const resolvedParts = pullRequestParts(resolvedUrl)
  const matchesHeadBranch = pullRequest.headRepository.nameWithOwner === repository && pullRequest.headRefName === context.branch
  const matchesPullRef = resolvedParts.repository === repository && (yield* isConfiguredPullRef(context, resolvedParts.number))
  if (resolvedUrl.hostname !== expectedHost || (!matchesHeadBranch && !matchesPullRef)) {
    return yield* new ReviewContextError({ message: `GitHub resolved a pull request from a different head branch or repository; pass --target and --base explicitly` })
  }
  const git = yield* trustedExecutable("git", context.repoPath)
  const headMatches = yield* checkedTrimmedText(git, ["merge-base", "--is-ancestor", pullRequest.headRefOid, context.currentHead], { cwd: context.repoPath }).pipe(Effect.option)
  if (headMatches._tag === "None") {
    return yield* new ReviewContextError({ message: "The resolved pull request head is not the checked-out HEAD or its ancestor; update the checkout or pass --target and --base explicitly" })
  }
  if (requestedPullRequest._tag === "None" && !matchesPullRef) {
    const candidatesJson = yield* checkedTrimmedText(gh, [
      "pr", "list", "--repo", `${resolvedUrl.hostname}/${resolvedParts.repository}`,
      "--head", pullRequest.headRefName, "--state", "open", "--limit", "2", "--json", "url"
    ], { cwd: context.repoPath }).pipe(
      Effect.mapError(() => new ReviewContextError({ message: "Could not establish a unique pull request comparison; pass --target <PR-URL> or --base <ref> explicitly" }))
    )
    const candidates = yield* Schema.decodeUnknownEffect(PullRequestCandidates)(candidatesJson).pipe(
      Effect.mapError(() => new ReviewContextError({ message: "GitHub returned invalid pull request candidates; pass --target <PR-URL> or --base <ref> explicitly" }))
    )
    if (candidates.length !== 1 || candidates[0]?.url !== pullRequest.url) {
      return yield* new ReviewContextError({ message: "Multiple or changing pull request candidates prevent a unique comparison; pass --target <PR-URL> or --base <ref> explicitly" })
    }
  }
  return pullRequest
})

const resolvableBase = Effect.fn("ReviewContext.resolvableBase")(function*(context: LocalReviewContext, base: string, baseOid: string) {
  const git = yield* trustedExecutable("git", context.repoPath)
  const candidates = [...(context.remote === undefined ? [] : [`${context.remote}/${base}`]), base]
  for (const candidate of candidates) {
    const resolved = yield* checkedTrimmedText(git, ["rev-parse", "--verify", `${candidate}^{commit}`], { cwd: context.repoPath }).pipe(Effect.option)
    if (resolved._tag === "Some" && resolved.value === baseOid) return candidate
  }
  const oid = yield* checkedTrimmedText(git, ["rev-parse", "--verify", `${baseOid}^{commit}`], { cwd: context.repoPath }).pipe(Effect.option)
  if (oid._tag === "Some" && oid.value === baseOid) return baseOid
  return yield* new ReviewContextError({ message: `The pull request base '${base}' at ${baseOid} is unavailable locally; fetch that base or pass --base <ref> explicitly` })
})

export const completeReviewContext = Effect.fn("ReviewContext.complete")(function*(local: LocalReviewContext, saved?: SavedReviewContext) {
  const fromSaved = yield* resolveRepository({
    ...local,
    repo: local.repo.length > 0 ? local.repo : saved?.repo ?? "",
    target: local.target.length > 0 ? local.target : saved?.target ?? "",
    base: local.base.length > 0 ? local.base : saved?.base ?? ""
  })
  if (fromSaved.base.length > 0) return {
    ...fromSaved,
    target: fromSaved.target.length > 0 ? fromSaved.target : fromSaved.branch
  }
  const pullRequest = yield* lookupPullRequest(fromSaved)
  return {
    ...fromSaved,
    target: fromSaved.target.length > 0 ? fromSaved.target : pullRequest.url,
    base: yield* resolvableBase(fromSaved, pullRequest.baseRefName, pullRequest.baseRefOid)
  }
})
