import { assert, describe, it } from "@effect/vitest"
import * as Effect from "effect/Effect"
import * as FileSystem from "effect/FileSystem"
// @effect-diagnostics-next-line nodeBuiltinImport:off
import { spawnSync } from "node:child_process"
// @effect-diagnostics-next-line nodeBuiltinImport:off
import { chmodSync, existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
// @effect-diagnostics-next-line nodeBuiltinImport:off
import { join } from "node:path"
import { fileURLToPath } from "node:url"

import { curlUrlConfig, fetchRequestArgs, parseTrustedMediaUrl } from "./GitHubAttachment.ts"
import {
  extractRenderedMedia,
  parseRenderedProofResponse,
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

  it.effect("reads the actual src instead of src text inside another attribute", () => extractRenderedMedia(
    '<img src="https://private-user-images.githubusercontent.com/actual" alt="proof src=\'https://private-user-images.githubusercontent.com/decoy\'">'
  ).pipe(Effect.map((media) => {
    assert.strictEqual(media.length, 1)
    assert.strictEqual(media[0]?.url.href, "https://private-user-images.githubusercontent.com/actual")
  })))

  it.effect("verifies every themed picture source candidate and its fallback", () => extractRenderedMedia(
    '<picture><source media="(prefers-color-scheme: dark)" srcset="https://camo.githubusercontent.com/dark 1x, https://camo.githubusercontent.com/dark-2x 2x"><source media="(prefers-color-scheme: light)" srcset="https://camo.githubusercontent.com/light"><img src="https://camo.githubusercontent.com/fallback"></picture>'
  ).pipe(Effect.map((media) => {
    assert.deepStrictEqual(media.map((item) => [item.kind, item.url.href]), [
      ["image", "https://camo.githubusercontent.com/dark"],
      ["image", "https://camo.githubusercontent.com/dark-2x"],
      ["image", "https://camo.githubusercontent.com/light"],
      ["image", "https://camo.githubusercontent.com/fallback"]
    ])
  })))

  it.effect("redacts an invalid signed rendered-media URL", () => parseRenderedProofResponse(JSON.stringify({
    body_html: '<video src="https://internal.example.com/file?token=sentinel-secret"></video>'
  })).pipe(Effect.flip, Effect.map((error) => {
    assert.match(error.message, /invalid rendered-media URL/u)
    assert.notInclude(error.message, "sentinel-secret")
  })))

  it.effect("rejects a malformed rendered pull request", () => parseRenderedProofResponse(
    '{"body_html":42}'
  ).pipe(Effect.flip, Effect.map((error) => assert.match(error.message, /invalid rendered pull request/u))))

  it.effect("accepts each GitHub-controlled media host family", () => Effect.all([
    parseTrustedMediaUrl("https://github.com/user-attachments/assets/abc-123"),
    parseTrustedMediaUrl("https://private-user-images.githubusercontent.com/signed"),
    parseTrustedMediaUrl("https://camo.githubusercontent.com/hash"),
    parseTrustedMediaUrl("https://github-production-user-asset-6210df.s3.amazonaws.com/object")
  ]).pipe(Effect.map((urls) => assert.deepStrictEqual(urls.map((url) => url.hostname), [
    "github.com",
    "private-user-images.githubusercontent.com",
    "camo.githubusercontent.com",
    "github-production-user-asset-6210df.s3.amazonaws.com"
  ]))))

  it("pins rendered PR lookup to the resolved GitHub.com repository", () => {
    assert.deepStrictEqual([...renderedProofRequestArgs("jesse-merhi/skills", "81")], [
      "api", "--hostname", "github.com", "repos/jesse-merhi/skills/pulls/81",
      "--header", "Accept: application/vnd.github.full+json"
    ])
  })

  it("fetches rendered assets without credentials or signed URLs in argv", () => {
    const signedUrl = "https://private-user-images.githubusercontent.com/signed?jwt=sentinel-secret"
    const args = fetchRequestArgs("/tmp/asset", "/tmp/headers")
    assert.deepStrictEqual([...args], [
      "--disable", "--globoff", "--silent", "--show-error", "--output", "/tmp/asset",
      "--dump-header", "/tmp/headers", "--max-redirs", "0", "--proto", "=https",
      "--max-filesize", "1073741824", "--max-time", "600",
      "--write-out", '{"status":%{http_code},"contentType":"%{content_type}"}',
      "--config", "-"
    ])
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

  it.effect("reports HTTP failure before checking content type", () => validateRenderedAsset({
    bytes: FileSystem.Size(42),
    detectedContentType: "text/html",
    fetchedContentType: "text/html; charset=utf-8",
    kind: "image",
    status: 404
  }).pipe(Effect.flip, Effect.map((error) => assert.match(error.message, /returned HTTP 404/u))))

  it.effect("rejects rendered media whose detected type has the wrong family", () => validateRenderedAsset({
    bytes: FileSystem.Size(42),
    detectedContentType: "application/octet-stream",
    fetchedContentType: "image/png; qs=0.85",
    kind: "image",
    status: 200
  }).pipe(Effect.flip, Effect.map((error) => assert.match(error.message, /image detected content type/u))))

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
if [ "\${RENDERED_TEST_GH_FAILURE:-}" = 1 ]; then
  printf '%s\\n' '{"body_html":"<img src=\\"https://private-user-images.githubusercontent.com/signed?jwt=sentinel-secret\\">"}'
  printf 'failed while reading rendered pull request\\n' >&2
  exit 1
fi
if [ "\${RENDERED_TEST_FIVE_ASSETS:-}" = 1 ]; then
  printf '%s\\n' '{"body_html":"<p><img src=\\"https://private-user-images.githubusercontent.com/signed?jwt=sentinel-secret&amp;y=2\\"><img src=\\"https://private-user-images.githubusercontent.com/second?jwt=sentinel-secret\\"><img src=\\"https://private-user-images.githubusercontent.com/third?jwt=sentinel-secret\\"><img src=\\"https://private-user-images.githubusercontent.com/fourth?jwt=sentinel-secret\\"><img src=\\"https://private-user-images.githubusercontent.com/fifth?jwt=sentinel-secret\\"></p>"}'
else
  printf '%s\\n' '{"body_html":"<p><img src=\\"https://private-user-images.githubusercontent.com/signed?jwt=sentinel-secret&amp;y=2\\"></p>"}'
fi
`)
    writeExecutable(join(directory, "curl"), `#!/bin/sh
printf 'curl-args=%s\\n' "$*" >> "$RENDERED_TEST_LOG"
for argument do printf 'curl-arg=%s\\n' "$argument" >> "$RENDERED_TEST_LOG"; done
case "$*" in
  *sentinel-secret*) printf 'signed URL entered argv\\n' >&2; exit 3 ;;
esac
output=''
headers=''
previous=''
for argument do
  if [ "$previous" = '--output' ]; then output="$argument"; fi
  if [ "$previous" = '--dump-header' ]; then headers="$argument"; fi
  previous="$argument"
done
config="$(cat)"
printf 'curl-stdin=%s\\n' "$config" >> "$RENDERED_TEST_LOG"
case "$config" in
  *'private-user-images.githubusercontent.com/'*|*'camo.githubusercontent.com/'*) ;;
  *) printf 'unexpected curl stdin\\n' >&2; exit 4 ;;
esac
if [ "\${RENDERED_TEST_CURL_FAILURE:-}" = 1 ]; then
  printf '%s\\n' 'curl rejected https://private-user-images.githubusercontent.com/signed?jwt=sentinel-secret&y=2' >&2
  exit 28
fi
cp "$RENDERED_TEST_SOURCE" "$output"
if [ "\${RENDERED_TEST_REDIRECT:-}" = 'untrusted' ]; then
  printf '%s\\n' 'HTTP/1.1 302 Found' 'Location: https://internal.example.com/admin' '' > "$headers"
  printf '%s' '{"status":302,"contentType":"text/html"}'
elif [ -n "\${RENDERED_TEST_REDIRECT_COUNT:-}" ]; then
  count=0
  if [ -f "$RENDERED_TEST_REDIRECT_STATE" ]; then count="$(cat "$RENDERED_TEST_REDIRECT_STATE")"; fi
  count=$((count + 1))
  printf '%s' "$count" > "$RENDERED_TEST_REDIRECT_STATE"
  if [ "$count" -le "$RENDERED_TEST_REDIRECT_COUNT" ]; then
    printf '%s\\n' 'HTTP/1.1 302 Found' "Location: https://camo.githubusercontent.com/hop-$count?jwt=sentinel-secret" '' > "$headers"
    printf '%s' '{"status":302,"contentType":"text/html"}'
  else
    printf '%s\\n' 'HTTP/1.1 200 OK' 'Content-Type: image/png' '' > "$headers"
    printf '%s' '{"status":200,"contentType":"image/png; qs=0.85"}'
  fi
else
  printf '%s\\n' 'HTTP/1.1 200 OK' 'Content-Type: image/png' '' > "$headers"
  printf '%s' '{"status":200,"contentType":"image/png; qs=0.85"}'
fi
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
    const assertTemporaryPathsRemoved = () => {
      const args = readFileSync(log, "utf8").split("\n")
        .filter((line) => line.startsWith("curl-arg=")).map((line) => line.slice("curl-arg=".length))
      for (let index = 1; index < args.length; index += 1) {
        if (args[index - 1] === "--output" || args[index - 1] === "--dump-header") {
          assert.isFalse(existsSync(args[index] ?? ""), `expected scoped temp file to be removed: ${args[index]}`)
        }
      }
    }
    const runFailure = (overrides: NodeJS.ProcessEnv) => {
      const result = runLauncher(overrides)
      assertCommandFailure(result)
      assertTemporaryPathsRemoved()
      return result
    }

    try {
      const success = runLauncher({
        RENDERED_TEST_FIVE_ASSETS: "1"
      })
      assert.strictEqual(success.status, 0, `${success.stderr}\n${readFileSync(log, "utf8")}`)
      assert.include(success.stdout, "rendered media: images=5 videos=0")
      assert.include(success.stdout, "asset 1: image image/png bytes=14")
      assert.include(success.stdout, "asset 5: image image/png bytes=14")
      assert.notInclude(`${success.stdout}\n${success.stderr}`, "sentinel-secret")
      assertTemporaryPathsRemoved()
      const successRequests = readFileSync(log, "utf8")
      assert.strictEqual(successRequests.split("\n").filter((line) => line.startsWith("gh-args=")).length, 2)

      const trustedRedirect = runLauncher({
        RENDERED_TEST_REDIRECT_COUNT: "5",
        RENDERED_TEST_REDIRECT_STATE: join(directory, "trusted-redirect-state")
      })
      assert.strictEqual(trustedRedirect.status, 0, trustedRedirect.stderr)
      assertTemporaryPathsRemoved()

      runFailure({
        RENDERED_TEST_REDIRECT_COUNT: "6",
        RENDERED_TEST_REDIRECT_STATE: join(directory, "redirect-limit-state")
      })
      runFailure({ RENDERED_TEST_GH_FAILURE: "1" })
      const curlFailure = runFailure({ RENDERED_TEST_CURL_FAILURE: "1" })
      assert.include(`${curlFailure.stdout}\n${curlFailure.stderr}`, "Rendered asset 1")
      runFailure({ RENDERED_TEST_REDIRECT: "untrusted" })

      const requests = readFileSync(log, "utf8")
      assert.include(requests, "gh-args=api --hostname github.com repos/jesse-merhi/skills/pulls/81 --header Accept: application/vnd.github.full+json")
      assert.include(requests, "curl-args=--disable --globoff --silent --show-error --output ")
      assert.include(requests, " --max-redirs 0 --proto =https ")
      assert.include(requests, " --max-filesize 1073741824 --max-time 600 ")
      assert.include(requests, " --config -")
      assert.include(requests, 'curl-stdin=url = "https://private-user-images.githubusercontent.com/signed?jwt=sentinel-secret&y=2"')
      assert.include(requests, "file-args=--brief --mime-type -- ")
      assert.notInclude(requests.split("\n").filter((line) => line.startsWith("curl-args=")).join("\n"), "sentinel-secret")
      assert.notInclude(requests, "Authorization")
    } finally {
      rmSync(directory, { force: true, recursive: true })
    }
  }, 90_000)

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
