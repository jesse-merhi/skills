---
name: pr-review-checkout
description: Review a GitHub PR in VS Code with local diffs, inline comments, navigation, and its worktree preserved.
---

# PR review checkout

Deliver the named PR's real worktree in VS Code's active-PR view with verified
local navigation. Keep orientation short and focused on behavior. Setup does
not authorize source edits, another review workflow, merging, or posted comments.

Resolve `<skill-dir>` and run from inside the repo:

```bash
<skill-dir>/scripts/pr-review <pr-number>
```

The helper resolves branch/base, reuses an existing branch worktree, or creates
`.worktrees/pr-<n>` with a unique tracking `agent-pr-review/pr-<n>-<uuid>` branch,
opens the folder, and prints the net diff. Reruns refresh only marker-verified
managed worktrees, including force pushes. Developer worktrees are reused without
reset. Never check an active PR branch out again in main or a second worktree.

Before diffs, orient a reader without repo context: changed system area,
before/after behavior, necessary terms, entrypoint-to-state/effects flow,
contracts/invariants/risky boundaries, and the smallest useful file/function
tour with reasons. Follow behavior, show tests as proof, then generated/mechanical
changes; avoid a complete file inventory and state unsupported context as uncertain.

Open **GitHub Pull Request**, not the general GitHub/Octocat browser. Click the
filename under **Changes in Pull Request #<n>** to open `file.ts (Pull Request)`.
The right pane should be worktree-backed for command-click, F12, Shift+F12,
IntelliSense, and inline comments. Use **Open File** only for a plain editor.
Remote discovery previews may be locked in Partial Mode.

Completion includes the correct heading/tab, modified path in the opened worktree,
project/`tsconfig.json` language status without **Partial mode**, F12 reaching a
real `file://` definition, and Shift+F12 returning project references. For a locked
preview, close it, verify folder/selected Git repo, and use the dedicated view;
a real file's **Open Pull Request Diff View** can re-anchor it. No verifier agent
is needed beyond this actual navigation proof.

Keep `git.detectWorktrees` unset or `false` in repos with many worktrees. Preserve
active worktrees; clean up only helper-created throwaways with its printed exact
worktree/generated-branch commands. Report findings in chat unless a separate
explicit action authorizes posting or merging.
