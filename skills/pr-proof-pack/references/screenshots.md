# Practical Visual Evidence

## Contents

- [Hard Requirement](#hard-requirement)
- [GitHub Attachment Upload](#github-attachment-upload)
- [Rendered PR Verification](#rendered-pr-verification)
- [Evidence Contract](#evidence-contract)
- [UI Interaction Proof](#ui-interaction-proof)
- [Recording Edit](#recording-edit)
- [Backend and Operator Proof](#backend-and-operator-proof)
- [Performance Proof](#performance-proof)
- [Placement](#placement)

## Hard Requirement

Capture and upload every evidence item selected in `proof-selection.md`. This
file owns how to capture and publish that evidence; `proof-selection.md` owns
what qualifies.

If practical capture, screen recording, provider authentication, attachment
upload, asset verification, or a required visual inspection fails,
stop before completing the PR update. Tell the human the concrete failure and
ask them to restore the blocked capability. Continue only after it works.

## GitHub Attachment Upload

For a PR hosted on exactly `github.com`, upload each image or video with the
repository command:

```sh
<skill-dir>/scripts/github-upload-attachment \
  --pr <full-PR-URL-resolved-in-step-2> \
  <path>
```

The command resolves the exact PR and numeric repository ID, detects the media
type, sends the binary through GitHub's token-authenticated attachment endpoint,
and requires a `201` response with a canonical
`https://github.com/user-attachments/assets/*` URL. It then authenticates only
the initial canonical URL, follows redirects without forwarding credentials to
another host, ignores user curl configuration that could weaken that boundary,
keeps the signed redirect URL out of process arguments, and verifies HTTP
status, HTTP and detected content types, and exact byte size.
It prints only the verified asset URL on success.

The command supports `github.com` PRs only and accepts only image or video
content. If it fails, stop and report its diagnostics. Do not extract or reuse
browser credentials.

Insert images with descriptive alt text. Insert videos as a bare URL on their
own line; image Markdown such as `![](url)` does not produce a working MP4
player. Keep every attachment in the main PR body, never in a table or detached
comment. Do not commit proof media to the repository unless the project or user
explicitly requests that storage model.

## Rendered PR Verification

On GitHub, inspect the final title and Markdown body, then verify the
server-rendered body without opening a browser:

```sh
PR_URL='<full-PR-URL-resolved-in-step-2>'
gh pr view "$PR_URL" --json title,body --jq '{title, body}'
<skill-dir>/scripts/github-verify-rendered-proof --pr "$PR_URL"
```

Check the title, section order, captions, copyable reproduction steps, and every
expected image and video in the Markdown. The repository verifier captures
`body_html` without printing it, reports only media counts, types, and byte
sizes. It keeps signed URLs out of process arguments and fetches every resolved
asset without credentials, curl configuration, or non-HTTPS redirects. Never forward the `gh` token to a resolved asset, Camo, or
CDN host. Never print a resolved signed asset URL. The HTTP and detected content
types must both match the rendered image or video family, which allows GitHub's
safe image subtype normalization. For evidence uploaded during this refresh,
require the reported byte size to match its local source. Preserved evidence may
not have a run-owned local source and does not need an exact size match. This
proves that GitHub stored the new bytes, kept preserved assets available, and
produced the expected media markup.

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
5. What direct-base behavior is the reviewer comparing with the PR result?

Use real output from the current branch. Before means the direct PR base, not a
previous feature-branch commit. Recapture after every related branch change.

## UI Interaction Proof

Record the changed flow manually at a deliberate pace. A reviewer should be able
to follow without scrubbing frame by frame.

- begin before the first relevant action so the starting state is visible;
- move the pointer deliberately and pause after important transitions;
- show the input, loading or transition state, outcome, and relevant recovery;
- record the same scenario on the direct base and PR branch when both have
  comparable visible behavior;
- exercise changed error, empty, permission, responsive, keyboard, or reduced-
  motion behavior when it is in scope;
- add a labeled before/after image only when it makes a static visual difference
  easier to compare or preserves a state that is not legible in the video;
- use realistic data and avoid secrets or personal information.

A test runner video, a replay of automated E2E output, or static screenshots
alone do not replace the manual interaction walkthrough.

## Recording Edit

Follow [video-editing.md](video-editing.md) before upload. Remove inactive
lead-in, setup, and dead stretches; retain a short readable hold on the starting
state, important transitions, and outcome. Keep the actual actions at normal
speed. Preserve real waiting when duration or performance is itself the claim.

Play the finished video once at 1× speed. Done when the flow is easy to follow,
no informative state is rushed, and no long idle interval remains.

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
detached comment. Put the primary video first. Place its explanation immediately
below it:

```md
<uploaded interaction recording>

**What this shows:** Saving an invalid supplier stops at the form, explains the
phone-number error, and keeps the entered values available for correction.

**State:** Local seeded supplier account; desktop viewport; manual interaction
recorded at deliberate pace on the current PR branch.
```

Use descriptive alt text and labels. Keep reproduction steps copyable. Let
GitHub's checks report routine automated validation.
