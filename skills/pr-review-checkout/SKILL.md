---
name: pr-review-checkout
description: Use when the user wants to review a GitHub PR in VS Code with local-backed diffs, inline comments, command-click, go-to-definition, and find-references, while preserving any existing worktree for the PR branch
---

# PR Review Checkout

Open a PR in its branch's real worktree, then review it through VS Code's
dedicated active-pull-request view. This gives the user the PR diff and comment
UI while the modified side remains a local file with full language services.

## Orient a cold reviewer

Before opening individual diffs, give the reviewer a concise, answer-first
orientation that assumes no repository context. Prefer short sections and
bullets over long prose; include only the context needed to begin reviewing.
Do not inventory every changed file.

Cover:

- what part of the product or system is changing
- the relevant behavior before and after the PR
- unfamiliar terms needed to follow the change
- the main runtime flow from entrypoint through state and side effects
- important contracts, invariants, and risky boundaries
- a recommended file-and-function tour, with one short reason for each stop

Order the tour by understanding, not directory or diff order. Start with the
best grounding point, follow the changed behavior end to end, inspect tests as
proof of that behavior, and leave generated or mechanical changes until their
upstream purpose is clear. State uncertainty when the available PR description,
code, or tests do not establish part of the model.

## The review surface

Use the **GitHub Pull Request** activity-bar view for an active, locally checked
out PR:

1. Open **GitHub Pull Request** (the pull-request-shaped icon, not the general
   GitHub/Octocat view).
2. Under **Changes in Pull Request #<n>**, click the filename itself.
3. Review the `file.ts (Pull Request)` diff. The modified/right pane is backed
   by the file in the current worktree, so command-click, F12, Shift+F12,
   IntelliSense, and inline review comments work there.
4. Use the inline **Open File** action only when a plain editor is preferable.

The general GitHub/Octocat view is for discovering PRs, issues, and
notifications. Opening an un-checked-out PR from that browser can produce a
locked virtual document in Partial Mode. Do not mistake that remote preview for
the active PR review surface.

## Worktree setup

Run the helper from anywhere inside the repository:

```bash
~/.claude/skills/pr-review-checkout/scripts/pr-review.sh <pr-number>
```

It resolves the PR branch and base, reuses the branch's existing worktree when
one exists, or creates a dedicated `.worktrees/pr-<n>` worktree otherwise. The
helper lets `gh pr checkout` attach its managed worktree to the PR's named branch
so VS Code can recognize the active pull request, then opens that folder and
prints the PR's net diff summary. Running the helper again refreshes a managed
worktree before opening it, including after the PR branch is force-pushed. This
reset applies only to the helper-owned `.worktrees/pr-<n>` path; an existing
developer worktree is reused without resetting it.

A branch can be checked out in only one worktree. Never check an in-flight PR
branch out in the main repository or a second worktree.

## Verify the local-backed diff

Before claiming navigation works, check all of these:

- The dedicated view heading says **Changes in Pull Request #<n>**.
- The diff tab is named `file (Pull Request)` and its modified path belongs to
  the opened worktree.
- The language status names the owning project or `tsconfig.json`; it does not
  say **Partial mode**.
- F12 from a symbol in the modified pane reaches a real `file://` definition.
- Shift+F12 returns project references.

If a file opens locked or in Partial Mode, close it and return to the dedicated
GitHub Pull Request view. Confirm the current VS Code folder and selected Git
repository are the PR worktree. Opening a real worktree file once and choosing
**Open Pull Request Diff View** can re-anchor the extension to the correct local
repository.

## Worktree detection setting

Keep `git.detectWorktrees` unset or `false` on repositories with many
worktrees. Enabling it can make VS Code discover dozens of unrelated
repositories and associate the PR UI with the wrong checkout. Opening the PR's
worktree as the workspace folder is sufficient.

## Cleanup and safety

- Reuse existing worktrees for PR branches under active development.
- Remove only throwaway review worktrees created by the helper; it prints the
  exact cleanup command.
- Never merge or post PR comments on the user's behalf. Report findings in
  chat unless the user explicitly authorizes a separate action.
