import * as Effect from "effect/Effect"
import * as FileSystem from "effect/FileSystem"
import * as Path from "effect/Path"
import * as Schema from "effect/Schema"

import { checkedTrimmedText } from "../../../packages/effect-cli/CheckedProcess.ts"

export class GitHubAttachmentError extends Schema.TaggedError<GitHubAttachmentError>()("GitHubAttachmentError", {
  message: Schema.String
}) {}

const GitHubPullRequest = Schema.Struct({
  url: Schema.String.pipe(Schema.check(Schema.isPattern(/^https:\/\/github[.]com\/[^/]+\/[^/]+\/pull\/[0-9]+$/u)))
})
const Repository = Schema.Struct({ id: Schema.Number })
const MediaType = Schema.String.pipe(Schema.check(Schema.isPattern(/^(?:image|video)\/[A-Za-z0-9.+-]+$/u)))
const CreatedStatus = Schema.String.pipe(Schema.check(Schema.isPattern(/^HTTP\/[0-9.]+ 201(?: |$)/u)))
const AssetUrl = Schema.String.pipe(Schema.check(Schema.isPattern(/^https:\/\/github[.]com\/user-attachments\/assets\/[A-Za-z0-9-]+$/u)))
const FetchResult = Schema.Struct({ status: Schema.Number, contentType: MediaType })

const decodeJson = <S extends Schema.Top>(schema: S, input: string, label: string) =>
  Schema.decodeUnknownEffect(Schema.fromJsonString(schema))(input).pipe(
    Effect.mapError(() => new GitHubAttachmentError({ message: `GitHub returned an invalid ${label}` }))
  )

const decodeText = <S extends Schema.Top>(schema: S, input: string, label: string) =>
  Schema.decodeUnknownEffect(schema)(input).pipe(
    Effect.mapError(() => new GitHubAttachmentError({ message: `GitHub returned an invalid ${label}: ${input}` }))
  )

export const repositoryFromPullRequest = Effect.fn("GitHubAttachment.repositoryFromPullRequest")(function*(input: string) {
  const pullRequest = yield* decodeJson(GitHubPullRequest, input, "pull request URL; this command supports github.com PRs only")
  const segments = new URL(pullRequest.url).pathname.split("/")
  return `${segments[1]}/${segments[2]}`
})

export const parseUploadResponse = Effect.fn("GitHubAttachment.parseUploadResponse")(function*(input: string) {
  const lines = input.replaceAll("\r", "").trim().split("\n")
  yield* decodeText(CreatedStatus, lines[0] ?? "", "attachment upload status")
  return yield* decodeText(AssetUrl, lines.at(-1) ?? "", "attachment URL")
})

export const parseFetchResult = (input: string) => decodeJson(FetchResult, input, "attachment verification response")

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

export const uploadGitHubAttachment = Effect.fn("GitHubAttachment.upload")(function*(options: {
  readonly pullRequest: string
  readonly evidencePath: string
}) {
  const fileSystem = yield* FileSystem.FileSystem
  const paths = yield* Path.Path
  const pullRequestJson = yield* checkedTrimmedText("gh", ["pr", "view", options.pullRequest, "--json", "url"])
  const repository = yield* repositoryFromPullRequest(pullRequestJson)
  const repositoryJson = yield* checkedTrimmedText("gh", ["api", "--hostname", "github.com", `repos/${repository}`])
  const { id: repositoryId } = yield* decodeJson(Repository, repositoryJson, "repository ID")
  const mediaType = yield* checkedTrimmedText("file", ["--brief", "--mime-type", options.evidencePath]).pipe(
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
  const assetFile = yield* fileSystem.makeTempFileScoped({ prefix: "pr-proof-attachment-" })
  const token = yield* checkedTrimmedText("gh", ["auth", "token", "--hostname", "github.com"], { displayCommand: "gh auth token --hostname github.com" })
  const fetchOutput = yield* checkedTrimmedText("curl", [
    "--silent", "--show-error", "--location", "--output", assetFile,
    "--write-out", '{"status":%{http_code},"contentType":"%{content_type}"}',
    "--header", "@-", assetUrl
  ], {
    displayCommand: `curl [verified GitHub attachment ${assetUrl}]`,
    stdin: `Authorization: Bearer ${token}\n`
  })
  const fetched = yield* parseFetchResult(fetchOutput)
  if (fetched.status !== 200) return yield* new GitHubAttachmentError({ message: `Attachment verification returned HTTP ${fetched.status}` })
  if (fetched.contentType !== mediaType) return yield* new GitHubAttachmentError({ message: `Attachment HTTP content type ${fetched.contentType} did not match ${mediaType}` })
  const detectedType = yield* checkedTrimmedText("file", ["--brief", "--mime-type", assetFile])
  if (detectedType !== mediaType) return yield* new GitHubAttachmentError({ message: `Downloaded attachment content type ${detectedType} did not match ${mediaType}` })
  const fetchedInfo = yield* fileSystem.stat(assetFile)
  if (fetchedInfo.size !== sourceInfo.size) return yield* new GitHubAttachmentError({ message: `Downloaded attachment size ${fetchedInfo.size} did not match ${sourceInfo.size}` })
  return assetUrl
})
