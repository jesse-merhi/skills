import { assert, describe, it } from "@effect/vitest"
import * as Effect from "effect/Effect"

import { fetchRequestArgs, parseFetchResult, parseUploadResponse, repositoryFromPullRequest, uploadRequestArgs } from "./GitHubAttachment.ts"

describe("GitHub attachment upload contract", () => {
  it.effect("resolves the repository from the exact github.com PR", () => repositoryFromPullRequest(
    '{"url":"https://github.com/jesse-merhi/skills/pull/81"}'
  ).pipe(Effect.map((repository) => assert.strictEqual(repository, "jesse-merhi/skills"))))

  it.effect("rejects GitHub Enterprise before upload", () => repositoryFromPullRequest(
    '{"url":"https://github.example.com/acme/private/pull/7"}'
  ).pipe(Effect.flip, Effect.map((error) => assert.match(error.message, /github[.]com PRs only/u))))

  it.effect("requires a 201 response and canonical attachment URL", () => parseUploadResponse(
    "HTTP/2.0 201 Created\r\nContent-Type: application/json\r\n\r\nhttps://github.com/user-attachments/assets/abc-123"
  ).pipe(Effect.map((url) => assert.strictEqual(url, "https://github.com/user-attachments/assets/abc-123"))))

  it.effect("rejects a successful response from another asset host", () => parseUploadResponse(
    "HTTP/2.0 201 Created\n\nhttps://cdn.example.com/asset"
  ).pipe(Effect.flip, Effect.map((error) => assert.match(error.message, /invalid attachment URL/u))))

  it.effect("decodes the fetched HTTP contract", () => parseFetchResult(
    '{"status":200,"contentType":"video/mp4"}'
  ).pipe(Effect.map((result) => assert.deepStrictEqual(result, { status: 200, contentType: "video/mp4" }))))

  it("delegates encoding, auth, and JSON selection to gh api", () => {
    const args = uploadRequestArgs({ evidencePath: "/tmp/proof image.png", evidenceName: "proof image.png", mediaType: "image/png", repositoryId: 42 })
    assert.includeMembers([...args], ["--input", "/tmp/proof image.png", "--raw-field", "name=proof image.png", "--raw-field", "content_type=image/png", "--field", "repository_id=42", "--jq", ".url"])
    assert.notInclude(args.join(" "), "auth token")
  })

  it("disables curl configuration before following the attachment redirect", () => {
    const args = fetchRequestArgs("/tmp/attachment", "https://github.com/user-attachments/assets/abc-123")
    assert.strictEqual(args[0], "--disable")
    assert.include(args, "--location")
    assert.notInclude(args, "--location-trusted")
  })
})
