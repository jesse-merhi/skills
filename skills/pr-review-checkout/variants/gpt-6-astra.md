---
name: pr-review-checkout
description: Review a GitHub PR in VS Code with local diffs, inline comments, navigation, and its worktree preserved.
---

# PR review checkout

Resolve the requested PR through Git and the repository helper, open its real
worktree, and verify VS Code's local-backed review flow. Ordinary checkout and
view choices can be settled from evidence without renewed permission questions.

## Establish the correct worktree

Resolve `<skill-dir>` to this directory and run inside the repository:

```bash
<skill-dir>/scripts/pr-review <pr-number>
```

The helper resolves branch/base, reuses the branch's existing worktree, or creates
`.worktrees/pr-<n>` on a unique tracking `agent-pr-review/pr-<n>-<uuid>` branch.
It opens that folder and shows the net diff. On rerun it refreshes only marker-
verified managed worktrees, including force pushes; developer worktrees remain
unreset. Never check an active PR branch out in main or another worktree.

## Ground the reader and open the actual review view

Before individual diffs, explain the product/system area, before/after behavior,
necessary terms, runtime entrypoint through state/effects, contracts/invariants/
risky boundaries, and a short file/function tour with reasons. Order by understanding,
use tests as behavior proof, defer generated/mechanical files until grounded,
and state uncertainty in missing context.

Use **GitHub Pull Request** in the activity bar, then the filename under
**Changes in Pull Request #<n>**. The `file.ts (Pull Request)` diff's right pane
must be a local worktree file. The general GitHub/Octocat view is discovery and
may open a locked remote Partial Mode preview. **Open File** is for choosing a
plain editor, not replacing the dedicated diff flow.

## Verify navigation and preserve work

Check the heading/tab, modified file path, and language status identifying the
owning project/`tsconfig.json` without **Partial mode**. Prove F12 reaches a real
`file://` definition and Shift+F12 returns project references; local command-click,
IntelliSense, and inline review comments belong to this pane. If locked/partial,
close it, confirm the folder and selected Git repo, and reopen the dedicated view.
A real worktree file's **Open Pull Request Diff View** can re-anchor the extension.

Keep `git.detectWorktrees` unset or `false` in many-worktree repos to avoid unrelated
repo discovery; the PR folder is sufficient. Reuse active worktrees and remove
only helper-created throwaways using its exact printed worktree/branch commands.
Report findings in chat; opening review UI does not authorize merging or posting
comments without a separate explicit request.
