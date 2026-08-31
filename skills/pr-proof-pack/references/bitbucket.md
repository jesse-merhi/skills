# Bitbucket Cloud through TWG

Read this only for a Bitbucket Cloud PR. This public proof-pack works without a
separate TWG or Atlassian skill, though one may provide useful current provider
guidance. Use TWG for the reads and authorized PR metadata mutation below. Use
Bitbucket Cloud's public repository Downloads API for image storage. Live TWG
help and authenticated public API responses are the command contracts.

## Resolve and inspect the PR

Resolve the workspace slug, repository slug, and PR ID from the exact PR URL or
repository remote. Pass the workspace and repository explicitly rather than
relying on working-directory detection:

```sh
twg bb --workspace <workspace-slug> --repo <repository-slug> \
  prs get <pr-id> --full -o json
```

Record the PR URL, title, description, branches, and both commit hashes. Fetch
missing commits from the appropriate provider remotes. Verify both with
`git cat-file -e '<commit-hash>^{commit}'` without changing the checkout.

```sh
<skill-dir>/scripts/pr-net-diff --base <destination-commit-hash> \
  --head <source-commit-hash> --markdown
```

Require the reported selected base and head SHA to match those commits. The
comparison base remains their merge base.

## Preflight a refresh

Run `twg --version`, `twg bb prs get --help`, and
`twg bb prs update --help`. Require the update command to take the PR ID as its
positional argument and expose `--description`; require `--title` only when the
title is stale. Run the full read above to prove authentication and repository
access.

For an image refresh, also require a credential-aware HTTPS client for the
public Bitbucket API. TWG reads its Bitbucket token from `TWG_BBC_TOKEN` or the
`bbc-token` entry in `~/.twg/auth.conf`, but it does not expose a raw REST
command. Supply `Authorization: Bearer ...` to the HTTPS client through
protected standard input or another non-argument secret channel. Keep the token
out of command arguments, command traces, logs, temporary output, PR text, and
generated asset URLs. Do not copy browser cookies or private Atlassian Media
tokens into automation.

Stop before mutation if a preflight fails. Report the detected binary or API
failure without credential values. Ask the human to repair TWG Bitbucket login
with `twg login --product bitbucket` or restore the required HTTPS client.

## Upload images to repository Downloads

Finish and inspect every image, choose a descriptive repository-unique filename
made only from letters, digits, dots, underscores, and hyphens, and calculate
its byte count, MIME type, and SHA-256 digest. After publication authority is
confirmed and the PR head is rechecked, upload it with this public request:

```text
POST https://api.bitbucket.org/2.0/repositories/{workspace}/{repo}/downloads
Authorization: Bearer <supplied outside process arguments and logs>
multipart field: files=@<image-path>;filename=<repository-unique-filename>
```

Require HTTP `201`. Then insert the stable repository Downloads URL at the
intended position in the complete Markdown body:

```md
![descriptive alt text](https://bitbucket.org/{workspace}/{repo}/downloads/{filename})
```

Use the smallest rendered width that keeps the image comfortably readable.
Treat `50%` as the starting point for focused visuals and use the full column
only when the content genuinely benefits from it. Bitbucket Cloud escapes raw
HTML such as `<img width="50%">` and strips Markdown attribute-list sizing such
as `{: width="50%"}`, so neither controls the rendered width.

For a focused visual that would otherwise render too wide, use the tested
two-column Markdown-table fallback: put the image in one cell and its short,
verified result in the other.

```md
| Evidence | Verified result |
| --- | --- |
| ![Descriptive alt text](https://bitbucket.org/{workspace}/{repo}/downloads/{filename}) | **Observed result:** <short copyable value or state> |
```

On proof PR #58 this presented the image at roughly half the PR column. Treat
that as a provider-specific layout fallback, not a fixed percentage guarantee:
table content affects column width, so inspect the rendered destination before
accepting it.

Upload only images referenced by the finished body, and do not commit proof
media to the repository. This workflow is proven for images, not video. Return
`blocked` when still images would lose an essential motion or playback claim.
If an upload succeeds but the later PR update fails, stop and report the orphan
filename; do not retry under another name or delete it without authorization.

## Apply the complete description

Recheck that the source hash still matches the final head. Then apply the full
Markdown body, not a partial patch. Read a prepared file into the shell variable
if needed; do not invent a `--description-file` flag.

```sh
PR_DESCRIPTION="$(<draft-markdown-path>)"
twg bb --workspace <workspace-slug> --repo <repository-slug> \
  prs update <pr-id> --description "$PR_DESCRIPTION"
unset PR_DESCRIPTION
```

Include `--title <title>` in that update only when the title is stale. A
text-only refresh skips the Downloads upload and applies the complete Markdown
through the same TWG command.

## Verify the finished PR

Run the full TWG read again. Require its source hash to match the final head and
check the title and complete stored description. For every new image, read the
PR through
`GET https://api.bitbucket.org/2.0/repositories/{workspace}/{repo}/pullrequests/{pr-id}`
and require
`rendered.description.html` to contain the expected image node. Fetch the file
through
`GET https://api.bitbucket.org/2.0/repositories/{workspace}/{repo}/downloads/{filename}`
and require HTTP success, the expected MIME type, exact byte count, and the same
SHA-256 digest as the local source. Keep credentials on the same protected
channel used for upload; normal cross-host redirects must not receive the
Authorization header.

An HTML image node and matching downloaded bytes do not prove that a private
repository's PR page loaded or presented the image correctly. In particular,
`rendered.description.html` proving that an `<img>` exists does not prove its
literal placement or rendered width. Open the exact PR in an authenticated
interactive browser, confirm each embed appears in its intended body position,
and inspect its pixels at real PR-body width. Stop on a changed head, missing
node, byte or digest mismatch, missing embed, or unavailable pixel inspection.
