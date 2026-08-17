import * as Effect from "effect/Effect"
import * as FileSystem from "effect/FileSystem"
import * as Path from "effect/Path"
import * as Schema from "effect/Schema"

import { type CheckedTextOptions, checkedTrimmedText } from "../../../packages/effect-cli/CheckedProcess.ts"

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
const TrustedMediaUrl = Schema.URLFromString.pipe(Schema.check(Schema.makeFilter((url) =>
  url.protocol === "https:" &&
    url.port === "" &&
    url.username === "" &&
    url.password === "" &&
    (
      (url.hostname === "github.com" && /^\/user-attachments\/assets\/[A-Za-z0-9-]+$/u.test(url.pathname)) ||
      url.hostname === "github.githubassets.com" ||
      /^[a-z0-9-]+[.]githubusercontent[.]com$/u.test(url.hostname) ||
      url.hostname === "github-production-user-asset-6210df.s3.amazonaws.com"
    )
    ? undefined
    : "Expected a trusted GitHub media URL"
)))
const RedirectResult = Schema.Struct({ status: RedirectStatus, location: TrustedMediaUrl })
const FetchResult = Schema.Struct({ status: Schema.Number, contentType: Schema.String })

export const maxAttachmentBytes = FileSystem.Size(100 * 1024 * 1024)

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

export const mediaTypeEssence = (input: string) => input.split(";", 1)[0]?.trim().toLowerCase() ?? ""

export const parseTrustedMediaUrl = (input: string) => Schema.decodeUnknownEffect(TrustedMediaUrl)(input).pipe(
  Effect.mapError(() => new GitHubAttachmentError({ message: "GitHub returned an untrusted rendered-media URL" }))
)

export const parseRedirectResult = Effect.fn("GitHubAttachment.parseRedirectResult")(function*(input: string) {
  const result = yield* decodeJson(RedirectResult, input, "attachment redirect response")
  return result.location.href
})

export const parseRedirectHeaders = Effect.fn("GitHubAttachment.parseRedirectHeaders")(function*(options: {
  readonly baseUrl: string
  readonly headers: string
  readonly status: number
}) {
  const location = options.headers.replaceAll("\r", "").split("\n")
    .findLast((line) => line.toLowerCase().startsWith("location:"))?.slice("location:".length).trim() ?? ""
  if (location.length === 0) return yield* new GitHubAttachmentError({ message: "GitHub returned an invalid attachment redirect response" })
  const resolved = yield* Effect.try({
    try: () => new URL(location, options.baseUrl).href,
    catch: () => new GitHubAttachmentError({ message: "GitHub returned an invalid attachment redirect response" })
  })
  return yield* parseRedirectResult(JSON.stringify({ status: options.status, location: resolved }))
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

export const redirectRequestArgs = (responseFile: string, headersFile: string, assetUrl: string) => [
  "--disable", "--globoff", "--silent", "--show-error", "--output", responseFile,
  "--dump-header", headersFile, "--max-redirs", "0", "--proto", "=https",
  "--max-filesize", maxAttachmentBytes.toString(), "--max-time", "600",
  "--write-out", '{"status":%{http_code},"contentType":"%{content_type}"}',
  "--header", "@-", assetUrl
] as const

export const fetchRequestArgs = (
  assetFile: string,
  headersFile: string,
  maxBytes: FileSystem.Size = maxAttachmentBytes
) => [
  "--disable", "--globoff", "--silent", "--show-error", "--output", assetFile,
  "--dump-header", headersFile, "--max-redirs", "0", "--proto", "=https",
  "--max-filesize", maxBytes.toString(), "--max-time", "600",
  "--write-out", '{"status":%{http_code},"contentType":"%{content_type}"}',
  "--config", "-"
] as const

export const curlUrlConfig = (url: string) => `url = "${url.replaceAll("\\", "\\\\").replaceAll("\"", "\\\"")}"\n`

export const allowTrustedRedirect = (redirects: number) => redirects < 5
  ? Effect.void
  : Effect.fail(new GitHubAttachmentError({ message: "GitHub attachment exceeded 5 trusted redirects" }))

export const fetchTrustedAsset = Effect.fn("GitHubAttachment.fetchTrustedAsset")(function*(options: {
  readonly assetFile: string
  readonly assetUrl: string
  readonly label: string
  readonly maxBytes?: FileSystem.Size
  readonly processOptions?: Pick<CheckedTextOptions, "env" | "extendEnv" | "forceKillAfter">
}) {
  const fileSystem = yield* FileSystem.FileSystem
  const maxBytes = options.maxBytes ?? maxAttachmentBytes
  let downloadedBytes = FileSystem.Size(0)
  let currentUrl = (yield* parseTrustedMediaUrl(options.assetUrl)).href
  for (let redirects = 0; redirects <= 5; redirects += 1) {
    const remainingBytes = FileSystem.Size(maxBytes - downloadedBytes)
    if (remainingBytes <= FileSystem.Size(0)) {
      return yield* new GitHubAttachmentError({ message: "GitHub attachment exceeded its download byte budget" })
    }
    const headersFile = yield* fileSystem.makeTempFileScoped({ prefix: "pr-proof-asset-headers-" })
    const output = yield* checkedTrimmedText("curl", fetchRequestArgs(
      options.assetFile,
      headersFile,
      remainingBytes
    ), {
      ...options.processOptions,
      displayCommand: `curl [${options.label}]`,
      includeStdoutInError: false,
      redactions: [currentUrl],
      stdin: curlUrlConfig(currentUrl)
    })
    const fetched = yield* parseFetchResult(output)
    const responseInfo = yield* fileSystem.stat(options.assetFile)
    downloadedBytes = FileSystem.Size(downloadedBytes + responseInfo.size)
    if (downloadedBytes > maxBytes) {
      return yield* new GitHubAttachmentError({ message: "GitHub attachment exceeded its download byte budget" })
    }
    if (fetched.status < 300 || fetched.status > 399) return { ...fetched, downloadedBytes }
    yield* allowTrustedRedirect(redirects)
    const headers = yield* fileSystem.readFileString(headersFile)
    currentUrl = yield* parseRedirectHeaders({ baseUrl: currentUrl, headers, status: fetched.status })
  }
  return yield* new GitHubAttachmentError({ message: "GitHub attachment redirect verification failed" })
})

export const verifyAttachment = Effect.fn("GitHubAttachment.verifyAttachment")(function*(options: {
  readonly expectedMediaType: string
  readonly expectedSize: FileSystem.Size
  readonly fetched: typeof FetchResult.Type
  readonly fetchedMediaType: string
  readonly fetchedSize: FileSystem.Size
}) {
  if (options.fetched.status !== 200) return yield* new GitHubAttachmentError({ message: `Attachment verification returned HTTP ${options.fetched.status}` })
  const fetchedContentType = mediaTypeEssence(options.fetched.contentType)
  if (fetchedContentType !== options.expectedMediaType) return yield* new GitHubAttachmentError({ message: `Attachment HTTP content type ${fetchedContentType} did not match ${options.expectedMediaType}` })
  if (options.fetchedMediaType !== options.expectedMediaType) return yield* new GitHubAttachmentError({ message: `Downloaded attachment content type ${options.fetchedMediaType} did not match ${options.expectedMediaType}` })
  if (options.fetchedSize !== options.expectedSize) return yield* new GitHubAttachmentError({ message: `Downloaded attachment size ${options.fetchedSize} did not match ${options.expectedSize}` })
})

export const requireAttachmentSize = Effect.fn("GitHubAttachment.requireAttachmentSize")(function*(bytes: FileSystem.Size) {
  if (bytes > maxAttachmentBytes) {
    return yield* new GitHubAttachmentError({ message: "GitHub attachments cannot exceed 100 MiB" })
  }
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
  yield* requireAttachmentSize(sourceInfo.size)
  const uploadOutput = yield* checkedTrimmedText("gh", uploadRequestArgs({
    evidencePath: options.evidencePath,
    evidenceName: paths.basename(options.evidencePath),
    mediaType,
    repositoryId
  }), { displayCommand: `gh api [attachment upload for ${repository}]` })
  const assetUrl = yield* parseUploadResponse(uploadOutput)
  const redirectFile = yield* fileSystem.makeTempFileScoped({ prefix: "pr-proof-redirect-" })
  const redirectHeadersFile = yield* fileSystem.makeTempFileScoped({ prefix: "pr-proof-redirect-headers-" })
  const token = yield* checkedTrimmedText("gh", ["auth", "token", "--hostname", "github.com"], { displayCommand: "gh auth token --hostname github.com" }).pipe(
    Effect.flatMap(parseGitHubToken)
  )
  const redirectOutput = yield* checkedTrimmedText("curl", redirectRequestArgs(redirectFile, redirectHeadersFile, assetUrl), {
    displayCommand: `curl [GitHub attachment redirect ${assetUrl}]`,
    includeStdoutInError: false,
    redactions: [token],
    stdin: `Authorization: Bearer ${token}\n`
  })
  const redirectResponse = yield* parseFetchResult(redirectOutput)
  if (redirectResponse.status < 300 || redirectResponse.status > 399) {
    return yield* new GitHubAttachmentError({ message: `Attachment redirect returned HTTP ${redirectResponse.status}` })
  }
  const redirectHeaders = yield* fileSystem.readFileString(redirectHeadersFile)
  const redirectUrl = yield* parseRedirectHeaders({ baseUrl: assetUrl, headers: redirectHeaders, status: redirectResponse.status })
  const redirectInfo = yield* fileSystem.stat(redirectFile)
  const remainingVerificationBytes = FileSystem.Size(maxAttachmentBytes - redirectInfo.size)
  if (remainingVerificationBytes <= FileSystem.Size(0)) {
    return yield* new GitHubAttachmentError({ message: "GitHub attachment exceeded its download byte budget" })
  }
  const assetFile = yield* fileSystem.makeTempFileScoped({ prefix: "pr-proof-attachment-" })
  const fetched = yield* fetchTrustedAsset({
    assetFile,
    assetUrl: redirectUrl,
    label: `verified GitHub attachment ${assetUrl}`,
    maxBytes: remainingVerificationBytes
  })
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
