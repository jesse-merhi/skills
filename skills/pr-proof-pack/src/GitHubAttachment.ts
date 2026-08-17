import * as Effect from "effect/Effect"
import * as FileSystem from "effect/FileSystem"
import * as Path from "effect/Path"
import * as Schema from "effect/Schema"

import { checkedTrimmedText } from "../../../packages/effect-cli/CheckedProcess.ts"

export class GitHubAttachmentError extends Schema.TaggedError<GitHubAttachmentError>()("GitHubAttachmentError", {
  message: Schema.String
}) {}

const GitHubPullRequestUrl = Schema.URLFromString.pipe(Schema.check(Schema.makeFilter((url) =>
  url.protocol === "https:" &&
    url.hostname === "github.com" &&
    url.port === "" &&
    url.username === "" &&
    url.password === "" &&
    url.search === "" &&
    url.hash === "" &&
    /^\/[^/]+\/[^/]+\/pull\/[1-9][0-9]*$/u.test(url.pathname)
    ? undefined
    : "Expected a full https://github.com/<owner>/<repository>/pull/<number> URL"
)))
const GitHubPullRequest = Schema.Struct({ url: GitHubPullRequestUrl })
const Repository = Schema.Struct({ id: Schema.Number })
const MediaType = Schema.String.pipe(Schema.check(Schema.isPattern(/^(?:image|video)\/[A-Za-z0-9.+-]+$/u)))
const GitHubToken = Schema.NonEmptyString.pipe(Schema.check(Schema.isPattern(/^[^\r\n]+$/u)))
const CreatedStatus = Schema.String.pipe(Schema.check(Schema.isPattern(/^HTTP\/[0-9.]+ 201(?: |$)/u)))
const AssetUrl = Schema.String.pipe(Schema.check(Schema.isPattern(/^https:\/\/github[.]com\/user-attachments\/assets\/[A-Za-z0-9-]+$/u)))
const RedirectStatus = Schema.Int.pipe(
  Schema.check(Schema.isGreaterThanOrEqualTo(300), Schema.isLessThanOrEqualTo(399))
)
const HttpsUrl = Schema.URLFromString.pipe(Schema.check(Schema.makeFilter((url) =>
  url.protocol === "https:" ? undefined : "Expected an HTTPS attachment redirect"
)))
const RedirectResult = Schema.Struct({ status: RedirectStatus, location: HttpsUrl })
const FetchResult = Schema.Struct({ status: Schema.Number, contentType: MediaType })

const decodeJson = <S extends Schema.Top>(schema: S, input: string, label: string) =>
  Schema.decodeUnknownEffect(Schema.fromJsonString(schema))(input).pipe(
    Effect.mapError(() => new GitHubAttachmentError({ message: `GitHub returned an invalid ${label}` }))
  )

const decodeText = <S extends Schema.Top>(schema: S, input: string, label: string) =>
  Schema.decodeUnknownEffect(schema)(input).pipe(
    Effect.mapError(() => new GitHubAttachmentError({ message: `GitHub returned an invalid ${label}` }))
  )

export const repositoryFromPullRequest = Effect.fn("GitHubAttachment.repositoryFromPullRequest")(function*(input: string) {
  const pullRequest = yield* decodeJson(GitHubPullRequest, input, "pull request URL; this command supports github.com PRs only")
  const segments = pullRequest.url.pathname.split("/")
  return `${segments[1]}/${segments[2]}`
})

export const parsePullRequestUrl = (input: string) => Schema.decodeUnknownEffect(GitHubPullRequestUrl)(input).pipe(
  Effect.mapError(() => new GitHubAttachmentError({ message: "GitHub returned an invalid pull request URL; pass the full github.com PR URL" }))
)

export const parseGitHubToken = (input: string) => Schema.decodeUnknownEffect(GitHubToken)(input).pipe(
  Effect.mapError(() => new GitHubAttachmentError({ message: "GitHub returned an invalid single-line authentication token" }))
)

export const parseUploadResponse = Effect.fn("GitHubAttachment.parseUploadResponse")(function*(input: string) {
  const lines = input.replaceAll("\r", "").trim().split("\n")
  yield* decodeText(CreatedStatus, lines[0] ?? "", "attachment upload status")
  return yield* decodeText(AssetUrl, lines.at(-1) ?? "", "attachment URL")
})

export const parseFetchResult = (input: string) => decodeJson(FetchResult, input, "attachment verification response")

export const parseRedirectResult = Effect.fn("GitHubAttachment.parseRedirectResult")(function*(input: string) {
  const result = yield* decodeJson(RedirectResult, input, "attachment redirect response")
  return result.location.href
})

export const uploadRequestArgs = (options: {
  readonly evidencePath: string
  readonly evidenceName: string
  readonly mediaType: string
  readonly repositoryId: number
}) => [
  "api", "--method", "POST", "--hostname", "github.com",
  "https://uploads.github.com/user-attachments/assets",
  "--header", "Content-Type: application/octet-stream",
  "--header", "Accept: application/json",
  "--header", "X-GitHub-Api-Version: 2022-11-28",
  "--input", options.evidencePath,
  "--raw-field", `name=${options.evidenceName}`,
  "--raw-field", `content_type=${options.mediaType}`,
  "--field", `repository_id=${options.repositoryId}`,
  "--include", "--jq", ".url"
] as const

export const mediaTypeRequestArgs = (evidencePath: string) => ["--brief", "--mime-type", "--", evidencePath] as const

export const redirectRequestArgs = (responseFile: string, assetUrl: string) => [
  "--disable", "--silent", "--show-error", "--output", responseFile,
  "--write-out", '{"status":%{http_code},"location":"%{redirect_url}"}',
  "--header", "@-", assetUrl
] as const

export const fetchRequestArgs = (assetFile: string, redirectUrl: string) => [
  "--disable", "--silent", "--show-error", "--location", "--proto", "=https", "--proto-redir", "=https", "--output", assetFile,
  "--write-out", '{"status":%{http_code},"contentType":"%{content_type}"}',
  redirectUrl
] as const

export const verifyAttachment = Effect.fn("GitHubAttachment.verifyAttachment")(function*(options: {
  readonly expectedMediaType: string
  readonly expectedSize: FileSystem.Size
  readonly fetched: typeof FetchResult.Type
  readonly fetchedMediaType: string
  readonly fetchedSize: FileSystem.Size
}) {
  if (options.fetched.status !== 200) return yield* new GitHubAttachmentError({ message: `Attachment verification returned HTTP ${options.fetched.status}` })
  if (options.fetched.contentType !== options.expectedMediaType) return yield* new GitHubAttachmentError({ message: `Attachment HTTP content type ${options.fetched.contentType} did not match ${options.expectedMediaType}` })
  if (options.fetchedMediaType !== options.expectedMediaType) return yield* new GitHubAttachmentError({ message: `Downloaded attachment content type ${options.fetchedMediaType} did not match ${options.expectedMediaType}` })
  if (options.fetchedSize !== options.expectedSize) return yield* new GitHubAttachmentError({ message: `Downloaded attachment size ${options.fetchedSize} did not match ${options.expectedSize}` })
})

export const uploadGitHubAttachment = Effect.fn("GitHubAttachment.upload")(function*(options: {
  readonly pullRequest: string
  readonly evidencePath: string
}) {
  const fileSystem = yield* FileSystem.FileSystem
  const paths = yield* Path.Path
  const pullRequestUrl = yield* parsePullRequestUrl(options.pullRequest)
  const pullRequestJson = yield* checkedTrimmedText("gh", ["pr", "view", pullRequestUrl.href, "--json", "url"])
  const repository = yield* repositoryFromPullRequest(pullRequestJson)
  const repositoryJson = yield* checkedTrimmedText("gh", ["api", "--hostname", "github.com", `repos/${repository}`])
  const { id: repositoryId } = yield* decodeJson(Repository, repositoryJson, "repository ID")
  const mediaType = yield* checkedTrimmedText("file", mediaTypeRequestArgs(options.evidencePath)).pipe(
    Effect.flatMap((value) => decodeText(MediaType, value, "image or video content type"))
  )
  const sourceInfo = yield* fileSystem.stat(options.evidencePath)
  const uploadOutput = yield* checkedTrimmedText("gh", uploadRequestArgs({
    evidencePath: options.evidencePath,
    evidenceName: paths.basename(options.evidencePath),
    mediaType,
    repositoryId
  }), { displayCommand: `gh api [attachment upload for ${repository}]` })
  const assetUrl = yield* parseUploadResponse(uploadOutput)
  const redirectFile = yield* fileSystem.makeTempFileScoped({ prefix: "pr-proof-redirect-" })
  const token = yield* checkedTrimmedText("gh", ["auth", "token", "--hostname", "github.com"], { displayCommand: "gh auth token --hostname github.com" }).pipe(
    Effect.flatMap(parseGitHubToken)
  )
  const redirectOutput = yield* checkedTrimmedText("curl", redirectRequestArgs(redirectFile, assetUrl), {
    displayCommand: `curl [GitHub attachment redirect ${assetUrl}]`,
    stdin: `Authorization: Bearer ${token}\n`
  })
  const redirectUrl = yield* parseRedirectResult(redirectOutput)
  const assetFile = yield* fileSystem.makeTempFileScoped({ prefix: "pr-proof-attachment-" })
  const fetchOutput = yield* checkedTrimmedText("curl", fetchRequestArgs(assetFile, redirectUrl), {
    displayCommand: `curl [verified GitHub attachment ${assetUrl}]`
  })
  const fetched = yield* parseFetchResult(fetchOutput)
  const detectedType = yield* checkedTrimmedText("file", mediaTypeRequestArgs(assetFile))
  const fetchedInfo = yield* fileSystem.stat(assetFile)
  yield* verifyAttachment({
    expectedMediaType: mediaType,
    expectedSize: sourceInfo.size,
    fetched,
    fetchedMediaType: detectedType,
    fetchedSize: fetchedInfo.size
  })
  return assetUrl
})
