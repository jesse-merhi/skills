import { assert, describe, it } from "@effect/vitest"
import * as Effect from "effect/Effect"
import * as FileSystem from "effect/FileSystem"

import {
  extractRenderedMedia,
  parseRenderedProofResponse,
  renderedAssetFetchArgs,
  renderedProofLines,
  renderedProofRequestArgs,
  validateRenderedAsset
} from "./GitHubRenderedProof.ts"

describe("rendered GitHub proof verification", () => {
  it.effect("extracts rendered image and video URLs without preferring canonical metadata", () => extractRenderedMedia(
    '<p><img data-canonical-src="https://github.com/user-attachments/assets/canonical" src="https://camo.githubusercontent.com/signed?x=1&amp;y=2"></p><video controls src=\'https://private-user-images.githubusercontent.com/video-signed\'></video>'
  ).pipe(Effect.map((media) => {
    assert.strictEqual(media.length, 2)
    assert.strictEqual(media[0]?.kind, "image")
    assert.strictEqual(media[0]?.url.href, "https://camo.githubusercontent.com/signed?x=1&y=2")
    assert.strictEqual(media[1]?.kind, "video")
  })))

  it.effect("redacts an invalid signed rendered-media URL", () => parseRenderedProofResponse(JSON.stringify({
    body_html: '<img src="http://cdn.example.com/file?token=sentinel-secret">'
  })).pipe(Effect.flip, Effect.map((error) => {
    assert.match(error.message, /invalid rendered-media URL/u)
    assert.notInclude(error.message, "sentinel-secret")
  })))

  it("pins rendered PR lookup to the resolved GitHub.com repository", () => {
    assert.deepStrictEqual([...renderedProofRequestArgs("jesse-merhi/skills", "81")], [
      "api", "--hostname", "github.com", "repos/jesse-merhi/skills/pulls/81",
      "--header", "Accept: application/vnd.github.full+json"
    ])
  })

  it("fetches rendered assets without credentials or curl configuration", () => {
    const args = renderedAssetFetchArgs("/tmp/asset", "https://private-user-images.githubusercontent.com/signed")
    assert.strictEqual(args[0], "--disable")
    assert.includeMembers([...args], ["--location", "--proto", "=https", "--proto-redir", "=https"])
    assert.notInclude(args, "--header")
    assert.notInclude(args.join(" "), "Authorization")
  })

  it.effect("accepts a non-empty rendered image with matching content types", () => validateRenderedAsset({
    bytes: FileSystem.Size(42),
    detectedContentType: "image/png",
    fetchedContentType: "image/png",
    kind: "image",
    status: 200
  }))

  it.effect("rejects rendered media whose HTTP type does not match its element", () => validateRenderedAsset({
    bytes: FileSystem.Size(42),
    detectedContentType: "application/octet-stream",
    fetchedContentType: "application/octet-stream",
    kind: "video",
    status: 200
  }).pipe(Effect.flip, Effect.map((error) => assert.match(error.message, /video HTTP content type/u))))

  it.effect("rejects an empty rendered asset", () => validateRenderedAsset({
    bytes: FileSystem.Size(0),
    detectedContentType: "video/mp4",
    fetchedContentType: "video/mp4",
    kind: "video",
    status: 200
  }).pipe(Effect.flip, Effect.map((error) => assert.match(error.message, /was empty/u))))

  it("formats structural results without asset URLs", () => {
    const lines = renderedProofLines({
      assets: [{ bytes: FileSystem.Size(42), contentType: "video/mp4", index: 1, kind: "video" }],
      images: 0,
      videos: 1
    })
    assert.deepStrictEqual(lines, ["rendered media: images=0 videos=1", "asset 1: video video/mp4 bytes=42"])
    assert.notInclude(lines.join(" "), "http")
  })
})
