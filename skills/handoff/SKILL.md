---
name: handoff
description: Compact the current conversation into a handoff document for another agent to pick up. Prefer a fresh session/thread for standalone, parallel, background, or aside work; fork only when the next agent truly needs the raw current conversation history.
---

# Handoff

Write a handoff document summarizing the current conversation so a fresh agent
can continue the work. Save it to the temporary directory of the user's OS, not
the current workspace.

Include a "suggested skills" section in the document with the skills the next
agent should invoke.

If the user passed arguments, treat them as a description of what the next
session will focus on and tailor the document accordingly.

## Workflow

1. Write the handoff document first.

   Include the objective, current state, files and commands already touched,
   blockers, validation state, suggested skills, and next concrete steps.
   Reference existing specs, plans, ADRs, issues, commits, diffs, or artifacts by
   path or URL instead of duplicating them. Redact secrets and personally
   identifiable information.

2. Decide whether the next session needs isolation.

   Read [references/worktree-isolation.md](references/worktree-isolation.md)
   before launching any edit, repair, commit, PR, or parallel-worker handoff.
   Done when the handoff says whether the worker is read-only or has a dedicated
   worktree/branch.

3. Choose fresh session vs fork.

   Default to a brand-new Codex session/thread. Read
   [references/codex-session-choice.md](references/codex-session-choice.md)
   before creating a Codex app thread or fork. Done when any fork has a written
   reason that depends on raw inherited conversation history, not convenience.

4. If running under Codex CLI with tmux, choose placement deliberately.

   Read [references/tmux-placement.md](references/tmux-placement.md) before
   running the bundled tmux helper. If `TMUX` is empty, do not run tmux commands.

5. For repair or PR workers, include the repair contract.

   Read [references/repair-pr-handoffs.md](references/repair-pr-handoffs.md).
   Done when the worker is told how to prove the repair, create/update PR proof,
   run review, and report residual risk.

6. Launch only when the user requested a new task or worker. A document-only
   handoff stops after saving and reporting the handoff path.

   When creating a brand-new session outside tmux, seed it with only a concise
   message that links to the handoff document, states the next focus, tells the
   new agent to read the handoff before acting, and names any required
   repo/worktree path. For forks, still link the handoff document.

## Done Means

- The handoff document is saved outside the workspace.
- The document is compact but self-contained enough for a fresh agent to act.
- Suggested skills are named.
- Edit/repair/PR/parallel work has a dedicated worktree unless the user
  explicitly asked to share the checkout.
- Read-only shared-checkout work is labeled read-only.
- Fresh session is used by default; fork is used only for raw-history need.
- tmux commands run only when `TMUX` is set.
- Launch status is reported as started only when a real thread/session/worktree
  is verified; queued setup is reported as pending.

## Avoid

- making parallel workers share the coordinator checkout or each other's
  worktrees;
- forking just because the current checkout has uncommitted changes;
- treating `pendingWorktreeId` as proof that a worker is running;
- pointing a repair agent at discovery artifacts as its implementation
  workspace;
- ending a repair handoff with only "fixed it" or a terse file list;
- pasting secrets, raw environment files, credentials, or unnecessary personal
  data into the handoff.
