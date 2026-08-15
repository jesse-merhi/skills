---
name: pr-proof-pack
description: Create or check reviewer-visible proof when an authorized workflow is publishing a PR update or preparing a PR for merge. Refresh only when the pushed behavior or existing proof changed; local edits and commits do not trigger publication.
---

# PR Proof Pack

Treat this workflow as a delivery and merge-readiness gate. A proof check asks
whether the existing PR still tells the truth. A proof refresh changes the PR
only when that check finds stale or missing evidence.

This skill never grants publication authority. The calling workflow must obtain
that authority before pushing a branch, editing a PR, or uploading evidence.
Local edits, local commits, review findings, and targeted tests stay local and
do not trigger this workflow.

## Trigger Branches

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

## Freshness Rule

Classify proof as:

- `current`: the existing title, body, behavior claims, reproduction steps, and
  practical evidence still match the final pushed net diff;
- `stale`: an important behavior, state, viewport, workflow, reproduction step,
  or evidence claim changed, or required proof is missing;
- `blocked`: freshness or required practical evidence cannot be verified.

Commit count, commit SHA, code churn, and a push by themselves do not make proof
stale. When proof is current, report the no-op decision and leave the PR
untouched.

For a recordable process, proof is stale when static images are the only primary
evidence or the recording contains avoidable dead time. For a UI change with
comparable direct-base behavior, proof is stale when the before/after comparison
is missing or mismatched.

## Hard Gates For A Refresh

- **Interactive browser:** Pass the preflight before any reviewer-visible PR
  mutation, then use the same path for upload and rendered-page inspection.
- **Practical evidence:** Capture the changed behavior working in practice.
  Use a trimmed recording as primary proof whenever the behavior unfolds over
  time and can be recorded. Automated validation remains supporting information
  and never satisfies `Visual proof`.
- **Readable history:** Review the title and commit subjects before publishing.

If any gate cannot be completed, stop. Tell the human which capability failed
and what they must restore. Do not publish or update the PR through another
path.

## Reviewer Boundary

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
   `gh pr view --json number,url,body,title,baseRefName,headRefName`. For a stack,
   load `gh-stack`, inspect `gh stack view --json`, and record the current
   layer's position and adjacent dependencies.

   Done when the exact PR, final head, direct base, and existing proof are
   known.

3. Build the current proof surface.

   Run `<skill-dir>/scripts/pr-net-diff --markdown`, optionally with narrow file
   paths. Base every claim on the direct-base-to-final-`HEAD` net diff, not the
   latest commit or chat memory. Remove branch-only churn with no net diff from
   consideration.

   Done when the final behavior and existing reviewer-visible claims can be
   compared.

4. Make the freshness decision.

   Compare the final behavior, reproduction steps, important viewports and
   states, verification evidence, title, and existing attachments. Apply the
   freshness rule above. If proof is `current`, report why and stop without any
   PR mutation.

   Done when the result is `current`, `stale`, or `blocked`, with the affected
   claim or evidence named.

5. Pass the interactive-browser preflight for stale proof.

   Select the browser path native to the current harness. In OpenClaw, use its
   browser tool or `openclaw browser`; inspect
   `openclaw browser --json status` and `openclaw browser profiles` when the
   active authenticated profile is unclear. In Claude environments, use this
   order: Prefer Browser Use when available in the human-permitted
   Chrome-family browser, including Chrome or Dia; otherwise load
   `computer-use`. Open the PR and confirm the selected path can read and
   operate the page.

   Done when the selected interactive browser is demonstrably usable, or the
   workflow has stopped with a concrete repair request.

6. Capture only the changed practical evidence.

   Read the practical-evidence section of
   [references/proof-selection.md](references/proof-selection.md), then
   [references/screenshots.md](references/screenshots.md). For any recording,
   also read [references/video-editing.md](references/video-editing.md).
   Reproduce the changed behavior and replace only evidence made stale by the
   final net diff. Preserve current evidence.

   Done when every changed important behavior has concise reviewer-checkable
   evidence, comparable UI behavior has matched base/PR proof, recordings have
   no irrelevant waiting, and unchanged evidence is left alone.

7. Draft the smallest accurate PR update.

   Read [references/plain-language.md](references/plain-language.md) and
   [references/body-shape.md](references/body-shape.md). Keep current sections
   that remain true. Draft only the title, body, caption, reproduction, or
   evidence changes needed to restore accuracy. Load `speak-fking-english`
   immediately before saving the complete draft.

   Done when the draft is self-contained, accurate, and free of performative
   rewrites.

8. Confirm authority and upload evidence.

   Reconfirm that the calling workflow authorizes the PR mutation. Follow the
   provider upload flow in [references/screenshots.md](references/screenshots.md)
   with the selected browser. Put media in the main PR body, never in a detached
   comment or table.

   Done when every changed evidence item is provider-hosted in the main body,
   or the workflow has stopped before mutation because authority is absent.

9. Inspect the finished PR.

   Open the rendered PR and check its title, section order, attachments,
   captions, diagrams, and reproduction steps. Remove stale proof rather than
   accumulating it.

   Done when the rendered PR accurately describes the final pushed net diff.

10. Hand the result back to the caller.

    Return `current`, `refreshed`, or `blocked`, with the affected PRs. Once
    proof, review, validation, and CI pass, the caller applies the thumbs-up
    (`+1`) human sign-off gate without changing reactions on Jesse's behalf.

    Done when the caller knows whether proof changed and which PRs still need
    human sign-off.

## Done Means

- Every workflow step meets its `Done when` criterion.
- A `current` result made no reviewer-visible mutation.
- A `refreshed` result changed only stale claims and evidence.
- Every affected PR describes its final direct-base behavior with practical,
  provider-hosted proof.
- Recordable processes use an edited, natural-speed recording as primary proof;
  matched before/after evidence makes visible UI changes directly comparable.
- The workflow did not infer publication authority from branch or PR state.
