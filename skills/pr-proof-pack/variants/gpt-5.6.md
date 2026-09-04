---
name: pr-proof-pack
description: Create or check concise reviewer-visible PR context and practical proof when an authorized workflow publishes an update or prepares it for merge. Lead with what broke and how it is fixed, use actual product screenshots for static UI changes and recordings for motion or manual interaction, keep technical diagrams as separate system explanations, break down large changes by direct-base +LOC and -LOC, and prefer copyable text for textual behavior.
---

# PR proof pack

Keep reviewer-visible context and practical proof accurate for the final PR net
diff. Check truth first; refresh only stale claims/evidence. The caller must
authorize publication before pushes, PR edits, or uploads. Local edits/commits,
rebases, findings, and targeted tests do not trigger proof publication.

Check proof when creating/publishing/reopening/converting/marking a PR ready,
publishing an authorized update, or preparing merge. A push triggers a check,
not a rewrite. For stacks use each layer's direct base, position, and adjacent
dependencies and check every affected layer separately.

## Establish freshness

Resolve `<skill-dir>`, provider hostname, exact PR/head/direct base, and existing
proof from read-only metadata. GitHub uses
`gh pr view --json number,url,body,title,baseRefName,headRefName,headRefOid`.
Stacks load `gh-stack` and `gh stack view --json`. Bitbucket Cloud uses
[bitbucket.md](references/bitbucket.md)'s explicit workspace/repo/PR and TWG reads.
Run `<skill-dir>/scripts/pr-net-diff --markdown`, optionally scoped to files.
For Bitbucket pass its resolved destination/source hashes as `--base`/`--head`,
not local checkout guesses. Use direct-base-to-final-head net changes, excluding
branch-only churn. Multi-part/large PRs retain exact non-overlapping `+LOC`/`-LOC`
rows that count each file once and reconcile to totals.

Classify `current` when title, opening context, claims, reproduction, and properly
formatted evidence still match; `stale` when an important premise/behavior/state/
viewport/workflow/reproduction/claim changed, required diagram/proof is missing,
or evidence format obscures what simpler text/media would show; `blocked` when
freshness/proof cannot be verified. Commit count/SHA/churn/push alone is not staleness.
Current means report no-op and leave the PR untouched.

Reproducible direct-base bugs need matched broken/fixed outcomes. Text output
belongs in copyable text, not screenshots. Static UI needs actual product pixels,
matched to meaningful reproducible baselines; motion/timing/gestures/manual
interaction need concise edited recordings; mixed claims need both. When baseline
is unavailable, explain why and show actual entrypoint/outcome. Text-only labels,
accessibility output, and state use text when appearance is not the claim.
Diagrams explain systems, never replace runtime/UI proof. When the changed product
is rendered diagram/export pixels, capture that output as proof only of itself.

## Prepare and capture a needed refresh

For github.com verify `gh auth status --active --hostname github.com`; visual
uploads require gh ≥2.99.0. Rendered-media verification requires curl ≥8.4 for
size limits without Content-Length; the verifier must preflight and stop if missing.
Identify real browser/device needs before writing. Ordinary GitHub upload/body
checks are headless; text proof needs no attachment/browser capability. Bitbucket
uses its reference preflight and live TWG help as final CLI contract; optional
TWG/Atlassian skills may help but are not required. Bitbucket visual readback
requires an interactive browser; text-only does not. Stop with the failed
capability and concrete restoration request if a required gate is unavailable.

Read [proof-selection.md](references/proof-selection.md). Capture only stale
behavior evidence, preserving useful current items. For visuals read
[screenshots.md](references/screenshots.md), and for recordings
[video-editing.md](references/video-editing.md). Inspect selected media for content
and presentation, deliberately size images, and group related comparisons. Label
matched proof `Before: direct base` and `After: PR`. Tests/CI support practical
observed behavior and do not replace it.

For a new/materially changed system or workflow, load `design-technical-diagrams`.
Default to one diagram answering one end-to-end question for a cold PR reader.
Start from a recognizable person/event; show actual actors, ordered atomic
actions, decisions, handoff artifacts/state, and outcome/feedback. Number ordered
steps, use icons for orientation, define terms in labels, and avoid file/function
buckets or multi-action boxes. Export a static PR-sized image and perform whole-
frame, destination-size, magnified-detail, and export visual passes. Read
[mermaid.md](references/mermaid.md) if considering a small Mermaid flow. Keep the
diagram separate from practical before/after evidence and visually inspect its
local export and fetched rendered asset.

## Publish the smallest accurate update

Use [plain-language.md](references/plain-language.md) and
[body-shape.md](references/body-shape.md). A cold reviewer has only net diff,
repo-visible links, and PR body, not private planning/chat. Keep true sections;
change only stale title/body/captions/reproduction/evidence. First two sentences
explain the break and why it matters, next two the fix/outcome. Include the
reconciled multi-part/large breakdown and respect the body budget or justify
exceptions. Review title and commit subjects. Load `speak-fking-english` immediately
before saving the complete reviewer-facing draft; use its compact pass unless
explicitly invoked for this artifact.

Confirm caller authority before mutation. For any diagram or visual evidence,
read [screenshots.md](references/screenshots.md) before upload. For GitHub visuals, include every
selected local image/video reference in the full draft. Immediately reread head
and body; if either differs from the initial snapshot, restart freshness rather
than overwrite concurrent changes. Upload all selected attachments with the body:

```sh
gh pr edit <full-PR-URL-resolved-in-step-2> \
  --body-file <draft-markdown-path> \
  --attach <first-media-path> \
  --attach <second-media-path>
```

Use the resolved full URL; repeat `--attach` as needed. GitHub rewrites matching
local Markdown references to provider URLs. Keep proof in the main body, not
comments. On partial failure use the live body as retry draft, attach only remaining
local references, and never re-upload successes. Before returning blocked remove
broken local refs or restore the last fully hosted body. Bitbucket uses one
`twg bb pull-requests update` with full `--description-file`, each `--image`, and
paired descriptive `--image-name`; images only, not video. Text needs no upload.

## Verify the final rendering and hand back

On GitHub inspect title/Markdown and run:

```sh
<skill-dir>/scripts/github-verify-rendered-proof --pr <full-PR-URL-resolved-in-step-2> --head <final-head-SHA-resolved-in-step-2>
```

Use resolved URL/SHA. Require expected-head stability, every rendered asset's
status/content-type/nonempty bytes, and exact byte size for new uploads. The
verifier reads `body_html` without printing signed URLs and fetches assets without
forwarding the gh token. Use interactive inspection for Mermaid/client rendering,
literal page layout/pixels, percentage sizing, table composition, or playback.
Remove stale evidence instead of accumulating it. Bitbucket rereads full head/
title/body/embeds with TWG, then interactively inspects rendered media pixels;
TWG readback alone is insufficient.

Return `current`, `refreshed`, or `blocked` and affected PRs. Before readiness,
human sign-off, or merge, remind the caller of every layer's exact-head Review
gate and PR-persistent Sign-off gate. Proof is not review. Refreshed means only
stale claims changed and all required practical/rendered proof is verified;
otherwise report the precise capability or evidence blocker.
