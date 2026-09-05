---
name: pr-proof-pack
description: 'Check or refresh PR descriptions and practical evidence during authorized publication or merge preparation.'
---

# PR proof pack

Deliver concise, current reviewer-visible context and practical proof. Start
with a freshness decision and change only stale claims/evidence. Keep both PR
body and handoff proportionate, preserving required capture and rendered readback
without optional reviewers or extra self-check rounds.

Publication authority belongs to the caller. Local edits/commits/rebases,
findings, and tests do not trigger publication. Check proof for PR creation,
publishing, reopening, conversion, readiness, authorized pushed updates, and
merge preparation. A push triggers a check, not automatic rewriting. Each stacked
layer needs its own direct-base proof, position, and adjacent dependencies.

## Read the actual final change

Resolve `<skill-dir>`, provider hostname, exact PR/head/base, and existing proof.
GitHub uses `gh pr view --json number,url,body,title,baseRefName,headRefName,headRefOid`;
stacks load `gh-stack` and inspect `gh stack view --json`. Bitbucket uses
[bitbucket.md](references/bitbucket.md)'s explicit workspace/repo/PR and TWG reads.
Run `<skill-dir>/scripts/pr-net-diff --markdown`, optionally scoped. Supply
Bitbucket's resolved destination/source hashes through `--base`/`--head`.
Use direct-base-to-final-head net changes, excluding branch-only churn. Retain
exact nonoverlapping reviewer-meaningful `+LOC`/`-LOC` rows for large/multi-part
PRs, counting each file once and reconciling totals.

Classify current when title, opening problem/fix context, claims, reproduction,
important states, and evidence format still match; stale when important premises/
behavior/states/viewports/workflow/reproduction/claims changed, required proof/
diagram is missing, or simpler evidence would be clearer; blocked when unverifiable.
Commit count/SHA/churn/push alone does not make evidence stale. A current result
leaves the PR untouched and reports why.

## Capture the necessary proof

For github.com check `gh auth status --active --hostname github.com`; visual
refresh needs gh ≥2.99.0 and rendered-media verification needs curl ≥8.4 for
size limits without Content-Length. Let the verifier enforce its preflight.
Resolve actual capture browser/device and rendered-client needs, not blanket
browser requirements for native uploads/headless checks. Text proof needs no
attachments. Bitbucket follows its reference and live TWG help, with optional
TWG/Atlassian skills; visual readback requires an interactive browser, text does not.
Stop on a required capability failure and state what the human must restore.

Use [proof-selection.md](references/proof-selection.md),
[screenshots.md](references/screenshots.md) for visuals, and
[video-editing.md](references/video-editing.md) for recordings. Capture stale
claims only and retain useful current evidence. Textual input/output/traces/
requests/responses/state stay copyable. Reproducible bugs need matched
`Before: direct base` / `After: PR` outcomes. Static UI needs actual product
screenshots against meaningful reproducible baselines; motion/timing/gestures/
manual interaction need concise edited recordings; mixed claims need both.
Without a meaningful baseline, explain and show actual entrypoint/outcome.
Textual labels/accessibility output use text when pixels are not the claim.
Inspect selected visuals, choose deliberate rendered sizes, and group related
comparisons. Tests/CI support rather than replace real observed behavior.

A new/materially changed system/workflow also needs one explanatory diagram
through `design-technical-diagrams`. Define one cold-reader end-to-end question;
show recognizable trigger, real actors/systems, atomic ordered actions, decisions,
handoff state/artifacts, and outcome/feedback. Number ordered steps, orient with
icons, define terms in labels, and avoid file/function buckets or overloaded
boxes. Export a static PR-sized image and inspect whole frame, destination size,
close detail, and export. Read [mermaid.md](references/mermaid.md) for a small
Mermaid option. Keep explanation separate from practical before/after proof.
A changed diagram product proves its own pixels, never the system it depicts.

## Update once and inspect the published result

Use [plain-language.md](references/plain-language.md) and
[body-shape.md](references/body-shape.md). The reader has no private agent context.
Preserve true sections; draft only necessary title/body/caption/reproduction/
evidence corrections. First two sentences cover break/importance, next two fix/
outcome. Include reconciled breakdown and respect the body budget or justify
exceptions. Review title/commit subjects and run `speak-fking-english` immediately
before saving the complete reviewer-facing draft, using its compact pass unless
explicitly invoked for the artifact.

Confirm existing caller authority. Read [screenshots.md](references/screenshots.md)
before uploading any diagram or visual evidence. For GitHub include all local selected media
refs, then immediately reread head/body; changed values restart freshness instead
of overwriting concurrent work. Use the resolved full URL:

```sh
gh pr edit <full-PR-URL-resolved-in-step-2> \
  --body-file <draft-markdown-path> \
  --attach <first-media-path> \
  --attach <second-media-path>
```

Repeat attachments for every file; keep hosted media in the main body, not detached
comments. Partial failures retry from the live body with only remaining local
refs. Never re-upload successful items, and remove broken refs or restore the
last fully hosted body before blocked handoff. Bitbucket couples full
`--description-file`, each `--image`, and descriptive `--image-name` in one
`twg bb pull-requests update`; images only, no video. Text needs no upload.

Inspect GitHub title/body and run with resolved URL/SHA:

```sh
<skill-dir>/scripts/github-verify-rendered-proof --pr <full-PR-URL-resolved-in-step-2> --head <final-head-SHA-resolved-in-step-2>
```

Require expected-head stability, status/type/nonempty bytes for every rendered
asset, and exact new-upload byte sizes. The verifier reads `body_html` without
printing signed URLs and fetches without forwarding gh tokens. Use interactive
inspection for Mermaid/client content, literal layout/pixels, percentage sizing,
table composition, or playback. The diagram's local export and fetched pixels
both need visual inspection. Bitbucket needs full TWG head/title/body/embed
readback plus interactive rendered-media inspection. Remove stale proof.

Return current/refreshed/blocked with affected PRs and remaining capability limits.
Before readiness, sign-off, or merge remind the caller to apply every layer's
exact-head Review and PR-persistent Sign-off gates. Proof does not count as review.
Completion is accurate net-diff claims and required hosted/rendered practical
evidence, not a polished body with missing proof.
