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
`gh api` and `gh pr edit`. Use it as the default transport for images and video.
The endpoint is undocumented, so treat it as a fast path with the interactive
browser fallback below rather than a guaranteed API.

Confirm the active account and resolve the numeric repository ID:

```sh
gh auth status
REPO_ID=$(gh api repos/<owner>/<repo> --jq '.id')
```

URL-encode the filename and MIME type, then make one binary request. Read the
token only with `gh auth token`; never print it, persist it, or source it from a
browser session.

```sh
(
  set -eu
  REPOSITORY='<owner>/<repo>'
  EVIDENCE_PATH='<path>'
  REPO_ID=$(gh api "repos/$REPOSITORY" --jq '.id')
  MIME_TYPE=$(file --brief --mime-type "$EVIDENCE_PATH")
  NAME=$(jq -rn --arg value "$(basename "$EVIDENCE_PATH")" '$value | @uri')
  CONTENT_TYPE=$(jq -rn --arg value "$MIME_TYPE" '$value | @uri')
  RESPONSE=$(curl --silent --show-error --write-out $'\n%{http_code}' \
    "https://uploads.github.com/user-attachments/assets?name=${NAME}&content_type=${CONTENT_TYPE}&repository_id=${REPO_ID}" \
    --request POST \
    --header 'Content-Type: application/octet-stream' \
    --header 'Accept: application/json' \
    --header 'X-GitHub-Api-Version: 2022-11-28' \
    --header "Authorization: Bearer $(gh auth token)" \
    --data-binary "@$EVIDENCE_PATH")
  STATUS=${RESPONSE##*$'\n'}
  BODY=${RESPONSE%$'\n'*}
  test "$STATUS" = 201
  printf '%s' "$BODY" | jq -er '.url'
)
```

Complete each upload as follows:

1. Accept only a `201` response containing a `github.com/user-attachments/assets`
   URL.
2. Fetch the returned URL with the same `gh` token and require `200`, the
   expected image or video content type, and the original byte size.
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
gh api repos/<owner>/<repo>/pulls/<number> \
  --header 'Accept: application/vnd.github.full+json' \
  --jq '.body_html'
```

Check the title, section order, captions, copyable reproduction steps, and every
expected `<img>` and `<video controls>` element. Fetch each resolved asset URL
with `curl --location` and the active `gh` token; require `200`, the expected
content type, and non-empty bytes matching the uploaded evidence. This proves
that GitHub stored the bytes and produced the expected media markup.

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
