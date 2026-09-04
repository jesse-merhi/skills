---
name: pr-review-checkout
description: Review a GitHub PR in VS Code with local diffs, inline comments, navigation, and its worktree preserved.
---

# PR review checkout

Open the PR in its real branch worktree and VS Code's dedicated active-PR view,
with local-backed navigation and inline comment UI. Resolve `<skill-dir>` to
this directory and run from anywhere inside the repo:

```bash
<skill-dir>/scripts/pr-review <pr-number>
```

The helper resolves branch/base, reuses an existing branch worktree, or creates
`.worktrees/pr-<n>` on a unique tracking `agent-pr-review/pr-<n>-<uuid>` branch.
It opens the folder and prints the net diff. Reruns refresh helper-managed
worktrees, including force-pushed PRs, only after ownership-marker validation;
developer worktrees are reused without resets. Never check an in-flight PR branch
out in the main checkout or a second worktree.

Before opening individual diffs, orient a reader with no repo context: changed
product/system area, before/after behavior, necessary terms, entrypoint-to-state-
and-effects flow, contracts/invariants/risky boundaries, and a short file/function
tour with a reason per stop. Order by understanding, follow behavior end to end,
use tests as proof, and leave generated/mechanical files until their purpose is
clear. State uncertainty rather than inventing missing context.

Open **GitHub Pull Request**, not the general GitHub/Octocat activity view.
Under **Changes in Pull Request #<n>**, click the filename to open
`file.ts (Pull Request)`. Its right pane should use the worktree file, supporting
command-click, F12, Shift+F12, IntelliSense, and inline comments. Use **Open File**
only when a plain editor is preferable. A remote preview from the general view
may be locked in Partial Mode and is not this local review surface.

Verify the dedicated heading, `(Pull Request)` tab, modified path in the opened
worktree, owning project/`tsconfig.json` language status without **Partial mode**,
F12 reaching a real `file://` definition, and Shift+F12 returning project references.
For locked/partial files, close and reopen through the dedicated view, confirm
folder and selected Git repo, or open a real file and choose **Open Pull Request
Diff View** to re-anchor.

On repos with many worktrees keep `git.detectWorktrees` unset or `false`; opening
the PR worktree folder is enough and avoids unrelated-repo associations. Preserve
active developer worktrees. Remove only helper-created throwaways using its
printed exact worktree/generated-branch cleanup commands. Never merge or post
PR comments without a separately authorized action; report findings in chat.
