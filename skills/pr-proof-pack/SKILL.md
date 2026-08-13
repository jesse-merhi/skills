---
name: pr-proof-pack
description: Create or refresh reviewer-checkable pull-request proof. Use whenever creating, publishing, reopening, or updating a PR; editing its title or body; pushing commits or changing a branch that already has a PR; or changing any layer of a stacked PR. Requires Computer Use, plain-language metadata, and uploaded visual evidence for every PR.
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
  evidence and inspect the final rendered PR. If Computer Use is missing,
  unavailable, or cannot operate the browser, stop. Tell the human exactly what
  failed and ask them to restore Computer Use before continuing. Do not publish
  or update the PR through another path.
- **Uploaded visual evidence:** Every PR needs at least one useful screenshot in
  its main body. UI changes need screenshots of every distinct changed state.
  Terminal, backend, infrastructure, documentation, and test-only changes still
  need an uploaded screenshot of focused evidence, such as the command and its
  readable result. If capture or upload is blocked, stop before PR readiness and
  ask the human to fix the blocker.
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

## Reader Contract

Write for a reviewer who has not seen the agent thread, planning notes,
decision log, bug-bash shorthand, local branch history, or private chat.

Back up far enough to supply the missing premise. Lead with the idea in everyday
language, then introduce a technical term only if the reviewer needs it. Use
short sentences, simple words, and one concrete example when it helps. Define
unfamiliar project terms and match the technical detail to the likely reviewer.

Every claim must be understandable from at least one of these sources:

- the net diff from the PR's direct base to `HEAD`;
- linked public or repo-visible issues, specs, tickets, or docs;
- the PR body itself.

## Workflow

1. Resolve `<skill-dir>` to the directory containing this `SKILL.md`.

2. Pass the Computer Use preflight.

   Load `computer-use`. Open an agent-owned browser, reach the repository on
   GitHub, and confirm the tool can read and operate the page. Do this before a
   publishing workflow creates or mutates a PR. When creating a new PR, the
   publishing workflow may create a draft shell only after this preflight.

   Done when Computer Use is demonstrably usable, or the workflow has stopped
   with a concrete repair request to the human.

3. Resolve the PR's direct base and stack context.

   Use `gh pr view --json number,url,baseRefName,headRefName` when a PR exists.
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

7. Choose visual proof and an explanatory diagram.

   Read [references/proof-selection.md](references/proof-selection.md) and
   [references/screenshots.md](references/screenshots.md). Every PR gets uploaded
   screenshot evidence. For a multi-step flow, state transition, decision,
   integration boundary, or interaction among several actors, also read
   [references/mermaid.md](references/mermaid.md) and include a small,
   understandable diagram.

   Done when every important behavior has reviewer-checkable evidence, the
   required screenshot files exist locally, and any complex flow is explained
   visually without making the reviewer decode implementation details.

8. Write a behavior-first PR body.

   Read [references/body-shape.md](references/body-shape.md). Put the new behavior
   first, followed by the smallest useful diagram and visual proof. Keep commands
   and expected results as copyable text as well as screenshot evidence.

   Done when the body tells one self-contained story in plain language and every
   visual has a specific claim and reproduction context.

9. Upload the evidence with Computer Use.

   Follow the GitHub attachment flow in
   [references/screenshots.md](references/screenshots.md). Put each image directly
   in the main PR body, never in a table or a detached comment. Follow the active
   Computer Use confirmation policy for uploads.

   Done when every image uses a reviewer-visible URL in the main body. A local
   path, an unsubmitted attachment, or a textual rationale is not done.

10. Inspect the finished PR with Computer Use.

    Open the rendered PR and check its title, section order, image loading,
    captions, diagram rendering, and copyable verification. Fix stale or unclear
    proof before leaving the page.

    Done when the rendered PR is readable without local context and every visual
    directly supports a current net-diff claim.

11. Refresh after every branch change.

    Rerun the net diff, verification, screenshot capture and upload, diagram
    validation, language pass, and rendered-page inspection. Remove stale proof.
    For a stack, sync first and repeat for every affected upstack PR.

    Done when every open PR reflects its current direct-base diff.

12. Hand completed proof back to the publishing or review-closeout workflow.

    Once proof, review, validation, and CI pass, that workflow must ask the user
    for a thumbs-up (`+1`) reaction on every open stack PR and verify each
    reaction belongs to `jesse-merhi`. Never add or remove that reaction on the
    user's behalf.

## Done Means

- Computer Use uploaded the evidence and inspected the final rendered PR.
- Every PR has useful, reviewer-visible screenshot evidence in its main body;
  non-UI PRs show focused terminal or rendered-output evidence.
- The PR title, commit subjects, body, captions, and diagram labels use everyday
  language and restore the context a new reviewer needs.
- The body describes only current net behavior owned by the PR's direct-base
  layer, not branch-local churn or another stack layer.
- The new behavior appears first in terms of what a person, API consumer,
  operator, or downstream system can observe.
- Every distinct changed UI state is visible, annotated, and reproducible.
- Every multi-step or multi-actor behavior has a small, validated,
  understandable diagram.
- Verification includes copyable text and matching visual evidence.
- The closeout workflow has enough evidence to request human sign-off on every
  ready stack layer.

## Avoid

- creating or updating a PR before the Computer Use preflight passes;
- treating CDP, browser automation, CLI output, or a textual blocker note as a
  substitute for required Computer Use;
- omitting screenshots because a change is backend-only, terminal-based,
  documentation-only, test-only, or "not visual";
- local-only image paths, images in tables, or attachments left in comments;
- raw terminal dumps, tiny terminal text, secrets, tokens, or irrelevant output;
- titles such as "updates", "changes", or ticket IDs that hide the outcome;
- commit subjects that only name files, modules, refactors, or implementation
  mechanics;
- diagrams that use unexplained class names, paths, acronyms, or code identifiers;
- proof that relies on agent-thread context, branch churn, or another stack layer.
