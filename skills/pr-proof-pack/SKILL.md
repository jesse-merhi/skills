---
name: pr-proof-pack
description: Create or check concise reviewer-visible PR context and practical proof when an authorized workflow publishes an update or prepares it for merge. Lead with what broke and how it is fixed, use actual product screenshots for static UI changes and recordings for motion or manual interaction, keep technical diagrams as separate system explanations, break down large changes by direct-base +LOC and -LOC, and prefer copyable text for textual behavior.
---

# PR proof pack

Treat this workflow as a delivery and merge-readiness gate. A proof check asks
whether the existing PR still tells the truth. A proof refresh changes the PR
only when that check finds stale or missing evidence.

This skill never grants publication authority. The calling workflow must obtain
that authority before pushing a branch, editing a PR, or uploading evidence.
Local edits, local commits, review findings, and targeted tests stay local and
do not trigger this workflow.

## Trigger branches

- Creating, publishing, reopening, converting, or marking a PR ready: check the
  final proof and refresh it when stale.
- Publishing an authorized branch update: check proof against the final net
  diff; refresh only claims or evidence affected by that update.
- Preparing a PR or stack for merge: require a current proof result even when
  no refresh is needed.
- Creating or updating a stacked PR: scope proof to that layer's direct base,
  state its stack position and adjacent dependencies, and check every affected
  layer separately.

A commit, rebase, or local branch change is not reviewer-visible and does not
trigger proof work. A push triggers a freshness check, not an automatic rewrite.

## Freshness rule

Classify proof as:

- `current`: the existing title, concise opening context, behavior claims,
  reproduction steps, and appropriately formatted practical evidence still
  match the final pushed net diff;
- `stale`: an important behavior, state, viewport, workflow, reproduction step,
  evidence claim, or reader premise changed; a required workflow diagram or
  practical proof is missing; or the evidence format makes the result harder
  to understand than a simpler form;
- `blocked`: freshness or required practical evidence cannot be verified.

Commit count, commit SHA, code churn, and a push by themselves do not make proof
stale. When proof is current, report the no-op decision and leave the PR
untouched.

For a bug fix with reproducible direct-base behavior, proof is stale when the
reviewer cannot compare the broken and fixed outcomes. A screenshot of textual
output is stale when the same result would be clearer as short copyable text.

For a UI change, proof is stale when it lacks actual product evidence for the
changed visual behavior. Static appearance, layout, or rendered-state changes
require actual screenshots, matched against the direct base when that baseline
is meaningful and reproducible. Motion, timing, gesture, or manual interaction
requires a concise recording. A change with both static and interactive claims
requires both forms. An explanatory technical diagram never satisfies practical
UI proof. When rendered diagram or export output is itself the changed product,
capture that actual output as visual proof of its own pixels; it still does not
prove that the system depicted by the diagram ran.

## Hard gates for a refresh

- **Practical evidence:** Exercise the changed behavior working in practice.
  Automated validation remains supporting information and never replaces the
  observed before/after result when the baseline is meaningful and reproducible.
  Without one, show the actual entry point and PR outcome.
- **UI proof:** For an appearance, layout, responsive, or rendered-state claim,
  show actual product pixels. Use matched screenshots when the direct base is
  meaningful and reproducible; otherwise state the constraint and show the
  actual product entry point and outcome. Use a concise edited recording for
  motion, timing, gesture, or manual interaction. Use both forms when both kinds
  of claim changed. For labels, accessibility output, or textual state where
  appearance is not the claim, use copyable text instead. If required capture
  cannot be completed, classify the proof as `blocked`.
- **Workflow explanation:** When the PR introduces or materially changes a
  system or workflow, include one diagram that explains the end-to-end flow to
  a cold reviewer. The diagram explains the change; it never replaces actual
  product screenshots, recordings, or other observed practical evidence.
- **Evidence fit:** Use copyable text for textual inputs, outputs, traces,
  requests, responses, and state. Use visual evidence only when text would lose
  an important fact about appearance, layout, motion, interaction, rendering,
  or playback.
- **Provider-hosted attachments:** When a diagram or visual evidence is selected
  on `github.com`, upload it through the repository command, which uses the
  scoped `gh` credential.
- **Rendered proof:** Check the rendered result headlessly by default. Use an
  interactive browser only when client-side rendering, literal page appearance,
  or playback must be inspected.
- **Readable history:** Review the title and commit subjects before publishing.

If any gate cannot be completed, stop. Tell the human which capability failed
and what they must restore.

## Reviewer boundary

Assume the reviewer has not seen the agent thread, planning notes, decision log,
local branch history, or private chat. Every claim must be understandable from
the direct-base net diff, linked repo-visible context, or the PR body itself.

## Workflow

1. Resolve the skill directory.

   Resolve `<skill-dir>` to the directory containing this `SKILL.md`.

   Done when every relative script and reference path resolves from that
   directory.

2. Resolve the PR and direct base.

   Use read-only provider metadata. On GitHub, inspect
   `gh pr view --json number,url,body,title,baseRefName,headRefName,headRefOid`. For a stack,
   load `gh-stack`, inspect `gh stack view --json`, and record the current
   layer's position and adjacent dependencies.

   Done when the exact PR, provider hostname, final head, direct base, and
   existing proof are known.

3. Gather the current proof and net diff.

   Run `<skill-dir>/scripts/pr-net-diff --markdown`, optionally with narrow file
   paths. Base every claim on the direct-base-to-final-`HEAD` net diff, not the
   latest commit or chat memory. Remove branch-only churn with no net diff from
   consideration. When the PR spans multiple meaningful parts, keep the
   generated `+LOC` and `-LOC` breakdown. Split implementation into clearer
   product areas only when the paths support exact, non-overlapping totals.

   Done when the final behavior and existing reviewer-visible claims can be
   compared, and any claim that the PR is large has a direct-base breakdown
   whose rows reconcile to the total.

4. Make the freshness decision.

   Compare the final behavior, opening problem/fix context, reproduction steps,
   important states, required workflow explanation, verification evidence,
   title, and existing attachments. Check whether each evidence item uses the
   required form for its claim, including actual screenshots for static UI and
   a recording for motion or manual interaction. Do not count a technical
   diagram as practical evidence. Apply the freshness rule above. If proof is
   `current`, report why and stop without any PR mutation.

   Done when the result is `current`, `stale`, or `blocked`, with the affected
   claim or evidence named.

5. Pass the refresh preflight for stale proof.

   For a `github.com` PR, confirm
   `gh auth status --active --hostname github.com`. The upload command in step 9
   resolves and validates the exact PR and repository. Identify whether
   practical capture needs a browser or device and whether the finished body
   requires client-side inspection, such as a Mermaid diagram. When attachment
   upload or rendered-media verification will run, require curl 8.4 or newer so
   download limits apply even when a server omits `Content-Length`; the
   repository commands preflight this and stop with an upgrade instruction. Do
   not make an interactive browser a prerequisite for `github.com` upload or
   ordinary rendered-body checks, and do not require attachment or browser
   capabilities for text-only proof.

   Done when provider authentication and repository access work and every
   browser or device capability genuinely needed later in the refresh is
   available, or the workflow has stopped with a concrete repair request.

6. Capture only the changed practical evidence.

   Read [references/proof-selection.md](references/proof-selection.md).
   Reproduce the changed behavior and replace only evidence made stale by the
   final net diff. Read [references/screenshots.md](references/screenshots.md)
   only when visual evidence is selected; for a recording, also read
   [references/video-editing.md](references/video-editing.md). Preserve current
   evidence that remains useful.

   Done when every changed important behavior has concise reviewer-checkable
   evidence, reproducible bugs have matched broken/fixed outcomes, static UI
   changes have actual screenshots matched to every meaningful reproducible
   baseline, motion or manual interactions have concise recordings, changes
   with both kinds of UI claim have both forms,
   every selected visual has passed model inspection for content and
   presentation, each image has a deliberate rendered size, related visuals
   are grouped when that makes comparison easier, and unchanged useful evidence
   is left alone.

7. Explain a new or changed system or workflow.

   When the final net diff introduces or materially changes a system or
   workflow, load `design-technical-diagrams` and create exactly one diagram by
   default. Treat the PR body as the destination and the direct-base net diff,
   relevant repository context, and changed behavior as the brief. Define the
   one system-flow question the diagram must answer before drawing it. Keep the
   diagram outside practical proof: it cannot occupy a before/after evidence
   slot or replace actual product screenshots or recordings.

   Start from an event or person the reviewer recognizes. Show the real actors
   and systems, their atomic actions in order, important decisions, the
   artifacts or state passed between them, and the final outcome or feedback
   path. Number the primary steps when order matters. Use icons as orientation
   anchors and labels that define necessary project terms in place. Do not turn
   file names, functions, implementation buckets, or several actions hidden in
   one box into the explanation.

   Export a static image sized for the PR body. Follow the diagram skill's
   required whole-frame, destination-size, magnified-detail, and exported-file
   visual passes. A successful render or clean geometry check is not enough.
   Read [references/mermaid.md](references/mermaid.md) if Mermaid is considered
   for a small flow.
   Skip this step when the PR does not introduce or materially change a system
   or workflow.

   Done when a cold reviewer can follow the new or changed workflow from
   trigger to outcome without source-code context, the current rendered pixels
   have passed every visual pass, and the diagram is clearly presented as an
   explanation rather than runtime proof.

8. Draft the smallest accurate PR update.

   Read [references/plain-language.md](references/plain-language.md) and
   [references/body-shape.md](references/body-shape.md). Keep current sections
   that remain true. Draft only the title, body, caption, reproduction, or
   evidence changes needed to restore accuracy. Load `speak-fking-english`
   immediately before saving the complete draft, and tell it the draft is
   reviewer-facing text. Unless the user explicitly invoked that skill for this
   artifact, its compact natural-writing pass applies.

   Done when the first two sentences explain what broke and why it matters, the
   next two explain the fix and outcome, a multi-part or unusually large PR has
   a compact change breakdown, the body reads clearly and naturally, the body
   stays within the default size budget or justifies each exception, and the
   draft is self-contained.

9. Confirm authority and upload provider-hosted attachments.

   Reconfirm that the calling workflow authorizes the PR mutation. Follow
   [references/screenshots.md](references/screenshots.md) when a diagram or
   visual evidence was selected. On `github.com`, run
   `<skill-dir>/scripts/github-upload-attachment --pr <number-or-URL-resolved-in-step-2> <path>`
   for each selected diagram, image, or video. Insert the URL printed only
   after the command has verified the upload. Put media in the main PR body,
   never in a detached comment. Use a table when it makes a small related group
   or comparison easier to scan. Text evidence needs no attachment.

   Done when every selected diagram and visual is provider-hosted and every
   text proof is present in the main body, or the workflow has stopped before
   mutation because authority is absent.

10. Inspect the finished PR headlessly by default.

   Follow the rendered-verification path in
   [references/screenshots.md](references/screenshots.md). On GitHub, inspect
   the title and Markdown body, then run
   `<skill-dir>/scripts/github-verify-rendered-proof --pr <full-PR-URL-resolved-in-step-2> --head <final-head-SHA-resolved-in-step-2>`.
   The verifier reads `body_html` without printing signed asset URLs, checks
   that the PR head stays on the expected final SHA, checks every rendered image
   and video, and fetches each resolved asset without forwarding the `gh` token.
   Require its status, content type, and non-empty byte checks for all assets,
   plus exact byte size for evidence uploaded during this refresh. Use an interactive browser when the body includes client-rendered
   content such as Mermaid or when the proof depends on literal page layout,
   pixel appearance, percentage image sizing, table composition, or playback.
   Remove stale proof rather than accumulating it.

   Done when the rendered PR accurately describes the final pushed net diff,
   with browser inspection completed for every case headless checks cannot
   prove.

11. Hand the result back to the caller.

    Return `current`, `refreshed`, or `blocked`, with the affected PRs. Before
    readiness, human sign-off, or merge, remind the caller to apply the Review
    gate and Sign-off gate from `AGENTS.md` to every PR and exact head.
    Proof-pack does not count as review.

    Done when the caller knows whether proof changed and which PRs still need
    an exact-head review decision or human sign-off.

## Done means

- Every workflow step meets its `Done when` criterion.
- A `current` result made no reviewer-visible mutation.
- A `refreshed` result changed only stale claims and evidence.
- Every affected PR explains the break and fix quickly, then proves final
  direct-base behavior in the simplest format that preserves the claim.
- Reviewer-facing text reads clearly and naturally, and matched proof is
  labeled `Before: direct base` and `After: PR`.
- A multi-part or unusually large PR shows exact direct-base `+LOC` and `-LOC`
  by reviewer-meaningful part, with every file counted once and totals reconciled.
- Textual behavior uses copyable text. Visual behavior uses provider-hosted
  media verified headlessly or, where required, through an interactive browser.
- Static UI changes use actual product screenshots, matched to the direct base
  when that baseline is meaningful and reproducible. Motion, timing, gesture,
  and manual interaction use concise edited recordings. Changes with both
  static and interactive claims include both.
- Every required workflow diagram is provider-hosted and its local export and
  fetched rendered asset both passed visual inspection, but it is presented
  only as explanation and never counted as practical evidence.
- Reproducible bug fixes show matched broken and fixed outcomes.
- A PR that introduces or materially changes a system or workflow includes one
  visually inspected diagram that explains its trigger, ordered actions,
  ownership, handoffs, and outcome without pretending to prove runtime behavior.
- The workflow did not infer publication authority from branch or PR state.
- The caller knows proof does not satisfy the exact-head review gate.
