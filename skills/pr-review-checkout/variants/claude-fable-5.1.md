---
name: pr-review-checkout
description: Review a GitHub PR in VS Code with local diffs, inline comments, navigation, and its worktree preserved.
---

# PR review checkout

Set up the named PR for local-backed review in VS Code. Keep work in its dedicated
worktree and verify navigation before saying it works.

1. Resolve `<skill-dir>` to this directory. From inside the repository run:

   ```bash
   <skill-dir>/scripts/pr-review <pr-number>
   ```

   Batch independent PR/worktree/editor reads. Verify unfamiliar current CLI
   behavior with installed help/source. The helper resolves branch/base and
   reuses the branch's worktree or creates `.worktrees/pr-<n>` on a unique tracking
   `agent-pr-review/pr-<n>-<uuid>` branch. It opens the folder and prints the net
   diff. Reruns refresh only ownership-marker-validated managed worktrees,
   including after force pushes; developer worktrees are never reset. Do not
   check an in-flight PR branch out again in main or another worktree.
2. Before individual diffs, give an answer-first orientation for a cold reader:
   product/system area, behavior before/after, needed terms, entrypoint through
   state and effects, contracts/invariants/risky boundaries, and a concise
   file/function tour with a reason per stop. Start with grounding, follow the
   behavior, inspect tests as proof, then explain generated/mechanical changes.
   State unknowns and avoid an inventory of every file.
3. Open the **GitHub Pull Request** activity-bar view, not general GitHub/Octocat.
   Under **Changes in Pull Request #<n>**, click the filename itself. Review
   `file.ts (Pull Request)` with the worktree-backed right pane. Use **Open File**
   only for a plain editor. General-view remote previews can be locked in Partial Mode.
4. Verify the heading and `(Pull Request)` tab; confirm the modified path is in
   the opened worktree and language status names the owning project/`tsconfig.json`,
   not **Partial mode**. Test F12 to a real `file://` definition and Shift+F12
   for project references. Command-click, IntelliSense, and inline comment UI
   should use the same local pane.
5. If locked/partial, close the preview, confirm workspace folder and selected
   Git repo, and reopen through the dedicated view. Opening a real worktree file
   and choosing **Open Pull Request Diff View** can re-anchor the extension.
6. Keep `git.detectWorktrees` unset or `false` on many-worktree repositories;
   the opened worktree folder is sufficient. Preserve active worktrees. If cleanup
   is requested, remove only helper-created throwaways using the printed exact
   worktree and generated-branch commands.

Report meaningful setup changes or blockers. Never merge or post PR comments
on the user's behalf without separate explicit authority; findings belong in chat.
