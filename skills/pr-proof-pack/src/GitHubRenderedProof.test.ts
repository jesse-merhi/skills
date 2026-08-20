import { NodeServices } from "@effect/platform-node"
import { assert, describe, it } from "@effect/vitest"
import * as Effect from "effect/Effect"
import * as Fiber from "effect/Fiber"
import * as FileSystem from "effect/FileSystem"
// @effect-diagnostics-next-line nodeBuiltinImport:off
import { spawnSync } from "node:child_process"
// @effect-diagnostics-next-line nodeBuiltinImport:off
import { chmodSync, existsSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
// @effect-diagnostics-next-line nodeBuiltinImport:off
import { join } from "node:path"
import { fileURLToPath } from "node:url"

import { GitHubAttachmentError, parseTrustedMediaUrl } from "./GitHubAttachment.ts"
import {
  extractRenderedMedia,
  parseRenderedProofResponse,
  renderedAssetBatchSize,
  renderedProofLines,
  renderedProofRequestArgs,
  requireRenderedByteBudget,
  validateRenderedAsset,
  verifyGitHubRenderedProof,
  withRenderedProofDeadline
} from "./GitHubRenderedProof.ts"

const launcher = fileURLToPath(new URL("../scripts/github-verify-rendered-proof", import.meta.url))
const expectedHeadSha = "0123456789abcdef0123456789abcdef01234567"

const node = <A, E>(effect: Effect.Effect<A, E, NodeServices.NodeServices>) => effect.pipe(
  // @effect-diagnostics-next-line strictEffectProvide:off
  Effect.provide(NodeServices.layer)
)

const writeExecutable = (path: string, content: string) => {
  writeFileSync(path, content)
  chmodSync(path, 0o755)
}

const processIsRunning = (pid: number) => {
  try {
    process.kill(pid, 0)
    return true
  } catch (error) {
    if (error instanceof Error && "code" in error && error.code === "ESRCH") return false
    throw error
  }
}

const waitForFile = (path: string) => Effect.gen(function*() {
  for (let attempt = 0; attempt < 500; attempt += 1) {
    if (existsSync(path)) return
    yield* Effect.sleep("10 millis")
  }
  return yield* new GitHubAttachmentError({ message: `Timed out waiting for verifier child readiness at ${path}` })
})

describe("rendered GitHub proof verification", () => {
  it.effect("extracts rendered image and video URLs without preferring canonical metadata", () => extractRenderedMedia(
    '<p><img data-canonical-src="https://github.com/user-attachments/assets/canonical" src="https://camo.githubusercontent.com/signed?x=1&amp;y=2"></p><video controls src=\'https://private-user-images.githubusercontent.com/video-signed\'></video>'
  ).pipe(Effect.map((media) => {
    assert.strictEqual(media.length, 2)
    assert.strictEqual(media[0]?.kind, "image")
    assert.strictEqual(media[0]?.url.href, "https://camo.githubusercontent.com/signed?x=1&y=2")
    assert.strictEqual(media[1]?.kind, "video")
  })))

  it.effect("reserves the remaining aggregate budget before each download batch", () => Effect.all([
    renderedAssetBatchSize(FileSystem.Size(0)),
    renderedAssetBatchSize(FileSystem.Size(400 * 1024 * 1024)),
    renderedAssetBatchSize(FileSystem.Size(450 * 1024 * 1024)),
    renderedAssetBatchSize(FileSystem.Size(500 * 1024 * 1024)).pipe(Effect.flip)
  ]).pipe(Effect.map((results) => {
    assert.strictEqual(results[0], 4)
    assert.strictEqual(results[1], 1)
    assert.strictEqual(results[2], 1)
    assert.match(results[3]?.message ?? "", /exceeded the 500 MiB/u)
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

  it.effect("classifies video source elements as videos", () => extractRenderedMedia(
    '<video controls><source src="https://private-user-images.githubusercontent.com/proof.mp4" type="video/mp4"></video>'
  ).pipe(Effect.map((media) => {
    assert.deepStrictEqual(media.map((item) => [item.kind, item.url.href]), [
      ["video", "https://private-user-images.githubusercontent.com/proof.mp4"]
    ])
  })))

  it.effect("redacts an invalid signed rendered-media URL", () => parseRenderedProofResponse(JSON.stringify({
    body: "proof",
    body_html: '<video src="https://internal.example.com/file?token=sentinel-secret"></video>',
    head: { sha: expectedHeadSha }
  })).pipe(Effect.flip, Effect.map((error) => {
    assert.match(error.message, /invalid rendered-media URL/u)
    assert.notInclude(error.message, "sentinel-secret")
  })))

  it.effect("rejects a malformed rendered pull request", () => parseRenderedProofResponse(
    `{"body":"","body_html":42,"head":{"sha":"${expectedHeadSha}"}}`
  ).pipe(Effect.flip, Effect.map((error) => assert.match(error.message, /invalid rendered pull request/u))))

  it.effect("bounds aggregate rendered bytes", () => Effect.all([
    requireRenderedByteBudget(FileSystem.Size(500 * 1024 * 1024)),
    requireRenderedByteBudget(FileSystem.Size((500 * 1024 * 1024) + 1)).pipe(Effect.flip)
  ]).pipe(Effect.map((results) => {
    assert.match(results[1]?.message ?? "", /exceeded the 500 MiB/u)
  })))

  it.live("reports the whole-verification deadline", () => withRenderedProofDeadline(
    Effect.never,
    "10 millis"
  ).pipe(Effect.flip, Effect.map((error) => assert.match(error.message, /verification exceeded 10 minutes/u))))

  it.live("force-kills every interrupted verifier child and cleans temporary files", () => {
    const directory = mkdtempSync(join(tmpdir(), "github-rendered-deadline-test-"))
    const tool = `#!/usr/bin/env node
const fs = require("node:fs")
const path = require("node:path")
const name = path.basename(process.argv[1])
const args = process.argv.slice(2)
fs.appendFileSync(process.env.VERIFY_PROCESS_LOG, name + "\\t" + JSON.stringify(args) + "\\t" + process.pid + "\\n")
const run = () => {
  if (process.env.VERIFY_HANG_AT === name) {
    process.on("SIGTERM", () => {})
    fs.writeFileSync(process.env.VERIFY_READY_PATH, "ready")
    setInterval(() => {}, 1000)
    return
  }
  if (name === "gh") {
    process.stdout.write(JSON.stringify({
      body: "proof",
      body_html: '<p><img src="https://private-user-images.githubusercontent.com/proof"></p>',
      head: { sha: "${expectedHeadSha}" }
    }))
    return
  }
  if (name === "curl") {
    if (args[0] === "--version") {
      process.stdout.write("curl 8.4.0 (test)\\n")
      return
    }
    fs.writeFileSync(args[args.indexOf("--output") + 1], "proof")
    fs.writeFileSync(args[args.indexOf("--dump-header") + 1], "HTTP/1.1 200 OK\\r\\n")
    process.stdout.write('{"status":200,"contentType":"image/png"}')
    return
  }
  if (name === "file") {
    process.stdout.write("image/png\\n")
    return
  }
  process.exit(2)
}
if (name === "curl") {
  process.stdin.resume()
  process.stdin.on("end", run)
} else {
  run()
}
`
    for (const name of ["gh", "curl", "file"]) writeExecutable(join(directory, name), tool)
    const baseEnvironment: Record<string, string> = {}
    for (const [key, value] of Object.entries(process.env)) {
      if (value !== undefined) baseEnvironment[key] = value
    }
    baseEnvironment.PATH = `${directory}:${baseEnvironment.PATH ?? ""}`

    return node(Effect.gen(function*() {
      for (const name of ["gh", "curl", "file"] as const) {
        const log = join(directory, `${name}.log`)
        const ready = join(directory, `${name}.ready`)
        const verifier = yield* verifyGitHubRenderedProof(
          "https://github.com/jesse-merhi/skills/pull/81",
          expectedHeadSha,
          {
            deadline: "30 seconds",
            processOptions: {
              env: {
                ...baseEnvironment,
                VERIFY_HANG_AT: name,
                VERIFY_PROCESS_LOG: log,
                VERIFY_READY_PATH: ready
              }
            }
          }
        ).pipe(Effect.scoped, Effect.forkChild)
        yield* waitForFile(ready)
        const interruptedAt = Date.now()
        yield* Fiber.interrupt(verifier)
        assert.isBelow(Date.now() - interruptedAt, 3_000)
        for (const line of readFileSync(log, "utf8").trim().split("\n")) {
          const [loggedName, encodedArgs, encodedPid] = line.split("\t", 3)
          const pid = Number(encodedPid)
          assert.isFalse(processIsRunning(pid), `expected ${loggedName ?? "child"} process ${pid} to exit`)
          if (loggedName !== "curl" || encodedArgs === undefined) continue
          const args: ReadonlyArray<string> = JSON.parse(encodedArgs)
          for (const flag of ["--output", "--dump-header"]) {
            const temporaryPath = args[args.indexOf(flag) + 1]
            if (temporaryPath !== undefined) assert.isFalse(existsSync(temporaryPath))
          }
        }
      }
    })).pipe(Effect.ensuring(Effect.sync(() => rmSync(directory, { force: true, recursive: true }))))
  }, 30_000)

  it.effect("accepts each GitHub-controlled media host family", () => Effect.all([
    parseTrustedMediaUrl("https://github.com/user-attachments/assets/abc-123"),
    parseTrustedMediaUrl("https://private-user-images.githubusercontent.com/signed"),
    parseTrustedMediaUrl("https://camo.githubusercontent.com/hash"),
    parseTrustedMediaUrl("https://github.githubassets.com/images/icons/emoji/unicode/1f44d.png"),
    parseTrustedMediaUrl("https://github-production-user-asset-6210df.s3.amazonaws.com/object")
  ]).pipe(Effect.map((urls) => assert.deepStrictEqual(urls.map((url) => url.hostname), [
    "github.com",
    "private-user-images.githubusercontent.com",
    "camo.githubusercontent.com",
    "github.githubassets.com",
    "github-production-user-asset-6210df.s3.amazonaws.com"
  ]))))

  it("pins rendered PR lookup to the resolved GitHub.com repository", () => {
    assert.deepStrictEqual([...renderedProofRequestArgs("jesse-merhi/skills", "81")], [
      "api", "--hostname", "github.com", "repos/jesse-merhi/skills/pulls/81",
      "--header", "Accept: application/vnd.github.full+json"
    ])
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
  printf '%s\\n' '{"body":"proof","body_html":"<img src=\\"https://private-user-images.githubusercontent.com/signed?jwt=sentinel-secret\\">","head":{"sha":"${expectedHeadSha}"}}'
  printf 'failed while reading rendered pull request https://private-user-images.githubusercontent.com/signed?jwt=sentinel-secret\\n' >&2
  exit 1
fi
if [ "\${RENDERED_TEST_VIDEO_SOURCE:-}" = 1 ]; then
  printf '%s\\n' '{"body":"proof","body_html":"<video controls><source src=\\"https://private-user-images.githubusercontent.com/proof.mp4\\" type=\\"video/mp4\\"></video>","head":{"sha":"${expectedHeadSha}"}}'
elif [ "\${RENDERED_TEST_MANY_DUPLICATES:-}" = 1 ]; then
  /usr/bin/python3 - <<'PY'
import json
print(json.dumps({
    "body": "proof",
    "body_html": "<p>" + '<img src="https://private-user-images.githubusercontent.com/repeated?jwt=sentinel-secret">' * 101 + "</p>",
    "head": {"sha": "${expectedHeadSha}"},
}))
PY
elif [ "\${RENDERED_TEST_FIVE_ASSETS:-}" = 1 ]; then
  call=1
  if [ -n "\${RENDERED_TEST_GH_STATE:-}" ]; then
    if [ -f "$RENDERED_TEST_GH_STATE" ]; then call=$(( $(cat "$RENDERED_TEST_GH_STATE") + 1 )); fi
    printf '%s' "$call" > "$RENDERED_TEST_GH_STATE"
  fi
  query='sentinel-secret'
  if [ "$call" -gt 1 ]; then query="sentinel-secret-refreshed-$call"; fi
  body='proof'
  if [ -n "\${RENDERED_TEST_BODY_CHANGED_AFTER:-}" ] && [ "$call" -gt "$RENDERED_TEST_BODY_CHANGED_AFTER" ]; then body='changed proof'; fi
  head_sha="\${RENDERED_TEST_HEAD_SHA:-${expectedHeadSha}}"
  if [ -n "\${RENDERED_TEST_HEAD_CHANGED_AFTER:-}" ] && [ "$call" -gt "$RENDERED_TEST_HEAD_CHANGED_AFTER" ]; then head_sha='abcdef0123456789abcdef0123456789abcdef01'; fi
  semantic='40'
  if [ -n "\${RENDERED_TEST_SEMANTIC_CHANGED_AFTER:-}" ] && [ "$call" -gt "$RENDERED_TEST_SEMANTIC_CHANGED_AFTER" ]; then semantic='400'; fi
  fifth='fifth'
  if [ "\${RENDERED_TEST_DUPLICATE:-}" = 1 ]; then fifth='fourth'; fi
  if [ "\${RENDERED_TEST_CHANGED:-}" = 1 ] && [ "$call" -gt 1 ]; then fifth='changed-fifth'; fi
  if [ "\${RENDERED_TEST_EIGHT_ASSETS:-}" = 1 ]; then
    payload='{"body":"__BODY__","body_html":"<p><img src=\\"https://private-user-images.githubusercontent.com/signed?jwt=__QUERY__&amp;s=__SEMANTIC__&amp;y=2\\"><img src=\\"https://private-user-images.githubusercontent.com/second?jwt=__QUERY__&amp;s=__SEMANTIC__\\"><img src=\\"https://private-user-images.githubusercontent.com/third?jwt=__QUERY__&amp;s=__SEMANTIC__\\"><img src=\\"https://private-user-images.githubusercontent.com/fourth?jwt=__QUERY__&amp;s=__SEMANTIC__\\"><img src=\\"https://private-user-images.githubusercontent.com/__FIFTH__?jwt=__QUERY__&amp;s=__SEMANTIC__\\"><img src=\\"https://private-user-images.githubusercontent.com/sixth?jwt=__QUERY__\\"><img src=\\"https://private-user-images.githubusercontent.com/seventh?jwt=__QUERY__\\"><img src=\\"https://private-user-images.githubusercontent.com/eighth?jwt=__QUERY__\\"></p>","head":{"sha":"__HEAD__"}}'
  else
    payload='{"body":"__BODY__","body_html":"<p><img src=\\"https://private-user-images.githubusercontent.com/signed?jwt=__QUERY__&amp;s=__SEMANTIC__&amp;y=2\\"><img src=\\"https://private-user-images.githubusercontent.com/second?jwt=__QUERY__&amp;s=__SEMANTIC__\\"><img src=\\"https://private-user-images.githubusercontent.com/third?jwt=__QUERY__&amp;s=__SEMANTIC__\\"><img src=\\"https://private-user-images.githubusercontent.com/fourth?jwt=__QUERY__&amp;s=__SEMANTIC__\\"><img src=\\"https://private-user-images.githubusercontent.com/__FIFTH__?jwt=__QUERY__&amp;s=__SEMANTIC__\\"></p>","head":{"sha":"__HEAD__"}}'
  fi
  printf '%s\\n' "$payload" | sed -e "s/__BODY__/$body/g" -e "s/__QUERY__/$query/g" -e "s/__SEMANTIC__/$semantic/g" -e "s/__FIFTH__/$fifth/g" -e "s/__HEAD__/$head_sha/g"
else
  printf '%s\\n' '{"body":"proof","body_html":"<p><img src=\\"https://private-user-images.githubusercontent.com/signed?jwt=sentinel-secret&amp;y=2\\"></p>","head":{"sha":"${expectedHeadSha}"}}'
fi
`)
    writeExecutable(join(directory, "curl"), `#!/bin/sh
printf 'curl-args=%s\\n' "$*" >> "$RENDERED_TEST_LOG"
for argument do printf 'curl-arg=%s\\n' "$argument" >> "$RENDERED_TEST_LOG"; done
if [ "\${1:-}" = '--version' ]; then
  printf 'curl %s (test)\\n' "\${RENDERED_TEST_CURL_VERSION:-8.4.0}"
  exit 0
fi
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
if [ "\${RENDERED_TEST_CONCURRENT_FAILURE:-}" = 1 ]; then
  marker="\${output##*/}"
  printf '%s\\n' "$$" >> "$RENDERED_TEST_CONCURRENT_PIDS"
  case "$config" in
    *'/signed?'*) failing=1 ;;
    *)
      failing=0
      trap '' TERM
      : > "$RENDERED_TEST_CONCURRENT_READY/$marker" ;;
  esac
  : > "$RENDERED_TEST_CONCURRENT_BARRIER/$marker"
  attempts=0
  while [ "$(/usr/bin/find "$RENDERED_TEST_CONCURRENT_BARRIER" -type f | /usr/bin/wc -l)" -lt 4 ]; do
    attempts=$((attempts + 1))
    if [ "$attempts" -ge 500 ]; then printf 'concurrency barrier timed out\\n' >&2; exit 9; fi
    sleep 0.01
  done
  if [ "$failing" = 1 ]; then printf 'concurrent worker failed\\n' >&2; exit 28; fi
  while :; do :; done
fi
if [ "\${RENDERED_TEST_REDIRECT_BODY_BUDGET:-}" = 1 ]; then
  marker="\${output##*/}"
  if [ ! -f "$RENDERED_TEST_REDIRECT_BODY_STATE/$marker" ]; then
    : > "$RENDERED_TEST_REDIRECT_BODY_STATE/$marker"
    /bin/dd if=/dev/zero of="$output" bs=1 count=0 seek=10485760 2>/dev/null
    printf '%s\\n' 'HTTP/1.1 302 Found' "Location: https://camo.githubusercontent.com/$marker" '' > "$headers"
    printf '%s' '{"status":302,"contentType":"text/html"}'
  else
    /bin/dd if=/dev/zero of="$output" bs=1 count=0 seek=78643200 2>/dev/null
    printf '%s\\n' 'HTTP/1.1 200 OK' 'Content-Type: image/png' '' > "$headers"
    printf '%s' '{"status":200,"contentType":"image/png; qs=0.85"}'
  fi
  exit 0
fi
if [ "\${RENDERED_TEST_CURL_FAILURE:-}" = 1 ]; then
  printf '%s\\n' 'curl rejected https://private-user-images.githubusercontent.com/signed?jwt=sentinel-secret&y=2' >&2
  exit 28
fi
if [ "\${RENDERED_TEST_LARGE_FIRST:-}" = 1 ]; then
  case "$config" in
    *'/signed?'*|*'/second?'*|*'/third?'*|*'/fourth?'*)
      /bin/dd if=/dev/zero of="$output" bs=1 count=0 seek=104857600 2>/dev/null ;;
    *)
      /bin/dd if=/dev/zero of="$output" bs=1 count=0 seek=1048576 2>/dev/null ;;
  esac
elif [ "\${RENDERED_TEST_MAX_SIZE_ASSETS:-}" = 1 ]; then
  /bin/dd if=/dev/zero of="$output" bs=1 count=0 seek=104857600 2>/dev/null
else
  cp "$RENDERED_TEST_SOURCE" "$output"
fi
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
  content_type="\${RENDERED_TEST_MEDIA_TYPE:-image/png}"
  printf '%s\\n' 'HTTP/1.1 200 OK' "Content-Type: $content_type" '' > "$headers"
  printf '{"status":200,"contentType":"%s; qs=0.85"}' "$content_type"
fi
`)
    writeExecutable(join(directory, "file"), `#!/bin/sh
printf 'file-args=%s\\n' "$*" >> "$RENDERED_TEST_LOG"
if [ "$1" != '--brief' ] || [ "$2" != '--mime-type' ] || [ "$3" != '--' ] || [ -z "\${4:-}" ]; then
  printf 'unexpected file arguments\\n' >&2
  exit 2
fi
printf '%s\\n' "\${RENDERED_TEST_MEDIA_TYPE:-image/jpeg}"
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
      ["--pr", "https://github.com/jesse-merhi/skills/pull/81", "--head", expectedHeadSha],
      { encoding: "utf8", env: { ...environment, ...overrides }, timeout: 12_000 }
    )
    const assertCommandFailure = (result: ReturnType<typeof runLauncher>) => {
      assert.isUndefined(result.error)
      assert.isNull(result.signal)
      assert.isNumber(result.status)
      assert.notStrictEqual(result.status, 0)
      assert.notInclude(`${result.stdout}\n${result.stderr}`, "sentinel-secret")
    }
    const assertTemporaryPathsRemoved = (processLog = log) => {
      const args = readFileSync(processLog, "utf8").split("\n")
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
        RENDERED_TEST_FIVE_ASSETS: "1",
        RENDERED_TEST_GH_STATE: join(directory, "refresh-state")
      })
      assert.strictEqual(success.status, 0, `${success.stdout}\n${success.stderr}\n${readFileSync(log, "utf8")}`)
      assert.include(success.stdout, "rendered media: images=5 videos=0")
      assert.include(success.stdout, "asset 1: image image/png bytes=14")
      assert.include(success.stdout, "asset 5: image image/png bytes=14")
      assert.notInclude(`${success.stdout}\n${success.stderr}`, "sentinel-secret")
      assertTemporaryPathsRemoved()
      const successRequests = readFileSync(log, "utf8")
      assert.strictEqual(successRequests.split("\n").filter((line) => line.startsWith("gh-args=")).length, 3)
      assert.strictEqual(successRequests.split("\n").filter((line) => line.startsWith("curl-stdin=")).length, 5)
      assert.include(successRequests, 'curl-stdin=url = "https://private-user-images.githubusercontent.com/fifth?jwt=sentinel-secret-refreshed-2&s=40"')

      const videoSourceLog = join(directory, "video-source.log")
      const videoSource = runLauncher({
        RENDERED_TEST_LOG: videoSourceLog,
        RENDERED_TEST_MEDIA_TYPE: "video/mp4",
        RENDERED_TEST_VIDEO_SOURCE: "1"
      })
      assert.strictEqual(videoSource.status, 0, `${videoSource.stdout}\n${videoSource.stderr}`)
      assert.include(videoSource.stdout, "rendered media: images=0 videos=1")
      assert.include(videoSource.stdout, "asset 1: video video/mp4 bytes=14")
      assertTemporaryPathsRemoved(videoSourceLog)

      const oldCurlLog = join(directory, "old-curl.log")
      const oldCurl = runLauncher({
        RENDERED_TEST_CURL_VERSION: "8.3.0",
        RENDERED_TEST_LOG: oldCurlLog
      })
      assertCommandFailure(oldCurl)
      assert.include(`${oldCurl.stdout}\n${oldCurl.stderr}`, "curl 8.4 or newer")
      assert.notInclude(readFileSync(oldCurlLog, "utf8"), "curl-stdin=")

      const duplicateLog = join(directory, "duplicate.log")
      const duplicate = runLauncher({
        RENDERED_TEST_DUPLICATE: "1",
        RENDERED_TEST_FIVE_ASSETS: "1",
        RENDERED_TEST_GH_STATE: join(directory, "duplicate-state"),
        RENDERED_TEST_LOG: duplicateLog
      })
      assert.strictEqual(duplicate.status, 0, `${duplicate.stdout}\n${duplicate.stderr}`)
      assert.include(duplicate.stdout, "rendered media: images=5 videos=0")
      assert.include(duplicate.stdout, "asset 5: image image/png bytes=14")
      const duplicateRequests = readFileSync(duplicateLog, "utf8")
      assert.strictEqual(duplicateRequests.split("\n").filter((line) => line.startsWith("curl-stdin=")).length, 4)
      assertTemporaryPathsRemoved(duplicateLog)

      const manyDuplicatesLog = join(directory, "many-duplicates.log")
      const manyDuplicates = runLauncher({
        RENDERED_TEST_LOG: manyDuplicatesLog,
        RENDERED_TEST_MANY_DUPLICATES: "1"
      })
      assert.strictEqual(manyDuplicates.status, 0, `${manyDuplicates.stdout}\n${manyDuplicates.stderr}`)
      assert.include(manyDuplicates.stdout, "rendered media: images=101 videos=0")
      assert.include(manyDuplicates.stdout, "asset 101: image image/png bytes=14")
      const manyDuplicateRequests = readFileSync(manyDuplicatesLog, "utf8")
      assert.strictEqual(manyDuplicateRequests.split("\n").filter((line) => line.startsWith("curl-stdin=")).length, 1)
      assertTemporaryPathsRemoved(manyDuplicatesLog)

      const concurrentBarrier = mkdtempSync(join(directory, "concurrent-barrier-"))
      const concurrentReady = mkdtempSync(join(directory, "concurrent-ready-"))
      const concurrentLog = join(directory, "concurrent.log")
      const concurrentPids = join(directory, "concurrent.pids")
      const concurrentStartedAt = Date.now()
      const concurrentFailure = runLauncher({
        RENDERED_TEST_CONCURRENT_BARRIER: concurrentBarrier,
        RENDERED_TEST_CONCURRENT_FAILURE: "1",
        RENDERED_TEST_CONCURRENT_PIDS: concurrentPids,
        RENDERED_TEST_CONCURRENT_READY: concurrentReady,
        RENDERED_TEST_FIVE_ASSETS: "1",
        RENDERED_TEST_GH_STATE: join(directory, "concurrent-gh-state"),
        RENDERED_TEST_LOG: concurrentLog
      })
      assertCommandFailure(concurrentFailure)
      assert.isBelow(Date.now() - concurrentStartedAt, 5_000)
      assert.strictEqual(readdirSync(concurrentBarrier).length, 4)
      assert.strictEqual(readdirSync(concurrentReady).length, 3)
      const pids = readFileSync(concurrentPids, "utf8").trim().split("\n").map(Number)
      assert.strictEqual(pids.length, 4)
      for (const pid of pids) assert.isFalse(processIsRunning(pid), `expected concurrent curl ${pid} to exit`)
      assertTemporaryPathsRemoved(concurrentLog)

      const aggregateLog = join(directory, "aggregate.log")
      const aggregate = runLauncher({
        RENDERED_TEST_EIGHT_ASSETS: "1",
        RENDERED_TEST_FIVE_ASSETS: "1",
        RENDERED_TEST_GH_STATE: join(directory, "aggregate-state"),
        RENDERED_TEST_LOG: aggregateLog,
        RENDERED_TEST_MAX_SIZE_ASSETS: "1"
      })
      assertCommandFailure(aggregate)
      assert.include(
        `${aggregate.stdout}\n${aggregate.stderr}`,
        "exceeded the 500 MiB download budget",
        `${aggregate.stdout}\n${aggregate.stderr}\n${readFileSync(aggregateLog, "utf8")}`
      )
      const aggregateRequests = readFileSync(aggregateLog, "utf8")
      assert.strictEqual(aggregateRequests.split("\n").filter((line) => line.startsWith("curl-stdin=")).length, 5)
      assertTemporaryPathsRemoved(aggregateLog)

      const mixedSizesLog = join(directory, "mixed-sizes.log")
      const mixedSizes = runLauncher({
        RENDERED_TEST_EIGHT_ASSETS: "1",
        RENDERED_TEST_FIVE_ASSETS: "1",
        RENDERED_TEST_GH_STATE: join(directory, "mixed-size-gh-state"),
        RENDERED_TEST_LARGE_FIRST: "1",
        RENDERED_TEST_LOG: mixedSizesLog
      })
      assert.strictEqual(mixedSizes.status, 0, `${mixedSizes.stdout}\n${mixedSizes.stderr}`)
      assert.include(mixedSizes.stdout, "asset 8: image image/png bytes=1048576")
      const mixedSizeRequests = readFileSync(mixedSizesLog, "utf8")
      assert.strictEqual(mixedSizeRequests.split("\n").filter((line) => line.startsWith("curl-stdin=")).length, 8)
      assert.include(mixedSizeRequests, "--max-filesize 103809024")
      assertTemporaryPathsRemoved(mixedSizesLog)

      const redirectBodyLog = join(directory, "redirect-body-budget.log")
      const redirectBodyBudget = runLauncher({
        RENDERED_TEST_EIGHT_ASSETS: "1",
        RENDERED_TEST_FIVE_ASSETS: "1",
        RENDERED_TEST_GH_STATE: join(directory, "redirect-body-gh-state"),
        RENDERED_TEST_LOG: redirectBodyLog,
        RENDERED_TEST_REDIRECT_BODY_BUDGET: "1",
        RENDERED_TEST_REDIRECT_BODY_STATE: mkdtempSync(join(directory, "redirect-body-state-"))
      })
      assertCommandFailure(redirectBodyBudget)
      assert.include(`${redirectBodyBudget.stdout}\n${redirectBodyBudget.stderr}`, "download byte budget")
      const redirectBodyRequests = readFileSync(redirectBodyLog, "utf8")
      assert.strictEqual(redirectBodyRequests.split("\n").filter((line) => line.startsWith("curl-stdin=")).length, 12)
      assert.include(redirectBodyRequests, "--max-filesize 68157440")
      assertTemporaryPathsRemoved(redirectBodyLog)

      const changedProof = runFailure({
        RENDERED_TEST_CHANGED: "1",
        RENDERED_TEST_FIVE_ASSETS: "1",
        RENDERED_TEST_GH_STATE: join(directory, "changed-state")
      })
      assert.include(`${changedProof.stdout}\n${changedProof.stderr}`, "rendered proof changed")

      const wrongInitialHead = runFailure({
        RENDERED_TEST_FIVE_ASSETS: "1",
        RENDERED_TEST_HEAD_SHA: "abcdef0123456789abcdef0123456789abcdef01"
      })
      assert.include(`${wrongInitialHead.stdout}\n${wrongInitialHead.stderr}`, "head did not match the expected final head")

      const changedHead = runFailure({
        RENDERED_TEST_FIVE_ASSETS: "1",
        RENDERED_TEST_GH_STATE: join(directory, "head-change-state"),
        RENDERED_TEST_HEAD_CHANGED_AFTER: "1"
      })
      assert.include(`${changedHead.stdout}\n${changedHead.stderr}`, "rendered proof changed")

      const finalBodyChanged = runFailure({
        RENDERED_TEST_BODY_CHANGED_AFTER: "2",
        RENDERED_TEST_FIVE_ASSETS: "1",
        RENDERED_TEST_GH_STATE: join(directory, "body-change-state")
      })
      assert.include(`${finalBodyChanged.stdout}\n${finalBodyChanged.stderr}`, "rendered proof changed")

      const finalSemanticQueryChanged = runFailure({
        RENDERED_TEST_FIVE_ASSETS: "1",
        RENDERED_TEST_GH_STATE: join(directory, "semantic-change-state"),
        RENDERED_TEST_SEMANTIC_CHANGED_AFTER: "2"
      })
      assert.include(`${finalSemanticQueryChanged.stdout}\n${finalSemanticQueryChanged.stderr}`, "rendered proof changed")

      const trustedRedirectLog = join(directory, "trusted-redirect.log")
      const trustedRedirect = runLauncher({
        RENDERED_TEST_LOG: trustedRedirectLog,
        RENDERED_TEST_REDIRECT_COUNT: "5",
        RENDERED_TEST_REDIRECT_STATE: join(directory, "trusted-redirect-state")
      })
      assert.strictEqual(trustedRedirect.status, 0, trustedRedirect.stderr)
      const trustedRedirectRequests = readFileSync(trustedRedirectLog, "utf8")
      assert.include(trustedRedirectRequests, "--max-filesize 104857600")
      assert.include(trustedRedirectRequests, "--max-filesize 104857530")
      assertTemporaryPathsRemoved(trustedRedirectLog)

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
      assert.include(requests, " --max-filesize 104857600 --max-time 600 ")
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
