import { assert, describe, it } from "@effect/vitest"
import * as Effect from "effect/Effect"
import * as FileSystem from "effect/FileSystem"
// @effect-diagnostics-next-line nodeBuiltinImport:off
import { spawnSync } from "node:child_process"
// @effect-diagnostics-next-line nodeBuiltinImport:off
import { chmodSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
// @effect-diagnostics-next-line nodeBuiltinImport:off
import { join } from "node:path"
import { fileURLToPath } from "node:url"

import { curlUrlConfig } from "./GitHubAttachment.ts"
import {
  extractRenderedMedia,
  parseRenderedProofResponse,
  renderedAssetFetchArgs,
  renderedProofLines,
  renderedProofRequestArgs,
  validateRenderedAsset
} from "./GitHubRenderedProof.ts"

const launcher = fileURLToPath(new URL("../scripts/github-verify-rendered-proof", import.meta.url))

const writeExecutable = (path: string, content: string) => {
  writeFileSync(path, content)
  chmodSync(path, 0o755)
}

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

  it("fetches rendered assets without credentials or signed URLs in argv", () => {
    const signedUrl = "https://private-user-images.githubusercontent.com/signed?jwt=sentinel-secret"
    const args = renderedAssetFetchArgs("/tmp/asset")
    assert.deepStrictEqual([...args], [
      "--disable", "--silent", "--show-error", "--location", "--proto", "=https", "--proto-redir", "=https",
      "--output", "/tmp/asset",
      "--write-out", '{"status":%{http_code},"contentType":"%{content_type}"}',
      "--config", "-"
    ])
    assert.notInclude(args.join(" "), "sentinel-secret")
    assert.strictEqual(curlUrlConfig(signedUrl), `url = "${signedUrl}"\n`)
  })

  it.effect("accepts a non-empty rendered image with matching content types", () => validateRenderedAsset({
    bytes: FileSystem.Size(42),
    detectedContentType: "image/png",
    fetchedContentType: "image/png",
    kind: "image",
    status: 200
  }))

  it.effect("accepts preserved images when GitHub normalizes the MIME subtype", () => validateRenderedAsset({
    bytes: FileSystem.Size(42),
    detectedContentType: "image/jpeg",
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

  it("wires the rendered-proof launcher through redacted process boundaries", () => {
    const directory = mkdtempSync(join(tmpdir(), "github-rendered-proof-test-"))
    const log = join(directory, "process.log")
    const source = join(directory, "proof.jpg")
    writeFileSync(source, "rendered-proof")
    writeExecutable(join(directory, "gh"), `#!/bin/sh
printf 'gh-args=%s\\n' "$*" >> "$RENDERED_TEST_LOG"
if [ "$1" != 'api' ] || [ "$2" != '--hostname' ] || [ "$3" != 'github.com' ] || [ "$4" != 'repos/jesse-merhi/skills/pulls/81' ] || [ "$5" != '--header' ] || [ "$6" != 'Accept: application/vnd.github.full+json' ]; then
  printf 'unexpected gh arguments\\n' >&2
  exit 2
fi
if [ "\${RENDERED_TEST_MALFORMED:-}" = 1 ]; then
  printf '%s\\n' '{"body_html":42}'
else
  printf '%s\\n' '{"body_html":"<p><img src=\\"https://private-user-images.githubusercontent.com/signed?jwt=sentinel-secret&amp;y=2\\"></p>"}'
fi
`)
    writeExecutable(join(directory, "curl"), `#!/bin/sh
printf 'curl-args=%s\\n' "$*" >> "$RENDERED_TEST_LOG"
case "$*" in
  *sentinel-secret*) printf 'signed URL entered argv\\n' >&2; exit 3 ;;
esac
output=''
previous=''
for argument do
  if [ "$previous" = '--output' ]; then output="$argument"; fi
  previous="$argument"
done
config="$(cat)"
printf 'curl-stdin=%s\\n' "$config" >> "$RENDERED_TEST_LOG"
if [ "$config" != 'url = "https://private-user-images.githubusercontent.com/signed?jwt=sentinel-secret&y=2"' ]; then
  printf 'unexpected curl stdin\\n' >&2
  exit 4
fi
cp "$RENDERED_TEST_SOURCE" "$output"
printf '{"status":%s,"contentType":"image/png"}' "\${RENDERED_TEST_STATUS:-200}"
`)
    writeExecutable(join(directory, "file"), `#!/bin/sh
printf 'file-args=%s\\n' "$*" >> "$RENDERED_TEST_LOG"
if [ "$1" != '--brief' ] || [ "$2" != '--mime-type' ] || [ "$3" != '--' ] || [ -z "\${4:-}" ]; then
  printf 'unexpected file arguments\\n' >&2
  exit 2
fi
printf '%s\\n' 'image/jpeg'
`)
    const environment = {
      ...process.env,
      // @effect-diagnostics-next-line processEnv:off
      PATH: `${directory}:${process.env.PATH ?? ""}`,
      RENDERED_TEST_LOG: log,
      RENDERED_TEST_SOURCE: source
    }
    const runLauncher = (overrides: NodeJS.ProcessEnv = {}) => spawnSync(
      launcher,
      ["--pr", "https://github.com/jesse-merhi/skills/pull/81"],
      { encoding: "utf8", env: { ...environment, ...overrides }, timeout: 12_000 }
    )
    const assertCommandFailure = (result: ReturnType<typeof runLauncher>) => {
      assert.isUndefined(result.error)
      assert.isNull(result.signal)
      assert.isNumber(result.status)
      assert.notStrictEqual(result.status, 0)
      assert.notInclude(`${result.stdout}\n${result.stderr}`, "sentinel-secret")
    }

    try {
      const success = runLauncher()
      assert.strictEqual(success.status, 0, success.stderr)
      assert.strictEqual(success.stdout.trim(), "rendered media: images=1 videos=0\nasset 1: image image/png bytes=14")
      assert.notInclude(`${success.stdout}\n${success.stderr}`, "sentinel-secret")

      assertCommandFailure(runLauncher({ RENDERED_TEST_STATUS: "404" }))
      assertCommandFailure(runLauncher({ RENDERED_TEST_MALFORMED: "1" }))

      const requests = readFileSync(log, "utf8")
      assert.include(requests, "gh-args=api --hostname github.com repos/jesse-merhi/skills/pulls/81 --header Accept: application/vnd.github.full+json")
      assert.include(requests, "curl-args=--disable --silent --show-error --location --proto =https --proto-redir =https --output ")
      assert.include(requests, " --config -")
      assert.include(requests, 'curl-stdin=url = "https://private-user-images.githubusercontent.com/signed?jwt=sentinel-secret&y=2"')
      assert.include(requests, "file-args=--brief --mime-type -- ")
      assert.notInclude(requests.split("\n").filter((line) => line.startsWith("curl-args=")).join("\n"), "sentinel-secret")
      assert.notInclude(requests, "Authorization")
    } finally {
      rmSync(directory, { force: true, recursive: true })
    }
  }, 60_000)

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
