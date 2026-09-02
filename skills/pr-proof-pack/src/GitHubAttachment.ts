import * as Effect from "effect/Effect"
import * as FileSystem from "effect/FileSystem"
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
const minimumCurlMajor = 8
const minimumCurlMinor = 4

const decodeJson = <S extends Schema.Top>(schema: S, input: string, label: string) =>
  Schema.decodeUnknownEffect(Schema.fromJsonString(schema))(input).pipe(
    Effect.mapError(() => new GitHubAttachmentError({ message: `GitHub returned an invalid ${label}` }))
  )

export const parsePullRequestUrl = (input: string) => Schema.decodeUnknownEffect(GitHubPullRequestUrl)(input).pipe(
  Effect.mapError(() => new GitHubAttachmentError({ message: "GitHub returned an invalid pull request URL; pass the full github.com PR URL" }))
)

export const parseFetchResult = (input: string) => decodeJson(FetchResult, input, "attachment verification response")

export const requireCurlDownloadLimitSupport = Effect.fn("GitHubAttachment.requireCurlDownloadLimitSupport")(function*(
  input: string
) {
  const match = /^curl ([0-9]+)[.]([0-9]+)(?:[.][0-9]+)?(?:\s|$)/u.exec(input)
  const major = Number(match?.[1])
  const minor = Number(match?.[2])
  if (
    !Number.isSafeInteger(major) ||
    !Number.isSafeInteger(minor) ||
    major < minimumCurlMajor ||
    (major === minimumCurlMajor && minor < minimumCurlMinor)
  ) {
    return yield* new GitHubAttachmentError({
      message: "curl 8.4 or newer is required to enforce proof download limits; upgrade curl and ensure it is first on PATH"
    })
  }
})

export const checkCurlDownloadLimitSupport = Effect.fn("GitHubAttachment.checkCurlDownloadLimitSupport")(function*(
  processOptions?: Pick<CheckedTextOptions, "env" | "extendEnv" | "forceKillAfter">
) {
  const version = yield* checkedTrimmedText("curl", ["--version"], {
    ...processOptions,
    displayCommand: "curl --version"
  })
  yield* requireCurlDownloadLimitSupport(version)
})

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

export const mediaTypeRequestArgs = (evidencePath: string) => ["--brief", "--mime-type", "--", evidencePath] as const

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
