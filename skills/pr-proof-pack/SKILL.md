---
name: pr-proof-pack
description: Create or refresh reviewer-checkable pull-request proof from the direct-base net diff, including stacked-PR layer context, behavioral verification, and PR-visible evidence when relevant.
---

# PR Proof Pack

Use this before creating or updating a PR body, and again after any meaningful
branch change.

The **proof pack** is the reviewer-checkable evidence in the PR body: what
changed, why it matters, and how a reviewer can verify it without knowing the
agent thread.

## Trigger Branches

- Creating a PR or writing a PR body: run the full workflow below.
- Creating or updating a stacked PR: scope proof to that layer's direct base,
  state its stack position and adjacent dependencies, and run the workflow
  separately for every affected layer.
- Updating an existing PR body: rerun the net-diff pass, remove stale proof,
  then refresh only the affected sections.
- Modifying proof, screenshots, Mermaid, API examples, or verification notes:
  recheck that proof against the current net diff before keeping it.
- Changing the branch after proof was written: rerun the net-diff pass and
  refresh any proof whose behavior, UI state, command output, or diagram flow
  may have changed.

## Reader Contract

Write for a reviewer who has not seen the Codex thread, planning notes,
decision log, bug-bash shorthand, local branch history, or private chat context.
Every claim in the PR body must be understandable from at least one of these
sources:

- the net diff from PR base to `HEAD`
- linked public or repo-visible issues, specs, tickets, or docs
- the PR body itself

If a label, task ID, bug-bash code, sprint name, internal nickname, or thread
shorthand matters, either link to a repo-visible source and explain the concrete
behavior in plain language, or omit the shorthand.

## Workflow

1. Resolve `<skill-dir>` to the directory containing this `SKILL.md`.

2. Resolve the PR's direct base and stack context.

   Use `gh pr view --json number,url,baseRefName,headRefName` when a PR exists.
   When the branch is part of a stack, load `gh-stack` and inspect the ordered
   branches with `gh stack view --json`. Record the current layer's position,
   direct parent PR, and direct child PR when present.

   Done when "base" means the branch directly below this PR, not necessarily
   the repository default branch.

3. Run the bundled net-diff script:

   ```text
   python3 <skill-dir>/scripts/pr_net_diff.py --markdown
   ```

   For a narrow area:

   ```text
   python3 <skill-dir>/scripts/pr_net_diff.py --markdown src/routes/skills/index.tsx convex/telemetry.ts
   ```

   Done when the current proof is based on the PR base-to-`HEAD` net diff, not
   the latest commit, previous branch commit, or local session memory.

4. Remove proof for non-current behavior.

   Done when files listed under `Branch-Only Churn With No Net Diff` are not
   described as current PR behavior changes.

5. Choose the smallest proof that explains the net diff.

   Read [references/proof-selection.md](references/proof-selection.md) when
   deciding between screenshots, Mermaid, API examples, before/after tables, or
   no visual proof. Done when each important changed behavior has a proof type
   that a reviewer can check.

6. Write a behavior-first PR body.

   Read [references/body-shape.md](references/body-shape.md) for the PR body
   template, UI and API proof examples, table rules, and verification guidance.
   Done when the body shows the new behavior first, followed by the smallest
   useful proof and reviewer-checkable verification.

7. Add PR-visible screenshots for human-visible UI changes.

   Read [references/screenshots.md](references/screenshots.md) for the required
   screenshot contract, GitHub upload path, annotations, crop rules, and
   before/after rules. When adding attachments, prefer using CDP when available.
   Put each image directly in the main PR body, never inside a table, with its
   annotations and proof information immediately below it. Done when every
   distinct changed UI state has a reviewer-visible screenshot, or a narrow
   no-screenshot rationale or concrete blocker is stated in the PR body.

8. Add Mermaid only when it clarifies behavior.

   Read [references/mermaid.md](references/mermaid.md) before adding diagrams.
   Done when every final `mermaid` fenced block is validated, or Mermaid is
   omitted in favor of a simpler table or text proof.

9. Refresh after branch changes.

   After any new branch change, rerun `pr_net_diff.py --markdown`, remove stale
   proof, update diagrams if the net flow changed, replace screenshots for
   changed UI states, and update verification results.

   For a stack, changing a lower branch can change every branch above it. Use
   `gh-stack` to rebase or sync first, then refresh proof for every affected
   upstack PR.

10. Hand completed proof back to the publishing or review-closeout workflow.

    Before readiness, human sign-off, or merge, that workflow must apply the
    Review gate and Sign-off gate from `AGENTS.md` to every PR and exact head.
    Proof-pack does not count as review.

## Done Means

- The PR body is self-contained for a repository reviewer.
- The body describes only current net PR behavior, not branch-local churn.
- A stacked PR describes only its direct-base layer and names its position and
  adjacent dependencies without repeating the whole stack's implementation.
- The new behavior appears first and is written in terms of what a person, API
  consumer, operator, or downstream system can observe.
- Every human-visible UI change has reviewer-visible screenshots, or an explicit
  blocker or narrow no-screenshot rationale from `references/screenshots.md`.
- Screenshot attachments preferably use CDP when available, and images appear
  directly in the main PR body rather than inside tables.
- Every screenshot has a proof claim, URL/state, viewport, and crop choice.
- Every Mermaid diagram in the final body was validated, or Mermaid was omitted.
- Verification is reviewer-checkable: concrete command, request/response,
  screenshot state, API example, state transition, or CI coverage summary.
- The closeout workflow received this proof and can resolve both `AGENTS.md`
  gates for every ready stack layer.

## Avoid

- relying on context from the Codex thread, bug-bash notes, planning labels, or
  local decision logs;
- describing branch churn as current PR behavior;
- treating the previous branch commit as "before";
- describing lower or higher stack layers as changes owned by the current PR;
- unexplained task IDs, internal shorthand, sprint names, or local-only paths;
- generic net-diff tables that group code areas without explaining behavior;
- images embedded in tables instead of the main PR body with annotations and
  proof information below them;
- proof sections that are only a list of test files;
- missing screenshots for human-visible UI changes without an explicit blocker
  or narrow no-screenshot rationale;
- raw terminal dumps or unwrapped command dumps in the PR body.
