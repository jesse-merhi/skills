---
name: pr-proof-pack
description: Create or check concise reviewer-visible PR context and practical proof when an authorized workflow publishes an update or prepares it for merge. Lead with what broke and how it is fixed, use actual product screenshots for static UI changes and recordings for motion or manual interaction, keep technical diagrams as separate system explanations, break down large changes by direct-base +LOC and -LOC, and prefer copyable text for textual behavior.
---

# PR proof pack

Resolve proof freshness against the final direct-base net diff and make only
the authorized update needed to restore truth. Existing publication authority
needs no repeat approval question, but this skill creates none. Local edits,
commits, rebases, review findings, and tests remain local.

## Decide whether anything reviewer-visible needs changing

Check on PR creation/publication/reopening/conversion/readiness, authorized
pushed updates, and merge preparation. A push alone calls for a check, not a
rewrite. For stacks use each affected layer's direct base, position, and adjacent
relationships. Resolve `<skill-dir>`, exact provider/PR/head/base and current proof.
GitHub metadata is `gh pr view --json number,url,body,title,baseRefName,headRefName,headRefOid`;
stacks load `gh-stack` and `gh stack view --json`. Bitbucket uses explicit
workspace/repo/PR and read-only TWG inspection in [bitbucket.md](references/bitbucket.md).

Run `<skill-dir>/scripts/pr-net-diff --markdown`, optionally narrowed by paths.
Bitbucket supplies resolved destination/source hashes via `--base`/`--head`,
not local defaults. Exclude branch-only churn and use the final net diff, not
chat memory/latest commit. For multi-part/large work, keep exact nonoverlapping
`+LOC`/`-LOC` rows that count files once and reconcile to the total.

`current` means title/opening context/claims/reproduction/important states and
properly formatted evidence still match. `stale` means an important premise,
behavior/state/viewport/workflow/reproduction/claim changed, required diagram/proof
is absent, or simpler evidence would communicate better. `blocked` means freshness
or required proof cannot be established. SHA, commit count, churn, and push alone
are not reasons to rewrite. Current proof ends with a no-op report and no mutation.

## Prepare the evidence needed for stale claims

For github.com check `gh auth status --active --hostname github.com`. Visual
refresh requires gh ≥2.99.0; rendered-media verification requires curl ≥8.4 for
limits without Content-Length, enforced by the verifier. Resolve real capture
browser/device and client-rendering needs. Do not gate ordinary GitHub uploads/
headless readback on an interactive browser or text-only proof on attachments.
Bitbucket uses its reference preflight and live TWG help; extra TWG/Atlassian
skills are optional. Its visual readback needs an interactive browser, text-only
readback does not. Stop with the concrete restoration request if a required
capability is unavailable.

Use [proof-selection.md](references/proof-selection.md). Capture only stale
behavior, preserving useful current items. Copyable text owns textual inputs,
outputs, traces, requests/responses, and state. Reproducible direct-base bugs need
matched broken/fixed evidence labeled `Before: direct base` / `After: PR`.
Actual screenshots prove static UI; concise edited recordings prove motion,
timing, gestures, and manual interaction; mixed claims need both. Match meaningful
reproducible baselines or explain the constraint and show actual entrypoint/outcome.
Use text for labels/accessibility/state when appearance is not the claim.
Read [screenshots.md](references/screenshots.md) for visuals and
[video-editing.md](references/video-editing.md) for recordings. Inspect every
selected visual, assign deliberate size, and group comparisons where useful.
Tests/CI are supporting evidence, not replacements for observed behavior.

## Explain the workflow separately

For a introduced/materially changed system/workflow, load `design-technical-diagrams`
and define one end-to-end question for a cold PR reader. Default to one diagram:
recognizable trigger, real actors/systems, atomic ordered actions, decisions,
handoff artifacts/state, outcome/feedback. Number ordered steps, use icons for
orientation, define terms, and avoid file/function buckets or multi-action boxes.
Export a static PR-sized image and complete whole-frame, destination-size,
close-detail, and export inspection; use [mermaid.md](references/mermaid.md) if
considering a small flow. The diagram never occupies practical before/after slots.
A changed diagram/export product may prove its own pixels, not the depicted runtime.

## Publish under the existing grant and verify the result

Use [plain-language.md](references/plain-language.md) and
[body-shape.md](references/body-shape.md). The reviewer sees the diff, repo-visible
links, and body, not private history. Preserve true sections and update only
stale title/body/captions/reproduction/evidence. First two sentences explain the
break/importance, next two the fix/outcome; include reconciled breakdown and honor
the body budget or justify exceptions. Review title/commit subjects. Immediately
before saving the complete reviewer-facing draft load `speak-fking-english`,
using its compact pass unless explicitly invoked for this artifact.

Check the caller's existing authority for this exact mutation. Read
[screenshots.md](references/screenshots.md) before uploading any diagram or
visual evidence. For GitHub include
all selected local media references. Immediately reread head/body and restart
freshness if either changed from the initial snapshot. Otherwise use the resolved
full URL in the native coupled update:

```sh
gh pr edit <full-PR-URL-resolved-in-step-2> \
  --body-file <draft-markdown-path> \
  --attach <first-media-path> \
  --attach <second-media-path>
```

Repeat flags for every selected file; GitHub rewrites refs to hosted URLs. Keep
media in the main body, not comments. Partial upload retry uses the live body
and only remaining local refs, never re-uploading successful files. Before blocked
handoff remove broken local refs or restore the last fully hosted body. Bitbucket
uses one `twg bb pull-requests update` with full `--description-file`, each `--image`,
and paired descriptive `--image-name`; images supported, video not. Text needs no upload.

Inspect GitHub title/Markdown and run with the resolved final URL/SHA:

```sh
<skill-dir>/scripts/github-verify-rendered-proof --pr <full-PR-URL-resolved-in-step-2> --head <final-head-SHA-resolved-in-step-2>
```

Require stable expected head, asset status/content-type/nonempty bytes, and exact
size for new uploads. It reads `body_html` without printing signed URLs and fetches
without forwarding gh tokens. Use interactive inspection for client rendering/
Mermaid, literal layout/pixels, percentage sizing, table composition, or playback.
Inspect local diagram export and fetched rendered pixels. Bitbucket uses full
TWG head/title/body/embed readback and interactive visual inspection. Remove stale
proof, do not accumulate it.

Return `current`, `refreshed`, or `blocked` and affected PRs. Required capture/
render failures remain blockers. Remind the caller that each PR needs exact-head
Review and PR-persistent Sign-off gates before readiness/sign-off/merge; proof is
not review. Finish once the required proof is established without additional
unrelated validation or repeat permission rounds.
