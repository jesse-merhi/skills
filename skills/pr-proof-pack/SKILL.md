---
name: pr-proof-pack
description: Create or refresh reviewer-checkable pull-request proof. Use whenever creating, publishing, reopening, or updating a PR; editing its title or body; pushing commits or changing a branch that already has a PR; or changing any layer of a stacked PR. Requires Computer Use, plain-language metadata, and uploaded visual evidence of the implemented behavior working in practice.
---

# PR Proof Pack

Treat this workflow as a PR publishing gate. Run it before any action that
creates or changes reviewer-visible PR state, and run it again after every
meaningful branch change.

The **proof pack** is the reviewer-checkable story in the PR: what changes for a
person or system, why it matters, and visual evidence a reviewer can inspect
without knowing the agent thread.

## Hard Gates

- **Computer Use:** Load `computer-use` and prove it can inspect and operate an
  agent-owned browser before creating or updating the PR. Use it to upload the
  evidence and inspect the final rendered PR.
  Prefer clipboard paste in the PR editor across GitHub, Bitbucket, and other providers.
  Use an attachment control or native file picker only when paste is unsupported.
  If Computer Use is missing, unavailable, or cannot operate the browser, stop.
  Tell the human exactly what failed and ask them to restore Computer Use before
  continuing. Do not publish or update the PR through another path.
- **Practical visual evidence:** Every PR needs uploaded visual proof of the
  implemented behavior working in practice. Builds, tests, CI, linters,
  type-checkers, coverage, validators, and green checkmarks remain in the check
  run; do not repeat routine pass lists in the PR body.
  They never satisfy `Visual proof`, even as screenshots. UI changes
  require a deliberately paced interaction video plus screenshots of every
  distinct changed state. Backend and infrastructure changes must show the real
  request, state transition, side effect, or operator outcome. Performance
  changes must show a before/after visual and a comparison table under matched
  conditions. If practical capture or upload is blocked, stop before PR
  readiness and ask the human to fix the blocker.
- **Readable history:** PR titles and commit subjects must say the outcome in
  everyday language. Reword unclear local commits before the first push. Never
  rewrite published history without explicit human approval; stop and ask when
  that approval is needed.

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

2. Pass the Computer Use preflight.

   Load `computer-use`. Open an agent-owned browser, reach the repository on its
   PR provider, and confirm the tool can read and operate the page. Do this
   before a publishing workflow creates or mutates a PR. When creating a new
   PR, the publishing workflow may create a draft shell only after this
   preflight.

   Done when Computer Use is demonstrably usable, or the workflow has stopped
   with a concrete repair request to the human.

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
   python3 <skill-dir>/scripts/pr_net_diff.py --markdown
   ```

   For a narrow area:

   ```text
   python3 <skill-dir>/scripts/pr_net_diff.py --markdown src/routes/skills/index.tsx convex/telemetry.ts
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

   Read [references/proof-selection.md](references/proof-selection.md) and
   [references/screenshots.md](references/screenshots.md). Every PR gets uploaded
   evidence of the behavior running in practice. UI work needs a deliberately
   paced interaction recording and state screenshots. Keep explanation support
   out of the evidence decision; the final reader-first pass owns it.

   Done when every important behavior has reviewer-checkable practical
   evidence and the required recordings and screenshots exist locally.

8. Write a behavior-first PR body.

   Read [references/body-shape.md](references/body-shape.md). Draft the title,
   body, and evidence captions around the practical evidence, with reproduction
   steps and observed results as copyable text.

   Load `speak-fking-english` immediately before saving the complete draft.

   Done when `speak-fking-english` returns a self-contained reviewer-facing draft
   and every evidence item still has a specific claim and reproduction context.

9. Upload the evidence with Computer Use.

   Follow the provider upload flow in
   [references/screenshots.md](references/screenshots.md). Copy each finished
   image or recording, select the exact placeholder or stale attachment in the
   PR editor, and paste. Use the provider's attachment control or native file
   picker only when clipboard paste is unsupported. Put media directly in the
   main PR body, never in a table or detached comment. Follow the active
   Computer Use confirmation policy for uploads.

   Done when every image and recording uses a reviewer-visible, provider-hosted
   attachment in the main body. A local path, an unsubmitted attachment, a
   textual rationale, or a screenshot of green checks is not done.

10. Inspect the finished PR with Computer Use.

    Open the rendered PR and check its title, section order, image loading,
    video playback, captions, any diagram rendering, and copyable reproduction
    steps. Fix stale or unclear proof before leaving the page.

    Done when the rendered PR is readable without local context and every visual
    directly supports a current net-diff claim.

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
  provider-hosted practical evidence inspected through Computer Use.
- The caller has the open PR list needed to request human sign-off.
