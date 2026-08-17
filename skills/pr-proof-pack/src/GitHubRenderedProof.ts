import * as Effect from "effect/Effect"
import * as FileSystem from "effect/FileSystem"
import * as Schema from "effect/Schema"

import { checkedTrimmedText } from "../../../packages/effect-cli/CheckedProcess.ts"
import {
  fetchTrustedAsset,
  GitHubAttachmentError,
  mediaTypeEssence,
  mediaTypeRequestArgs,
  parsePullRequestUrl,
  parseTrustedMediaUrl
} from "./GitHubAttachment.ts"

const RenderedPullRequest = Schema.Struct({ body_html: Schema.String })

export interface RenderedMedia {
  readonly kind: "image" | "video"
  readonly url: URL
}

export interface RenderedAssetResult {
  readonly bytes: FileSystem.Size
  readonly contentType: string
  readonly index: number
  readonly kind: RenderedMedia["kind"]
}

export interface RenderedProofResult {
  readonly assets: ReadonlyArray<RenderedAssetResult>
  readonly images: number
  readonly videos: number
}

const decodeHtmlAttribute = (value: string) => value
  .replaceAll("&amp;", "&")
  .replaceAll("&#38;", "&")
  .replaceAll("&#x26;", "&")

export const renderedProofRequestArgs = (repository: string, pullRequestNumber: string) => [
  "api", "--hostname", "github.com", `repos/${repository}/pulls/${pullRequestNumber}`,
  "--header", "Accept: application/vnd.github.full+json"
] as const

export const extractRenderedMedia = Effect.fn("GitHubRenderedProof.extractRenderedMedia")(function*(bodyHtml: string) {
  const matches = [...bodyHtml.matchAll(/<(img|video)\b[^>]*\ssrc\s*=\s*(?:"([^"]+)"|'([^']+)')[^>]*>/giu)]
  return yield* Effect.forEach(matches, Effect.fnUntraced(function*(match): Effect.fn.Return<RenderedMedia, GitHubAttachmentError> {
    const kind = match[1]?.toLowerCase() === "video" ? "video" : "image"
    const encodedUrl = match[2] ?? match[3] ?? ""
    const url = yield* parseTrustedMediaUrl(decodeHtmlAttribute(encodedUrl)).pipe(
      Effect.mapError(() => new GitHubAttachmentError({ message: "GitHub returned an invalid rendered-media URL" }))
    )
    return { kind, url }
  }))
})

export const parseRenderedProofResponse = Effect.fn("GitHubRenderedProof.parseResponse")(function*(input: string) {
  const pullRequest = yield* Schema.decodeUnknownEffect(Schema.fromJsonString(RenderedPullRequest))(input).pipe(
    Effect.mapError(() => new GitHubAttachmentError({ message: "GitHub returned an invalid rendered pull request" }))
  )
  return yield* extractRenderedMedia(pullRequest.body_html)
})

export const validateRenderedAsset = Effect.fn("GitHubRenderedProof.validateAsset")(function*(options: {
  readonly bytes: FileSystem.Size
  readonly detectedContentType: string
  readonly fetchedContentType: string
  readonly kind: RenderedMedia["kind"]
  readonly status: number
}) {
  if (options.status !== 200) return yield* new GitHubAttachmentError({ message: `Rendered attachment verification returned HTTP ${options.status}` })
  const expectedPrefix = `${options.kind}/`
  if (!mediaTypeEssence(options.fetchedContentType).startsWith(expectedPrefix)) return yield* new GitHubAttachmentError({ message: `Rendered ${options.kind} HTTP content type did not match its element` })
  if (!mediaTypeEssence(options.detectedContentType).startsWith(expectedPrefix)) return yield* new GitHubAttachmentError({ message: `Rendered ${options.kind} detected content type did not match its element` })
  if (options.bytes === FileSystem.Size(0)) return yield* new GitHubAttachmentError({ message: "Rendered attachment was empty" })
})

export const renderedProofLines = (result: RenderedProofResult) => [
  `rendered media: images=${result.images} videos=${result.videos}`,
  ...result.assets.map((asset) => `asset ${asset.index}: ${asset.kind} ${asset.contentType} bytes=${asset.bytes}`)
]

export const verifyGitHubRenderedProof = Effect.fn("GitHubRenderedProof.verify")(function*(pullRequest: string) {
  const fileSystem = yield* FileSystem.FileSystem
  const pullRequestUrl = yield* parsePullRequestUrl(pullRequest)
  const segments = pullRequestUrl.pathname.split("/")
  const repository = `${segments[1]}/${segments[2]}`
  const pullRequestNumber = segments[4] ?? ""
  const response = yield* checkedTrimmedText("gh", renderedProofRequestArgs(repository, pullRequestNumber), {
    displayCommand: `gh api [rendered pull request ${repository}#${pullRequestNumber}]`
  })
  const media = yield* parseRenderedProofResponse(response)
  const assets = yield* Effect.forEach(media, (item, position) => Effect.scoped(Effect.gen(function*() {
    const assetFile = yield* fileSystem.makeTempFileScoped({ prefix: "pr-proof-rendered-asset-" })
    const fetched = yield* fetchTrustedAsset({
      assetFile,
      assetUrl: item.url.href,
      label: `rendered PR asset ${position + 1}`
    })
    const detectedContentType = yield* checkedTrimmedText("file", mediaTypeRequestArgs(assetFile))
    const info = yield* fileSystem.stat(assetFile)
    yield* validateRenderedAsset({
      bytes: info.size,
      detectedContentType,
      fetchedContentType: fetched.contentType,
      kind: item.kind,
      status: fetched.status
    })
    return {
      bytes: info.size,
      contentType: mediaTypeEssence(fetched.contentType),
      index: position + 1,
      kind: item.kind
    }
  })))
  return {
    assets,
    images: media.filter((item) => item.kind === "image").length,
    videos: media.filter((item) => item.kind === "video").length
  }
})
