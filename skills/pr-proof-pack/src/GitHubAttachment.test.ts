import { assert, describe, it } from "@effect/vitest"
import * as Effect from "effect/Effect"
import * as FileSystem from "effect/FileSystem"
// @effect-diagnostics-next-line nodeBuiltinImport:off
import { spawnSync } from "node:child_process"
// @effect-diagnostics-next-line nodeBuiltinImport:off
import { chmodSync, existsSync, mkdtempSync, readFileSync, rmSync, truncateSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
// @effect-diagnostics-next-line nodeBuiltinImport:off
import { join } from "node:path"
import { fileURLToPath } from "node:url"

import {
  allowTrustedRedirect,
  curlUrlConfig,
  fetchRequestArgs,
  mediaTypeRequestArgs,
  parseFetchResult,
  parseGitHubToken,
  parsePullRequestUrl,
  parseRedirectHeaders,
  parseRedirectResult,
  parseTrustedMediaUrl,
  parseUploadResponse,
  redirectRequestArgs,
  repositoryFromPullRequest,
  requireAttachmentSize,
  uploadRequestArgs,
  verifyAttachment
} from "./GitHubAttachment.ts"

const launcher = fileURLToPath(new URL("../scripts/github-upload-attachment", import.meta.url))

const writeExecutable = (path: string, content: string) => {
  writeFileSync(path, content)
  chmodSync(path, 0o755)
}

describe("GitHub attachment upload contract", () => {
  it.effect("resolves the repository from the exact github.com PR", () => repositoryFromPullRequest(
    '{"url":"https://github.com/jesse-merhi/skills/pull/81"}'
  ).pipe(Effect.map((repository) => assert.strictEqual(repository, "jesse-merhi/skills"))))

  it.effect("rejects GitHub Enterprise before upload", () => repositoryFromPullRequest(
    '{"url":"https://github.example.com/acme/private/pull/7"}'
  ).pipe(Effect.flip, Effect.map((error) => assert.match(error.message, /github[.]com PRs only/u))))

  it.effect("rejects URL syntax that changes the parsed repository", () => repositoryFromPullRequest(
    '{"url":"https://github.com/acme?/private/pull/7"}'
  ).pipe(Effect.flip, Effect.map((error) => assert.match(error.message, /invalid pull request URL/u))))

  it.effect("requires a full PR URL instead of an ambient repository number", () => parsePullRequestUrl(
    "81"
  ).pipe(Effect.flip, Effect.map((error) => assert.match(error.message, /pass the full github[.]com PR URL/u))))

  it.effect("redacts rejected PR URL credentials", () => parsePullRequestUrl(
    "https://sentinel-user@github.com/jesse-merhi/skills/pull/81?token=sentinel-secret"
  ).pipe(Effect.flip, Effect.map((error) => {
    assert.match(error.message, /invalid pull request URL/u)
    assert.notInclude(error.message, "sentinel-user")
    assert.notInclude(error.message, "sentinel-secret")
  })))

  it.effect("rejects multiline tokens without exposing credential text", () => parseGitHubToken(
    "secret-token\nX-Injected: yes"
  ).pipe(Effect.flip, Effect.map((error) => {
    assert.match(error.message, /invalid single-line authentication token/u)
    assert.notInclude(error.message, "secret-token")
    assert.notInclude(error.message, "X-Injected")
  })))

  it.effect("accepts a 201 response with a canonical attachment URL", () => parseUploadResponse(
    "HTTP/2.0 201 Created\r\nContent-Type: application/json\r\n\r\nhttps://github.com/user-attachments/assets/abc-123"
  ).pipe(Effect.map((url) => assert.strictEqual(url, "https://github.com/user-attachments/assets/abc-123"))))

  it.effect("rejects a non-201 upload response", () => parseUploadResponse(
    "HTTP/2.0 200 OK\n\nhttps://github.com/user-attachments/assets/abc-123"
  ).pipe(Effect.flip, Effect.map((error) => assert.match(error.message, /invalid attachment upload status/u))))

  it.effect("rejects a successful response from another asset host", () => parseUploadResponse(
    "HTTP/2.0 201 Created\n\nhttps://cdn.example.com/asset?token=sentinel-secret"
  ).pipe(Effect.flip, Effect.map((error) => {
    assert.match(error.message, /invalid attachment URL/u)
    assert.notInclude(error.message, "sentinel-secret")
  })))

  it.effect("decodes the fetched HTTP contract", () => parseFetchResult(
    '{"status":404,"contentType":"text/html; charset=utf-8"}'
  ).pipe(Effect.map((result) => assert.deepStrictEqual(result, { status: 404, contentType: "text/html; charset=utf-8" }))))

  it.effect("decodes an HTTPS redirect without exposing it to the shell", () => parseRedirectResult(
    '{"status":302,"location":"https://private-user-images.githubusercontent.com/signed"}'
  ).pipe(Effect.map((url) => assert.strictEqual(url, "https://private-user-images.githubusercontent.com/signed"))))

  it.effect("rejects a non-redirect attachment response", () => parseRedirectResult(
    '{"status":200,"location":"https://private-user-images.githubusercontent.com/signed"}'
  ).pipe(Effect.flip, Effect.map((error) => assert.match(error.message, /invalid attachment redirect response/u))))

  it.effect("resolves a trusted redirect header without exposing the location", () => parseRedirectHeaders({
    baseUrl: "https://private-user-images.githubusercontent.com/start",
    headers: "HTTP/1.1 302 Found\r\nLocation: https://camo.githubusercontent.com/next?jwt=sentinel-secret\r\n",
    status: 302
  }).pipe(Effect.map((url) => assert.strictEqual(url, "https://camo.githubusercontent.com/next?jwt=sentinel-secret"))))

  it.effect("rejects missing and untrusted redirect locations", () => Effect.all([
    parseRedirectHeaders({
      baseUrl: "https://private-user-images.githubusercontent.com/start",
      headers: "HTTP/1.1 302 Found\r\n",
      status: 302
    }).pipe(Effect.flip),
    parseRedirectHeaders({
      baseUrl: "https://private-user-images.githubusercontent.com/start",
      headers: "HTTP/1.1 302 Found\r\nLocation: https://internal.example.com/admin\r\n",
      status: 302
    }).pipe(Effect.flip)
  ]).pipe(Effect.map((errors) => {
    for (const error of errors) assert.match(error.message, /invalid attachment redirect response/u)
  })))

  it.effect("allows five trusted redirects and rejects a sixth", () => Effect.all([
    allowTrustedRedirect(4),
    allowTrustedRedirect(5).pipe(Effect.flip, Effect.map((error) => assert.match(error.message, /exceeded 5/u)))
  ]))

  it.effect("rejects rendered media outside GitHub-controlled hosts", () => parseTrustedMediaUrl(
    "https://internal.example.com/admin?token=sentinel-secret"
  ).pipe(Effect.flip, Effect.map((error) => {
    assert.match(error.message, /untrusted rendered-media URL/u)
    assert.notInclude(error.message, "sentinel-secret")
  })))

  it("builds the complete stable gh api upload boundary", () => {
    const args = uploadRequestArgs({ evidencePath: "/tmp/proof image.png", evidenceName: "proof image.png", mediaType: "image/png", repositoryId: 42 })
    assert.deepStrictEqual([...args], [
      "api", "--method", "POST", "--hostname", "github.com",
      "https://uploads.github.com/user-attachments/assets",
      "--header", "Content-Type: application/octet-stream",
      "--header", "Accept: application/json",
      "--header", "X-GitHub-Api-Version: 2022-11-28",
      "--input", "/tmp/proof image.png",
      "--raw-field", "name=proof image.png",
      "--raw-field", "content_type=image/png",
      "--field", "repository_id=42",
      "--include", "--jq", ".url"
    ])
  })

  it("passes dash-prefixed evidence paths after file's option boundary", () => {
    assert.deepStrictEqual([...mediaTypeRequestArgs("-proof.png")], ["--brief", "--mime-type", "--", "-proof.png"])
  })

  it("separates the authenticated redirect request from the unauthenticated fetch", () => {
    const redirectArgs = redirectRequestArgs("/tmp/redirect", "/tmp/redirect-headers", "https://github.com/user-attachments/assets/abc-123")
    assert.deepStrictEqual([...redirectArgs], [
      "--disable", "--globoff", "--silent", "--show-error", "--output", "/tmp/redirect",
      "--dump-header", "/tmp/redirect-headers", "--max-redirs", "0", "--proto", "=https",
      "--max-filesize", "104857600", "--max-time", "600",
      "--write-out", '{"status":%{http_code},"contentType":"%{content_type}"}',
      "--header", "@-", "https://github.com/user-attachments/assets/abc-123"
    ])

    const signedUrl = "https://private-user-images.githubusercontent.com/signed?jwt=sentinel-secret"
    const fetchArgs = fetchRequestArgs("/tmp/attachment", "/tmp/attachment-headers")
    assert.deepStrictEqual([...fetchArgs], [
      "--disable", "--globoff", "--silent", "--show-error", "--output", "/tmp/attachment",
      "--dump-header", "/tmp/attachment-headers", "--max-redirs", "0", "--proto", "=https",
      "--max-filesize", "104857600", "--max-time", "600",
      "--write-out", '{"status":%{http_code},"contentType":"%{content_type}"}',
      "--config", "-"
    ])
    assert.strictEqual(curlUrlConfig(signedUrl), `url = "${signedUrl}"\n`)
    assert.include(
      fetchRequestArgs("/tmp/attachment", "/tmp/attachment-headers", FileSystem.Size(42)).join(" "),
      "--max-filesize 42"
    )
    assert.strictEqual(
      curlUrlConfig("https://private-user-images.githubusercontent.com/signed?value=one\\two"),
      'url = "https://private-user-images.githubusercontent.com/signed?value=one\\\\two"\n'
    )
  })

  it.effect("accepts an attachment only after every verification matches", () => verifyAttachment({
    expectedMediaType: "image/png",
    expectedSize: FileSystem.Size(42),
    fetched: { status: 200, contentType: "image/png; qs=0.85" },
    fetchedMediaType: "image/png",
    fetchedSize: FileSystem.Size(42)
  }))

  it.effect("rejects failed HTTP attachment verification", () => verifyAttachment({
    expectedMediaType: "image/png",
    expectedSize: FileSystem.Size(42),
    fetched: { status: 404, contentType: "text/html; charset=utf-8" },
    fetchedMediaType: "image/png",
    fetchedSize: FileSystem.Size(42)
  }).pipe(Effect.flip, Effect.map((error) => assert.match(error.message, /returned HTTP 404/u))))

  it.effect("rejects an HTTP content type mismatch", () => verifyAttachment({
    expectedMediaType: "image/png",
    expectedSize: FileSystem.Size(42),
    fetched: { status: 200, contentType: "video/mp4" },
    fetchedMediaType: "image/png",
    fetchedSize: FileSystem.Size(42)
  }).pipe(Effect.flip, Effect.map((error) => assert.match(error.message, /HTTP content type video\/mp4/u))))

  it.effect("rejects a downloaded content type mismatch", () => verifyAttachment({
    expectedMediaType: "image/png",
    expectedSize: FileSystem.Size(42),
    fetched: { status: 200, contentType: "image/png" },
    fetchedMediaType: "video/mp4",
    fetchedSize: FileSystem.Size(42)
  }).pipe(Effect.flip, Effect.map((error) => assert.match(error.message, /Downloaded attachment content type video\/mp4/u))))

  it.effect("rejects a downloaded byte-size mismatch", () => verifyAttachment({
    expectedMediaType: "image/png",
    expectedSize: FileSystem.Size(42),
    fetched: { status: 200, contentType: "image/png" },
    fetchedMediaType: "image/png",
    fetchedSize: FileSystem.Size(41)
  }).pipe(Effect.flip, Effect.map((error) => assert.match(error.message, /size 41 did not match 42/u))))

  it.effect("rejects attachments larger than GitHub's 100 MiB limit", () => Effect.all([
    requireAttachmentSize(FileSystem.Size(100 * 1024 * 1024)),
    requireAttachmentSize(FileSystem.Size((100 * 1024 * 1024) + 1)).pipe(Effect.flip)
  ]).pipe(Effect.map((results) => assert.match(results[1]?.message ?? "", /cannot exceed 100 MiB/u))))

  it("keeps credentials on the first curl request and prints only a verified URL", () => {
    const directory = mkdtempSync(join(tmpdir(), "github-attachment-test-"))
    const log = join(directory, "curl.log")
    const evidence = join(directory, "proof.png")
    const oversizedEvidence = join(directory, "oversized.png")
    writeFileSync(evidence, "evidence")
    writeFileSync(oversizedEvidence, "")
    truncateSync(oversizedEvidence, (100 * 1024 * 1024) + 1)
    writeExecutable(join(directory, "gh"), `#!/bin/sh
printf 'gh-args=%s\\n' "$*" >> "$UPLOAD_TEST_LOG"
case "$1:$2" in
  pr:view)
    if [ "$3" != 'https://github.com/jesse-merhi/skills/pull/81' ] || [ "$4" != '--json' ] || [ "$5" != 'url' ]; then
      printf 'unexpected gh pr view arguments: %s\\n' "$*" >&2
      exit 2
    fi
    printf '%s\\n' '{"url":"https://github.com/jesse-merhi/skills/pull/81"}'
    ;;
  auth:token)
    if [ "$3" != '--hostname' ] || [ "$4" != 'github.com' ]; then
      printf 'unexpected gh auth arguments: %s\\n' "$*" >&2
      exit 2
    fi
    printf '%s\\n' 'test-token'
    ;;
  api:--hostname)
    if [ "$3" != 'github.com' ] || [ "$4" != 'repos/jesse-merhi/skills' ]; then
      printf 'unexpected gh repository arguments: %s\\n' "$*" >&2
      exit 2
    fi
    printf '%s\\n' '{"id":42}'
    ;;
  api:--method)
    expected="api --method POST --hostname github.com https://uploads.github.com/user-attachments/assets --header Content-Type: application/octet-stream --header Accept: application/json --header X-GitHub-Api-Version: 2022-11-28 --input $UPLOAD_TEST_EVIDENCE --raw-field name=proof.png --raw-field content_type=image/png --field repository_id=42 --include --jq .url"
    if [ "$*" != "$expected" ]; then
      printf 'unexpected gh upload arguments: %s\\n' "$*" >&2
      exit 2
    fi
    printf '%s\\n' 'HTTP/2.0 201 Created' '' 'https://github.com/user-attachments/assets/abc-123'
    ;;
  *) printf 'unexpected gh arguments: %s\\n' "$*" >&2; exit 2 ;;
esac
`)
    writeExecutable(join(directory, "file"), `#!/bin/sh
printf 'file-args=%s\\n' "$*" >> "$UPLOAD_TEST_LOG"
if [ "$#" -ne 4 ] || [ "$1" != '--brief' ] || [ "$2" != '--mime-type' ] || [ "$3" != '--' ] || [ -z "$4" ]; then
  printf 'unexpected file arguments: %s\\n' "$*" >&2
  exit 2
fi
if [ "$4" = "$UPLOAD_TEST_EVIDENCE" ]; then
  printf '%s\\n' "\${UPLOAD_TEST_SOURCE_MEDIA_TYPE:-image/png}"
else
  printf '%s\\n' "\${UPLOAD_TEST_DOWNLOADED_MEDIA_TYPE:-image/png}"
fi
`)
    writeExecutable(join(directory, "curl"), `#!/bin/sh
output=''
headers=''
previous=''
for argument do
  if [ "$previous" = '--output' ]; then output="$argument"; fi
  if [ "$previous" = '--dump-header' ]; then headers="$argument"; fi
  previous="$argument"
done
case " $* " in
  *' --header @- '*)
    auth_input="$(cat)"
    printf 'first-stdin=%s\\nfirst-args=%s\\n' "$auth_input" "$*" >> "$UPLOAD_TEST_LOG"
    for argument do printf 'first-arg=%s\\n' "$argument" >> "$UPLOAD_TEST_LOG"; done
    if [ "\${UPLOAD_TEST_REDIRECT_BODY_LIMIT:-}" = 1 ]; then
      /usr/bin/truncate -s 104857600 "$output"
    else
      : > "$output"
    fi
    printf '%s\\n' 'HTTP/1.1 302 Found' 'Location: https://private-user-images.githubusercontent.com/signed?jwt=sentinel-secret' '' > "$headers"
    if [ "\${UPLOAD_TEST_REDIRECT_FAILURE:-}" = 1 ]; then
      printf '%s' 'https://private-user-images.githubusercontent.com/signed?jwt=sentinel-secret'
      printf '%s\\n' 'redirect write failed for test-token' >&2
      exit 7
    fi
    printf '%s' '{"status":302,"contentType":"text/html"}'
    ;;
  *)
    second_input="$(cat)"
    printf 'second-stdin=%s\\nsecond-args=%s\\n' "$second_input" "$*" >> "$UPLOAD_TEST_LOG"
    for argument do printf 'second-arg=%s\\n' "$argument" >> "$UPLOAD_TEST_LOG"; done
    if [ "$second_input" != 'url = "https://private-user-images.githubusercontent.com/signed?jwt=sentinel-secret"' ]; then
      printf 'unexpected asset curl stdin\\n' >&2
      exit 2
    fi
    content_type="\${UPLOAD_TEST_HTTP_MEDIA_TYPE:-image/png}"
    printf '%s\\n' 'HTTP/1.1 200 OK' "Content-Type: $content_type" '' > "$headers"
    if [ "\${UPLOAD_TEST_FETCH_SIGNAL:-}" = 1 ]; then
      kill -TERM "$PPID"
      exec sleep 30
    fi
    if [ "\${UPLOAD_TEST_MISMATCH:-}" = 1 ]; then
      printf '%s' 'bad' > "$output"
    else
      cp "$UPLOAD_TEST_EVIDENCE" "$output"
    fi
    printf '{"status":200,"contentType":"%s"}' "$content_type"
    ;;
esac
`)

    const environment = {
      ...process.env,
      // @effect-diagnostics-next-line processEnv:off
      PATH: `${directory}:${process.env.PATH ?? ""}`,
      UPLOAD_TEST_EVIDENCE: evidence,
      UPLOAD_TEST_LOG: log
    }
    const runLauncher = (evidencePath: string, overrides: NodeJS.ProcessEnv = {}) => spawnSync(
      launcher,
      ["--pr", "https://github.com/jesse-merhi/skills/pull/81", evidencePath],
      { encoding: "utf8", env: { ...environment, ...overrides }, timeout: 12_000 }
    )
    const assertCommandFailure = (result: ReturnType<typeof runLauncher>) => {
      assert.isUndefined(result.error)
      assert.isNull(result.signal)
      assert.isNumber(result.status)
      assert.notStrictEqual(result.status, 0)
    }
    const assertTemporaryPathsRemoved = () => {
      const args = readFileSync(log, "utf8").split("\n")
        .filter((line) => line.startsWith("first-arg=") || line.startsWith("second-arg="))
        .map((line) => line.slice(line.indexOf("=") + 1))
      for (let index = 1; index < args.length; index += 1) {
        if (args[index - 1] === "--output" || args[index - 1] === "--dump-header") {
          assert.isFalse(existsSync(args[index] ?? ""), `expected scoped temp file to be removed: ${args[index]}`)
        }
      }
    }

    try {
      const missing = runLauncher(join(directory, "missing.png"))
      assertCommandFailure(missing)
      assert.isFalse(existsSync(log))

      const unsupportedLog = join(directory, "unsupported.log")
      const unsupported = runLauncher(evidence, { UPLOAD_TEST_LOG: unsupportedLog, UPLOAD_TEST_SOURCE_MEDIA_TYPE: "text/plain" })
      assertCommandFailure(unsupported)
      assert.notInclude(unsupported.stdout, "https://github.com/user-attachments/assets/abc-123")
      assert.notInclude(readFileSync(unsupportedLog, "utf8"), "api --method POST")

      const oversizedLog = join(directory, "oversized.log")
      const oversized = runLauncher(oversizedEvidence, { UPLOAD_TEST_LOG: oversizedLog })
      assertCommandFailure(oversized)
      assert.include(`${oversized.stdout}\n${oversized.stderr}`, "cannot exceed 100 MiB")
      assert.notInclude(readFileSync(oversizedLog, "utf8"), "api --method POST")

      const success = runLauncher(evidence)
      assert.strictEqual(success.status, 0, `${success.stderr}\n${existsSync(log) ? readFileSync(log, "utf8") : "no process log"}`)
      assert.strictEqual(success.stdout.trim(), "https://github.com/user-attachments/assets/abc-123")

      const requests = readFileSync(log, "utf8")
      const firstArgs = requests.split("\n").find((line) => line.startsWith("first-args=")) ?? ""
      const secondArgs = requests.split("\n").find((line) => line.startsWith("second-args=")) ?? ""
      const secondArgv = requests.split("\n").filter((line) => line.startsWith("second-arg=")).map((line) => line.slice("second-arg=".length))
      const fileArgs = requests.split("\n").filter((line) => line.startsWith("file-args="))
      assert.strictEqual(fileArgs[0], `file-args=--brief --mime-type -- ${evidence}`)
      assert.strictEqual(fileArgs[1], `file-args=--brief --mime-type -- ${secondArgv[5]}`)
      assert.include(requests, "first-stdin=Authorization: Bearer test-token")
      assert.notInclude(firstArgs, "--location")
      assert.include(firstArgs, " --max-filesize 104857600 --max-time 600 ")
      assert.include(requests, 'second-stdin=url = "https://private-user-images.githubusercontent.com/signed?jwt=sentinel-secret"')
      assert.notInclude(secondArgs, "Authorization")
      assert.notInclude(secondArgs, "test-token")
      assert.notInclude(secondArgs, "@-")
      assert.notInclude(secondArgs, "sentinel-secret")
      assert.include(secondArgs, " --max-filesize 104857600 --max-time 600 ")
      assertTemporaryPathsRemoved()

      const mismatch = runLauncher(evidence, { UPLOAD_TEST_MISMATCH: "1" })
      assertCommandFailure(mismatch)
      assert.notInclude(mismatch.stdout, "https://github.com/user-attachments/assets/abc-123")
      assertTemporaryPathsRemoved()

      const downloadedMimeMismatch = runLauncher(evidence, { UPLOAD_TEST_DOWNLOADED_MEDIA_TYPE: "video/mp4" })
      assertCommandFailure(downloadedMimeMismatch)
      assert.include(`${downloadedMimeMismatch.stdout}\n${downloadedMimeMismatch.stderr}`, "Downloaded attachment content type video/mp4")
      assert.notInclude(downloadedMimeMismatch.stdout, "https://github.com/user-attachments/assets/abc-123")
      assertTemporaryPathsRemoved()

      const httpMimeMismatch = runLauncher(evidence, { UPLOAD_TEST_HTTP_MEDIA_TYPE: "video/mp4" })
      assertCommandFailure(httpMimeMismatch)
      assert.include(`${httpMimeMismatch.stdout}\n${httpMimeMismatch.stderr}`, "HTTP content type video/mp4")
      assert.notInclude(httpMimeMismatch.stdout, "https://github.com/user-attachments/assets/abc-123")
      assertTemporaryPathsRemoved()

      const redirectFailure = runLauncher(evidence, { UPLOAD_TEST_REDIRECT_FAILURE: "1" })
      assertCommandFailure(redirectFailure)
      assert.notInclude(`${redirectFailure.stdout}\n${redirectFailure.stderr}`, "sentinel-secret")
      assert.notInclude(`${redirectFailure.stdout}\n${redirectFailure.stderr}`, "test-token")
      assertTemporaryPathsRemoved()

      const redirectBodyLimit = runLauncher(evidence, { UPLOAD_TEST_REDIRECT_BODY_LIMIT: "1" })
      assertCommandFailure(redirectBodyLimit)
      assert.include(`${redirectBodyLimit.stdout}\n${redirectBodyLimit.stderr}`, "download byte budget")
      assert.notInclude(redirectBodyLimit.stdout, "https://github.com/user-attachments/assets/abc-123")
      assertTemporaryPathsRemoved()

      const interrupted = runLauncher(evidence, { UPLOAD_TEST_FETCH_SIGNAL: "1" })
      assertCommandFailure(interrupted)
      assertTemporaryPathsRemoved()
    } finally {
      rmSync(directory, { force: true, recursive: true })
    }
  }, 90_000)
})
