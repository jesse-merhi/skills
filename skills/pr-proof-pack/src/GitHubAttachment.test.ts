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

import {
  fetchRequestArgs,
  mediaTypeRequestArgs,
  parseFetchResult,
  parseGitHubToken,
  parsePullRequestUrl,
  parseRedirectResult,
  parseUploadResponse,
  redirectRequestArgs,
  repositoryFromPullRequest,
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
    "HTTP/2.0 201 Created\n\nhttps://cdn.example.com/asset"
  ).pipe(Effect.flip, Effect.map((error) => assert.match(error.message, /invalid attachment URL/u))))

  it.effect("decodes the fetched HTTP contract", () => parseFetchResult(
    '{"status":200,"contentType":"video/mp4"}'
  ).pipe(Effect.map((result) => assert.deepStrictEqual(result, { status: 200, contentType: "video/mp4" }))))

  it.effect("decodes an HTTPS redirect without exposing it to the shell", () => parseRedirectResult(
    '{"status":302,"location":"https://private-user-images.githubusercontent.com/signed"}'
  ).pipe(Effect.map((url) => assert.strictEqual(url, "https://private-user-images.githubusercontent.com/signed"))))

  it.effect("rejects a non-redirect attachment response", () => parseRedirectResult(
    '{"status":200,"location":"https://private-user-images.githubusercontent.com/signed"}'
  ).pipe(Effect.flip, Effect.map((error) => assert.match(error.message, /invalid attachment redirect response/u))))

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
    const redirectArgs = redirectRequestArgs("/tmp/redirect", "https://github.com/user-attachments/assets/abc-123")
    assert.strictEqual(redirectArgs[0], "--disable")
    assert.includeMembers([...redirectArgs], ["--header", "@-"])
    assert.notInclude(redirectArgs, "--location")

    const fetchArgs = fetchRequestArgs("/tmp/attachment", "https://private-user-images.githubusercontent.com/signed")
    assert.strictEqual(fetchArgs[0], "--disable")
    assert.include(fetchArgs, "--location")
    assert.includeMembers([...fetchArgs], ["--proto", "=https", "--proto-redir", "=https"])
    assert.notInclude(fetchArgs.join(" "), "Authorization")
    assert.notInclude(fetchArgs, "@-")
    assert.notInclude(fetchArgs, "--location-trusted")
  })

  it.effect("accepts an attachment only after every verification matches", () => verifyAttachment({
    expectedMediaType: "image/png",
    expectedSize: FileSystem.Size(42),
    fetched: { status: 200, contentType: "image/png" },
    fetchedMediaType: "image/png",
    fetchedSize: FileSystem.Size(42)
  }))

  it.effect("rejects failed HTTP attachment verification", () => verifyAttachment({
    expectedMediaType: "image/png",
    expectedSize: FileSystem.Size(42),
    fetched: { status: 404, contentType: "image/png" },
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

  it("keeps credentials on the first curl request and prints only a verified URL", () => {
    const directory = mkdtempSync(join(tmpdir(), "github-attachment-test-"))
    const log = join(directory, "curl.log")
    const evidence = join(directory, "proof.png")
    writeFileSync(evidence, "evidence")
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
  auth:token) printf '%s\\n' 'test-token' ;;
  api:--hostname) printf '%s\\n' '{"id":42}' ;;
  api:--method) printf '%s\\n' 'HTTP/2.0 201 Created' '' 'https://github.com/user-attachments/assets/abc-123' ;;
  *) printf 'unexpected gh arguments: %s\\n' "$*" >&2; exit 2 ;;
esac
`)
    writeExecutable(join(directory, "file"), `#!/bin/sh
printf '%s\\n' "\${UPLOAD_TEST_MEDIA_TYPE:-image/png}"
`)
    writeExecutable(join(directory, "curl"), `#!/bin/sh
output=''
next_output=0
for argument do
  if [ "$next_output" = 1 ]; then
    output="$argument"
    next_output=0
  elif [ "$argument" = '--output' ]; then
    next_output=1
  fi
done
case " $* " in
  *' --header @- '*)
    auth_input="$(cat)"
    printf 'first-stdin=%s\\nfirst-args=%s\\n' "$auth_input" "$*" >> "$UPLOAD_TEST_LOG"
    : > "$output"
    printf '%s' '{"status":302,"location":"https://private-user-images.githubusercontent.com/signed"}'
    ;;
  *)
    second_input="$(cat)"
    printf 'second-stdin=%s\\nsecond-args=%s\\n' "$second_input" "$*" >> "$UPLOAD_TEST_LOG"
    if [ "\${UPLOAD_TEST_MISMATCH:-}" = 1 ]; then
      printf '%s' 'bad' > "$output"
    else
      cp "$UPLOAD_TEST_EVIDENCE" "$output"
    fi
    printf '%s' '{"status":200,"contentType":"image/png"}'
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

    try {
      const missing = spawnSync(launcher, ["--pr", "https://github.com/jesse-merhi/skills/pull/81", join(directory, "missing.png")], {
        encoding: "utf8",
        env: environment
      })
      assert.notStrictEqual(missing.status, 0)
      assert.isFalse(existsSync(log))

      const directoryInput = spawnSync(launcher, ["--pr", "https://github.com/jesse-merhi/skills/pull/81", directory], {
        encoding: "utf8",
        env: environment
      })
      assert.notStrictEqual(directoryInput.status, 0)
      assert.isFalse(existsSync(log))

      const unsupportedLog = join(directory, "unsupported.log")
      const unsupported = spawnSync(launcher, ["--pr", "https://github.com/jesse-merhi/skills/pull/81", evidence], {
        encoding: "utf8",
        env: { ...environment, UPLOAD_TEST_LOG: unsupportedLog, UPLOAD_TEST_MEDIA_TYPE: "text/plain" }
      })
      assert.notStrictEqual(unsupported.status, 0)
      assert.notInclude(unsupported.stdout, "https://github.com/user-attachments/assets/abc-123")
      assert.notInclude(readFileSync(unsupportedLog, "utf8"), "api --method POST")

      const success = spawnSync(launcher, ["--pr", "https://github.com/jesse-merhi/skills/pull/81", evidence], {
        encoding: "utf8",
        env: environment
      })
      assert.strictEqual(success.status, 0, success.stderr)
      assert.strictEqual(success.stdout.trim(), "https://github.com/user-attachments/assets/abc-123")

      const requests = readFileSync(log, "utf8")
      const firstArgs = requests.split("\n").find((line) => line.startsWith("first-args=")) ?? ""
      const secondArgs = requests.split("\n").find((line) => line.startsWith("second-args=")) ?? ""
      assert.include(requests, "first-stdin=Authorization: Bearer test-token")
      assert.notInclude(firstArgs, "--location")
      assert.include(requests, "second-stdin=\n")
      assert.include(secondArgs, "--location")
      assert.notInclude(secondArgs, "Authorization")
      assert.notInclude(secondArgs, "test-token")
      assert.notInclude(secondArgs, "@-")

      const mismatch = spawnSync(launcher, ["--pr", "https://github.com/jesse-merhi/skills/pull/81", evidence], {
        encoding: "utf8",
        env: { ...environment, UPLOAD_TEST_MISMATCH: "1" }
      })
      assert.notStrictEqual(mismatch.status, 0)
      assert.notInclude(mismatch.stdout, "https://github.com/user-attachments/assets/abc-123")
    } finally {
      rmSync(directory, { force: true, recursive: true })
    }
  }, 20_000)
})
