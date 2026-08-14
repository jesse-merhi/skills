# Practical Visual Evidence

## Contents

- [Hard Requirement](#hard-requirement)
- [GitHub Token Upload Path](#github-token-upload-path)
- [Interactive Browser Fallback](#interactive-browser-fallback)
- [Rendered PR Verification](#rendered-pr-verification)
- [Evidence Contract](#evidence-contract)
- [UI Interaction Proof](#ui-interaction-proof)
- [Backend and Operator Proof](#backend-and-operator-proof)
- [Performance Proof](#performance-proof)
- [Placement](#placement)

## Hard Requirement

Capture and upload every evidence item selected in `proof-selection.md`. This
file owns how to capture and publish that evidence; `proof-selection.md` owns
what qualifies.

If practical capture, screen recording, provider authentication, every applicable
attachment path, asset verification, or a required visual inspection fails,
stop before completing the PR update. Tell the human the concrete failure and
ask them to restore the blocked capability. Continue only after it works.

## GitHub Token Upload Path

GitHub's attachment endpoint accepts the same scoped credential already used by
`gh api` and `gh pr edit`. Use it as the default transport for images and video
only when the PR URL's host is exactly `github.com`. The endpoint is undocumented,
so treat it as a fast path with the interactive browser fallback below rather
than a guaranteed API.

Check the PR URL before reading a token. For GitHub Enterprise Server, skip this
fast path and use that host's supported provider or browser flow; never map its
owner and repository name to `github.com`.

Confirm the active account and resolve the numeric repository ID:

```sh
PR='<number-or-URL-resolved-in-step-2>'
PR_URL=$(gh pr view "$PR" --json url --jq '.url')
case "$PR_URL" in
  https://github.com/*) ;;
  *) printf 'Token attachment upload is only available for github.com PRs\n' >&2; exit 1 ;;
esac
gh auth status --active --hostname github.com
REPOSITORY=$(gh pr view "$PR" --json url --jq '.url | capture("^https://github[.]com/(?<repository>[^/]+/[^/]+)/pull/[0-9]+$").repository')
REPO_ID=$(gh api --hostname github.com "repos/$REPOSITORY" --jq '.id')
```

Pass the filename and MIME type as `gh api` fields while the evidence file is
the binary input. With `--input`, `gh api` URL-encodes those fields into the
query string, supplies the scoped token internally, and parses the JSON response
with its built-in `--jq` support. Do not read, print, persist, or source a token
from a browser session for the upload request.

```sh
(
  set -eu
  PR='<number-or-URL-resolved-in-step-2>'
  EVIDENCE_PATH='<path>'
  PR_URL=$(gh pr view "$PR" --json url --jq '.url')
  case "$PR_URL" in
    https://github.com/*) ;;
    *) printf 'Token attachment upload is only available for github.com PRs\n' >&2; exit 1 ;;
  esac
  REPOSITORY=$(gh pr view "$PR" --json url --jq '.url | capture("^https://github[.]com/(?<repository>[^/]+/[^/]+)/pull/[0-9]+$").repository')
  REPO_ID=$(gh api --hostname github.com "repos/$REPOSITORY" --jq '.id')
  MIME_TYPE=$(file --brief --mime-type "$EVIDENCE_PATH")
  EVIDENCE_NAME=$(basename "$EVIDENCE_PATH")
  ASSET_FILE=$(mktemp)
  trap 'unlink "$ASSET_FILE"' EXIT
  if RESPONSE=$(gh api --method POST --hostname github.com \
      'https://uploads.github.com/user-attachments/assets' \
      --header 'Content-Type: application/octet-stream' \
      --header 'Accept: application/json' \
      --header 'X-GitHub-Api-Version: 2022-11-28' \
      --input "$EVIDENCE_PATH" \
      --raw-field "name=$EVIDENCE_NAME" \
      --raw-field "content_type=$MIME_TYPE" \
      --field "repository_id=$REPO_ID" \
      --include \
      --jq '.url' 2>&1); then
    STATUS=$(printf '%s\n' "$RESPONSE" | sed -n '1s#^HTTP/[0-9.]* \([0-9][0-9][0-9]\).*$#\1#p')
  else
    STATUS=$(printf '%s\n' "$RESPONSE" | sed -n '1s#^HTTP/[0-9.]* \([0-9][0-9][0-9]\).*$#\1#p')
    printf 'GitHub attachment upload failed with HTTP %s\n' "${STATUS:-unknown}" >&2
    printf '%s\n' "$RESPONSE" >&2
    exit 1
  fi
  if [ "$STATUS" != 201 ]; then
    printf 'GitHub attachment upload failed with HTTP %s\n' "$STATUS" >&2
    exit 1
  fi
  ASSET_URL=$(printf '%s\n' "$RESPONSE" | tail -n 1)
  case "$ASSET_URL" in
    https://github.com/user-attachments/assets/*) ;;
    *) printf 'Unexpected GitHub attachment host or path: %s\n' "$ASSET_URL" >&2; exit 1 ;;
  esac
  FETCH_RESULT=$(gh auth token --hostname github.com | sed 's/^/Authorization: Bearer /' | \
    curl --silent --show-error --location --output "$ASSET_FILE" --write-out '%{http_code} %{content_type}' \
    --header @- "$ASSET_URL")
  FETCH_STATUS=${FETCH_RESULT%% *}
  FETCH_CONTENT_TYPE=${FETCH_RESULT#* }
  if [ "$FETCH_STATUS" != 200 ]; then
    printf 'GitHub attachment verification failed with HTTP %s\n' "$FETCH_STATUS" >&2
    exit 1
  fi
  test "$FETCH_CONTENT_TYPE" = "$MIME_TYPE"
  test "$(file --brief --mime-type "$ASSET_FILE")" = "$MIME_TYPE"
  test "$(wc -c < "$ASSET_FILE" | tr -d ' ')" = "$(wc -c < "$EVIDENCE_PATH" | tr -d ' ')"
  printf '%s\n' "$ASSET_URL"
)
```

Complete each upload as follows:

1. Accept only a `201` response containing a `github.com/user-attachments/assets`
   URL.
2. Require the returned URL to match
   `https://github.com/user-attachments/assets/*`. Authenticate that initial
   canonical GitHub.com request so private-repository attachments work, then
   follow redirects with ordinary `curl --location`. Curl strips the
   `Authorization` header on a cross-host redirect by default. Never use
   `--location-trusted`, and never send the `gh` token directly to a returned
   CDN or Camo URL. Require `200`, the expected image or video content type, and
   the original byte size.
3. Insert images with descriptive alt text. Insert videos as a bare URL on its
   own line; image Markdown such as `![](url)` does not produce a working MP4
   player.
4. Keep every attachment in the main PR body, never in a table or detached
   comment.

Only image and video content types are accepted. A `422` normally means the
content type is unsupported or does not match the filename. Correct the evidence
rather than trying another credential path. A `404` normally means the active
token cannot push to the repository; confirm the account and repository access,
then use the browser fallback only if that signed-in browser account can write.
For another non-`201` response, malformed response, or failed asset verification,
use the browser fallback instead of retrying with extracted credentials or an
unrelated upload helper.

## Interactive Browser Fallback

Use this path when the GitHub token endpoint is unavailable, when verified
browser access differs from the CLI token's access, or when another provider
requires its editor. Do not extract a `user_session` cookie, session token,
Keychain value, or browser cookie, and do not route those credentials through
`gh-image` or another standalone helper. `gh auth token` is permitted only for
the scoped default path above.

Select the browser path native to the current harness. In OpenClaw, use its
browser tool or `openclaw browser`; inspect `openclaw browser --json status` and
`openclaw browser profiles` when the active authenticated profile is unclear.
In Claude environments, prefer Browser Use when its external skill and CLI are
available; otherwise load `computer-use`. Open a fresh repository tab in the
human-permitted browser or an agent-owned window, leave unrelated tabs alone,
and confirm the expected account can operate the PR page.

Immediately before the first browser attachment upload or PR save, follow the
selected tool's native confirmation policy. If the active harness bypasses or
lacks that confirmation, use its structured question UI to ask the human for
permission for the named upload and save. Treat that answer as permission only
for the current proof refresh.

OpenClaw's native `browser upload` action is allowed because it operates the
provider's file input through the selected interactive browser. CDP is
acceptable only when it is transport behind that browser surface; never use it
to bypass login or extract credentials.

In OpenClaw, use the native browser file-input path:

1. Copy each finished evidence file to a unique path under the configured
   OpenClaw temporary uploads root, such as `/tmp/openclaw/uploads/<file>`, and
   treat that exact copy as run-owned. Alternatively, use managed inbound media
   such as `media://inbound/<id>`. Do not expose an arbitrary local path.
2. Open the main PR body editor, place the insertion point at the exact
   placeholder or stale attachment, then run
   `openclaw browser --browser-profile <profile> snapshot` to resolve the
   visible attachment-trigger ref.
3. Run the atomic chooser path:
   `openclaw browser --browser-profile <profile> upload /tmp/openclaw/uploads/<file> --ref <upload-trigger-ref>`.
   If the snapshot exposes the actual `<input type=file>` instead, use
   `--input-ref <file-input-ref>`. The same modes accept managed inbound media.
4. Wait for the editor to replace the temporary marker with a provider-hosted
   attachment or playable-media reference.
5. Add descriptive alt text or a label, save, and inspect the rendered media
   through the same `--browser-profile <profile>`.
6. Remove each exact run-owned upload-root copy after upload and inspection.
   Cleanup remains required after a failed upload, interruption, blocked state,
   or needs-user stop. Delete neither the original evidence file nor managed
   `media://inbound` assets.

Use the same clipboard-first flow on GitHub, Bitbucket, and other PR editors in
Computer Use or another browser surface with clipboard support:

1. Copy the finished image or recording to the clipboard.
2. Open the main PR body editor.
3. Select the exact placeholder or stale attachment being replaced.
4. Paste once.
5. Wait for the editor to replace the temporary upload marker with a
   provider-hosted attachment or playable-media reference.
6. Add descriptive alt text or a label, save, and inspect the rendered media.

Do not click an attachment control or open a native file picker before trying
clipboard paste. When Browser Use cannot paste that media type, use its
`upload_file` helper on the provider's file input after explicit confirmation.
Require a reviewer-visible provider-hosted reference rather than a local path.

Do not commit proof media to the repository unless the project or user
explicitly requests that storage model.

## Rendered PR Verification

On GitHub, inspect the final server-rendered body without opening a browser:

```sh
PR_HOST='<hostname-resolved-in-step-2>'
REPOSITORY='<owner/repo-resolved-in-step-2>'
PR_NUMBER='<number-resolved-in-step-2>'
gh api --hostname "$PR_HOST" "repos/$REPOSITORY/pulls/$PR_NUMBER" \
  --header 'Accept: application/vnd.github.full+json' \
  --jq '{title, body_html}'
```

Check the title, section order, captions, copyable reproduction steps, and every
expected `<img>` and `<video controls>` element. Fetch each resolved asset URL
with unauthenticated `curl --location`; require `200`, the expected content type,
and non-empty bytes. Never forward the `gh` token to a resolved asset, Camo, or
CDN host. For evidence uploaded during this refresh, also require the fetched
byte size to match its local source. Preserved evidence may not have a run-owned
local source and does not need an exact size match. This proves that GitHub
stored the new bytes, kept preserved assets available, and produced the
expected media markup.

Use an interactive browser for facts the server-rendered HTML cannot prove:

- Mermaid or other client-side rendering;
- literal PR-page layout or pixel appearance;
- actual video playback or another visual interaction the proof claim depends
  on.

Inspect the finished evidence locally before upload. A fetched image or video
has real bytes, but its status and content type alone do not prove the pixels or
frames show the intended behavior. On another provider, use an equivalent
rendered-body API when available and fall back to the browser for unsupported
checks.

## Evidence Contract

Every visual answers these questions in nearby text:

1. What current net-diff behavior does this visibly demonstrate?
2. What starting state, input, action, transition, and outcome appear?
3. What route, fixture, account, environment, viewport, dataset, and capture
   method make it reproducible?
4. What important error, recovery, persistence, or side effect was checked?

Use real output from the current branch. Before means the direct PR base, not a
previous feature-branch commit. Recapture after every related branch change.

## UI Interaction Proof

Record the changed flow manually at a deliberate pace. A reviewer should be able
to follow without scrubbing frame by frame.

- begin before the first relevant action so the starting state is visible;
- move the pointer deliberately and pause after important transitions;
- show the input, loading or transition state, outcome, and relevant recovery;
- exercise changed error, empty, permission, responsive, keyboard, or reduced-
  motion behavior when it is in scope;
- upload screenshots of every distinct changed state at readable size;
- use realistic data and avoid secrets or personal information.

A test runner video, a replay of automated E2E output, or static screenshots
alone do not replace the manual interaction walkthrough.

## Backend and Operator Proof

Show the changed system behavior, not the command that checked it:

- API: representative request, response, and persisted or rejected state;
- worker or queue: input event, processing outcome, and resulting side effect;
- migration: realistic dry run or execution plus changed records and rollback;
- infrastructure: operator action plus resulting resource or runtime state;
- test-only: the running product scenario the test now protects.

Terminal screenshots remain useful when they show the real request and outcome.
A terminal showing only a test, build, validator, or success exit code is not
evidence.

## Performance Proof

Show the experience or system becoming faster, smaller, or more stable:

- capture comparable before/after traces, recordings, charts, or visible timing;
- use the same hardware, environment, dataset, cache state, scenario, and tool;
- report the measurement method and sample size;
- include representative values and variability, not only the best run;
- add a Markdown comparison table beside the visual.

Example:

| Scenario | Base median | PR median | Change | Samples |
| --- | ---: | ---: | ---: | ---: |
| Dashboard ready | 2.4 s | 1.5 s | 37.5% faster | 20 |

## Placement

Put each image and recording directly in the main PR body, never in a table or
detached comment. Place its explanation immediately below it:

```md
<uploaded interaction recording>

**What this shows:** Saving an invalid supplier stops at the form, explains the
phone-number error, and keeps the entered values available for correction.

**State:** Local seeded supplier account; desktop viewport; manual interaction
recorded at deliberate pace on the current PR branch.
```

Use descriptive alt text and labels. Keep reproduction steps copyable. Let
GitHub's checks report routine automated validation.
