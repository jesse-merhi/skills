---
name: pr-proof-pack
description: Create or refresh reviewer-checkable PR proof after every PR or stack change, upload GitHub evidence with token auth, and use a browser only for capture, fallback upload, or client-rendered inspection.
---

# PR Proof Pack

Treat this workflow as a PR publishing gate. Run it before any action that
creates or changes reviewer-visible PR state, and run it again after every
meaningful branch change.

The **proof pack** is the reviewer-checkable story in the PR: what changes for a
person or system, why it matters, and visual evidence a reviewer can inspect
without knowing the agent thread.

## Hard Gates

- **Practical evidence:** Complete the behavior capture in step 7. Automated
  validation remains supporting information and never satisfies `Visual proof`.
- **Provider-hosted attachments:** Complete the upload in step 9. On GitHub, use
  the scoped `gh` credential first and keep interactive browser upload as the
  fallback.
- **Rendered proof:** Complete the headless checks in step 10. Use an interactive
  browser only when client-side rendering, literal page appearance, or playback
  must be inspected.
- **Readable history:** Complete the title and commit review in step 6 before
  publishing.

If any gate cannot be completed, stop. Tell the human which capability failed
and what they must restore. A failed GitHub token upload is not blocked until
the documented interactive-browser fallback has also failed or cannot meet the
requirement.

## Trigger Branches

- Creating, publishing, reopening, converting, or marking a PR ready: run the
  full workflow.
- Editing a PR title, body, base, or reviewer-visible proof: refresh the proof
  before the edit is complete.
- Committing to, rebasing, merging into, or pushing a branch that already has a
  PR: treat it as a PR update and refresh the proof after the branch settles.
- Creating or updating a stacked PR: scope proof to that layer's direct base,
  state its stack position and adjacent dependencies, and run the workflow
  separately for every affected layer.
- Changing a lower stack layer: sync the stack, then refresh every affected
  upstack PR.

## Reviewer Boundary

Assume the reviewer has not seen the agent thread, planning notes, decision log,
local branch history, or private chat.

Every claim must be understandable from at least one of these sources:

- the net diff from the PR's direct base to `HEAD`;
- linked public or repo-visible issues, specs, tickets, or docs;
- the PR body itself.

## Workflow

1. Resolve `<skill-dir>` to the directory containing this `SKILL.md`.

   Done when every relative script and reference path resolves from that
   directory.

2. Pass the publishing preflight.

   On GitHub, confirm `gh auth status`, resolve the repository ID with `gh api`,
   and record the repository name and ID for step 9. Identify whether practical
   capture needs a browser or device and whether the finished body will require
   client-side inspection, such as a Mermaid diagram. Do not make an interactive
   browser a prerequisite for GitHub token upload or ordinary rendered-body
   checks. On another provider, identify its supported attachment path and any
   browser capability that path requires. A publishing workflow may create a
   draft shell after this preflight.

   Done when provider authentication and repository access work and every
   browser or device capability genuinely needed later in the workflow is
   available, or the workflow has stopped with a concrete repair request.

3. Resolve the PR's direct base and stack context.

   On GitHub, use `gh pr view --json number,url,baseRefName,headRefName` when a
   PR exists. On Bitbucket or another provider, use its equivalent read-only
   metadata path.
   When the branch is part of a stack, load `gh-stack` and inspect the ordered
   branches with `gh stack view --json`. Record the current layer's position,
   direct parent PR, and direct child PR when present.

   Done when "base" means the branch directly below this PR, not necessarily
   the repository default branch.

4. Run the bundled net-diff script:

   ```text
   <skill-dir>/scripts/pr-net-diff --markdown
   ```

   For a narrow area:

   ```text
   <skill-dir>/scripts/pr-net-diff --markdown src/routes/skills/index.tsx convex/telemetry.ts
   ```

   Done when the proof is based on the PR base-to-`HEAD` net diff, not the latest
   commit, a previous branch commit, or local session memory.

5. Remove proof for non-current behavior.

   Done when files under `Branch-Only Churn With No Net Diff` are absent from
   claims about current PR behavior.

6. Make the title, commits, body, captions, and labels readable.

   Read [references/plain-language.md](references/plain-language.md). Inspect the
   title and every commit subject in the direct-base range as well as the body.

   Done when each can be understood on its own by a reviewer with the missing
   premise restored, or the workflow has stopped to request approval before a
   necessary published-history rewrite.

7. Choose practical visual proof.

   Read the practical-evidence section of
   [references/proof-selection.md](references/proof-selection.md), then read
   [references/screenshots.md](references/screenshots.md). Capture the behavior
   itself in the form required for that change type.

   Done when every important behavior has reviewer-checkable practical
   evidence and every required recording and screenshot exists locally.

8. Write a behavior-first PR body.

   Read [references/body-shape.md](references/body-shape.md). Draft the title,
   body, and evidence captions around the practical evidence, with reproduction
   steps and observed results as copyable text.

   Load `speak-fking-english` immediately before saving the complete draft.

   Done when `speak-fking-english` returns a self-contained reviewer-facing draft
   and every evidence item still has a specific claim and reproduction context.

9. Upload provider-hosted evidence.

   Follow [references/screenshots.md](references/screenshots.md). On GitHub, try
   its token-authenticated attachment endpoint first with the existing `gh`
   credential, require a `201` response, and verify the returned asset before
   inserting it. If that undocumented endpoint is unavailable or verification
   fails, use the documented interactive-browser fallback. Use the provider's
   supported attachment flow elsewhere. Put media directly in the main PR body,
   never in a table or detached comment.

   Done when every image and recording uses a reviewer-visible, provider-hosted
   attachment in the main body. A local path, an unsubmitted attachment, a
   textual rationale, or a screenshot of green checks is not done.

10. Inspect the finished PR headlessly by default.

    Follow the rendered-verification path in
    [references/screenshots.md](references/screenshots.md). On GitHub, inspect
    `body_html`, confirm the title and section order, require image and video
    elements where expected, and fetch every resolved asset with authentication
    to verify its status, content type, and bytes. Use an interactive browser
    when the body includes client-rendered content such as Mermaid or when the
    proof depends on literal page layout, pixel appearance, or playback. Fix
    stale or unclear proof before finishing.

    Done when the rendered PR is readable without local context and every visual
    directly supports a current net-diff claim, with browser inspection completed
    for every case headless checks cannot prove.

11. Refresh after every branch change.

    Rerun the net diff, practical behavior walkthrough, visual capture and
    upload, any needed diagram validation, language pass, and rendered-page
    inspection.
    Remove stale proof.
    For a stack, sync first and repeat for every affected upstack PR.

    Done when every open PR reflects its current direct-base diff.

12. Hand completed proof back to the publishing or review-closeout workflow.

    Once proof, review, validation, and CI pass, that workflow must ask the user
    for a thumbs-up (`+1`) reaction on every open stack PR and verify each
    reaction belongs to `jesse-merhi`. Never add or remove that reaction on the
    user's behalf.

    Done when the caller has the exact open PRs requiring human sign-off and
    this skill has not changed any reaction.

## Done Means

- Every workflow step meets its `Done when` criterion.
- Every affected PR reflects its current direct-base behavior and contains
  provider-hosted practical evidence verified headlessly or, where required,
  through an interactive browser.
- The caller has the open PR list needed to request human sign-off.
