import * as Duration from "effect/Duration"
import * as Effect from "effect/Effect"
import * as FileSystem from "effect/FileSystem"
import * as Schema from "effect/Schema"

import { type CheckedTextOptions, checkedTrimmedText } from "../../../packages/effect-cli/CheckedProcess.ts"
import {
  fetchTrustedAsset,
  GitHubAttachmentError,
  maxAttachmentBytes,
  mediaTypeEssence,
  mediaTypeRequestArgs,
  parsePullRequestUrl,
  parseTrustedMediaUrl
} from "./GitHubAttachment.ts"

const RenderedPullRequest = Schema.Struct({
  body: Schema.NullOr(Schema.String),
  body_html: Schema.String,
  head: Schema.Struct({ sha: Schema.String })
})

const maxRenderedTotalBytes = FileSystem.Size(500 * 1024 * 1024)
const renderedProofProcessOptions = { forceKillAfter: "1 second" } as const

type RenderedProofProcessOptions = Pick<CheckedTextOptions, "env" | "extendEnv" | "forceKillAfter">

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

interface RenderedProofDocument {
  readonly body: string
  readonly headSha: string
  readonly media: ReadonlyArray<RenderedMedia>
}

const decodeHtmlAttribute = (value: string) => value
  .replaceAll("&amp;", "&")
  .replaceAll("&#38;", "&")
  .replaceAll("&#x26;", "&")

const mediaStartTags = (bodyHtml: string) => {
  const tags: Array<{
    readonly attribute: "src" | "srcset"
    readonly kind: RenderedMedia["kind"]
    readonly value: string
  }> = []
  let index = 0
  while (index < bodyHtml.length) {
    if (bodyHtml[index] !== "<") {
      index += 1
      continue
    }
    if (bodyHtml.startsWith("<!--", index)) {
      const commentEnd = bodyHtml.indexOf("-->", index + 4)
      index = commentEnd === -1 ? bodyHtml.length : commentEnd + 3
      continue
    }
    const name = /^[A-Za-z]+/u.exec(bodyHtml.slice(index + 1))?.[0]
    const normalized = name?.toLowerCase()
    if (normalized !== "img" && normalized !== "source" && normalized !== "video") {
      index += 1
      continue
    }
    let quote: "\"" | "'" | undefined
    let end = index + 1 + normalized.length
    for (; end < bodyHtml.length; end += 1) {
      const character = bodyHtml[end]
      if (quote === undefined && (character === "\"" || character === "'")) quote = character
      else if (quote === character) quote = undefined
      else if (quote === undefined && character === ">") break
    }
    if (end < bodyHtml.length) {
      tags.push({
        attribute: normalized === "source" ? "srcset" : "src",
        kind: normalized === "video" ? "video" : "image",
        value: bodyHtml.slice(index, end + 1)
      })
      index = end + 1
    } else {
      index += 1
    }
  }
  return tags
}

const srcsetCandidates = (value: string) => value.split(",")
  .map((candidate) => candidate.trim().split(/\s+/u)[0] ?? "")
  .filter((candidate) => candidate.length > 0)

const startTagAttribute = (tag: string, attribute: string) => {
  let index = 1
  while (/[A-Za-z]/u.test(tag[index] ?? "")) index += 1
  while (index < tag.length) {
    while (/\s/u.test(tag[index] ?? "")) index += 1
    if (tag[index] === ">" || (tag[index] === "/" && tag[index + 1] === ">")) return undefined
    const nameStart = index
    while (/[^\s=/>]/u.test(tag[index] ?? "")) index += 1
    const name = tag.slice(nameStart, index).toLowerCase()
    while (/\s/u.test(tag[index] ?? "")) index += 1
    if (tag[index] !== "=") continue
    index += 1
    while (/\s/u.test(tag[index] ?? "")) index += 1
    const quote = tag[index] === "\"" || tag[index] === "'" ? tag[index] : undefined
    if (quote !== undefined) index += 1
    const valueStart = index
    if (quote === undefined) while (/[^\s>]/u.test(tag[index] ?? "")) index += 1
    else while (index < tag.length && tag[index] !== quote) index += 1
    const value = tag.slice(valueStart, index)
    if (quote !== undefined && tag[index] === quote) index += 1
    if (name === attribute) return value
  }
  return undefined
}

export const renderedProofRequestArgs = (repository: string, pullRequestNumber: string) => [
  "api", "--hostname", "github.com", `repos/${repository}/pulls/${pullRequestNumber}`,
  "--header", "Accept: application/vnd.github.full+json"
] as const

export const extractRenderedMedia = Effect.fn("GitHubRenderedProof.extractRenderedMedia")(function*(bodyHtml: string) {
  const tags = mediaStartTags(bodyHtml)
  const media: Array<RenderedMedia> = []
  for (const tag of tags) {
    const encodedValue = startTagAttribute(tag.value, tag.attribute)
    if (encodedValue === undefined && tag.attribute === "srcset") continue
    const candidates = tag.attribute === "srcset" ? srcsetCandidates(encodedValue ?? "") : [encodedValue ?? ""]
    for (const candidate of candidates) {
      const url = yield* parseTrustedMediaUrl(decodeHtmlAttribute(candidate)).pipe(
        Effect.mapError(() => new GitHubAttachmentError({ message: "GitHub returned an invalid rendered-media URL" }))
      )
      media.push({ kind: tag.kind, url })
    }
  }
  return media
})

const parseRenderedProofDocument = Effect.fn("GitHubRenderedProof.parseDocument")(function*(input: string) {
  const pullRequest = yield* Schema.decodeUnknownEffect(Schema.fromJsonString(RenderedPullRequest))(input).pipe(
    Effect.mapError(() => new GitHubAttachmentError({ message: "GitHub returned an invalid rendered pull request" }))
  )
  return {
    body: pullRequest.body ?? "",
    headSha: pullRequest.head.sha,
    media: yield* extractRenderedMedia(pullRequest.body_html)
  }
})

export const parseRenderedProofResponse = Effect.fn("GitHubRenderedProof.parseResponse")(function*(input: string) {
  return (yield* parseRenderedProofDocument(input)).media
})

export const requireRenderedByteBudget = Effect.fn("GitHubRenderedProof.requireByteBudget")(function*(bytes: FileSystem.Size) {
  if (bytes > maxRenderedTotalBytes) {
    return yield* new GitHubAttachmentError({ message: "GitHub rendered proof exceeded the 500 MiB download budget" })
  }
})

export const renderedAssetBatchSize = Effect.fn("GitHubRenderedProof.renderedAssetBatchSize")(function*(
  downloadedBytes: FileSystem.Size
) {
  const remainingBytes = FileSystem.Size(maxRenderedTotalBytes - downloadedBytes)
  if (remainingBytes <= FileSystem.Size(0)) {
    return yield* new GitHubAttachmentError({ message: "GitHub rendered proof exceeded the 500 MiB download budget" })
  }
  return Math.max(1, Math.min(4, Number(remainingBytes / maxAttachmentBytes)))
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

const loadRenderedProof = Effect.fn("GitHubRenderedProof.loadRenderedProof")(function*(
  repository: string,
  pullRequestNumber: string,
  processOptions: RenderedProofProcessOptions
) {
  const response = yield* checkedTrimmedText("gh", renderedProofRequestArgs(repository, pullRequestNumber), {
    ...processOptions,
    displayCommand: `gh api [rendered pull request ${repository}#${pullRequestNumber}]`,
    includeStdoutInError: false
  })
  return yield* parseRenderedProofDocument(response)
})

const renderedMediaIdentity = (item: RenderedMedia) => {
  const url = new URL(item.url)
  for (const key of [...url.searchParams.keys()]) {
    const normalized = key.toLowerCase()
    if (normalized === "jwt" || normalized.startsWith("x-amz-")) url.searchParams.delete(key)
  }
  url.searchParams.sort()
  url.hash = ""
  return `${item.kind}:${url.href}`
}

const requireSameRenderedProof = Effect.fn("GitHubRenderedProof.requireSameRenderedProof")(function*(
  expected: RenderedProofDocument,
  actual: RenderedProofDocument
) {
  if (
    actual.body !== expected.body ||
    actual.headSha !== expected.headSha ||
    actual.media.length !== expected.media.length ||
    actual.media.some((item, index) => {
      const expectedItem = expected.media[index]
      return expectedItem === undefined || renderedMediaIdentity(item) !== renderedMediaIdentity(expectedItem)
    })
  ) {
    return yield* new GitHubAttachmentError({ message: "GitHub rendered proof changed during verification" })
  }
})

const requireExpectedHead = Effect.fn("GitHubRenderedProof.requireExpectedHead")(function*(
  expectedHeadSha: string,
  actualHeadSha: string
) {
  if (actualHeadSha !== expectedHeadSha) {
    return yield* new GitHubAttachmentError({ message: "GitHub pull request head did not match the expected final head" })
  }
})

const groupRenderedMedia = (media: ReadonlyArray<RenderedMedia>) => {
  const groups: Array<{ readonly positions: Array<number> }> = []
  const groupIndexByIdentity = new Map<string, number>()
  for (let position = 0; position < media.length; position += 1) {
    const item = media[position]
    if (item === undefined) continue
    const identity = renderedMediaIdentity(item)
    const groupIndex = groupIndexByIdentity.get(identity)
    if (groupIndex === undefined) {
      groupIndexByIdentity.set(identity, groups.length)
      groups.push({ positions: [position] })
    } else {
      groups[groupIndex]?.positions.push(position)
    }
  }
  return groups
}

const verifyRenderedProof = Effect.fn("GitHubRenderedProof.verify")(function*(
  pullRequest: string,
  expectedHeadSha: string,
  processOptions: RenderedProofProcessOptions
) {
  const fileSystem = yield* FileSystem.FileSystem
  const pullRequestUrl = yield* parsePullRequestUrl(pullRequest)
  const segments = pullRequestUrl.pathname.split("/")
  const repository = `${segments[1]}/${segments[2]}`
  const pullRequestNumber = segments[4] ?? ""
  const proof = yield* loadRenderedProof(repository, pullRequestNumber, processOptions)
  yield* requireExpectedHead(expectedHeadSha, proof.headSha)
  const { media } = proof
  const groups = groupRenderedMedia(media)
  const assets: Array<RenderedAssetResult> = []
  let downloadedBytes = FileSystem.Size(0)
  for (let start = 0; start < groups.length;) {
    const batchSize = yield* renderedAssetBatchSize(downloadedBytes)
    const remainingBytes = FileSystem.Size(maxRenderedTotalBytes - downloadedBytes)
    const maxAssetBytes = FileSystem.Size(remainingBytes < maxAttachmentBytes ? remainingBytes : maxAttachmentBytes)
    const currentProof = start === 0 ? proof : yield* loadRenderedProof(repository, pullRequestNumber, processOptions)
    if (start > 0) yield* requireSameRenderedProof(proof, currentProof)
    const batch = groups.slice(start, start + batchSize)
    const batchAssets = yield* Effect.forEach(batch, (group) => {
      const position = group.positions[0] ?? 0
      const item = currentProof.media[position]
      if (item === undefined) {
        return Effect.fail(new GitHubAttachmentError({ message: "GitHub rendered proof changed during verification" }))
      }
      return Effect.scoped(Effect.gen(function*() {
        const assetFile = yield* fileSystem.makeTempFileScoped({ prefix: "pr-proof-rendered-asset-" })
        const fetched = yield* fetchTrustedAsset({
          assetFile,
          assetUrl: item.url.href,
          label: `rendered PR asset ${position + 1}`,
          maxBytes: maxAssetBytes,
          processOptions
        })
        const detectedContentType = yield* checkedTrimmedText("file", mediaTypeRequestArgs(assetFile), {
          ...processOptions
        })
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
          kind: item.kind,
          positions: group.positions
        }
      })).pipe(Effect.mapError((error) => new GitHubAttachmentError({
        message: `Rendered asset ${position + 1}: ${error.message}`
      })))
    }, { concurrency: "unbounded" })
    for (const asset of batchAssets) {
      downloadedBytes = FileSystem.Size(downloadedBytes + asset.bytes)
      yield* requireRenderedByteBudget(downloadedBytes)
      for (const position of asset.positions) {
        assets.push({
          bytes: asset.bytes,
          contentType: asset.contentType,
          index: position + 1,
          kind: asset.kind
        })
      }
    }
    start += batchSize
  }
  const finalProof = yield* loadRenderedProof(repository, pullRequestNumber, processOptions)
  yield* requireSameRenderedProof(proof, finalProof)
  assets.sort((left, right) => left.index - right.index)
  return {
    assets,
    images: media.filter((item) => item.kind === "image").length,
    videos: media.filter((item) => item.kind === "video").length
  }
})

export const withRenderedProofDeadline = <A, E, R>(effect: Effect.Effect<A, E, R>, duration: Duration.Input) =>
  effect.pipe(Effect.timeoutOrElse({
    duration,
    orElse: () => Effect.fail(new GitHubAttachmentError({ message: "GitHub rendered proof verification exceeded 10 minutes" }))
  }))

export const verifyGitHubRenderedProof = Effect.fn("GitHubRenderedProof.verifyWithDeadline")((
  pullRequest: string,
  expectedHeadSha: string,
  options?: {
    readonly deadline?: Duration.Input
    readonly processOptions?: RenderedProofProcessOptions
  }
) => withRenderedProofDeadline(
  verifyRenderedProof(pullRequest, expectedHeadSha, { ...renderedProofProcessOptions, ...options?.processOptions }),
  options?.deadline ?? "10 minutes"
))
