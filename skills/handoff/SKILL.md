---
name: handoff
description: Compact the current conversation into a handoff document for another agent to pick up. Prefer a fresh session/thread for standalone, parallel, background, or aside work; fork only when the next agent truly needs the raw current conversation history.
---

Write a handoff document summarising the current conversation so a fresh agent can continue the work. Save it to the temporary directory of the user's OS, not the current workspace.

Include a "suggested skills" section in the document, with the skills the next agent should invoke.

If you are running in Codex and the user wants the handoff to go to another agent or session, choose the session type after writing the handoff document.

Default to a brand-new Codex session/thread. Use a fork only after you can state why raw inherited conversation history is required.

For any handoff that will edit repo files, implement a repair, create a commit,
open a PR, or run as one of several independent workers, default to a dedicated
worktree for that new session. A discovery, monitor, read-only proof, or
summarization session may share the current checkout only when the handoff says
it is read-only. Do not make parallel workers share the coordinator checkout or
each other's worktrees.

## Worktree Isolation

Treat the current working directory as the coordinator's workspace, not the
default worker workspace.

Use a separate git worktree for each worker when:

- the worker may edit files, run implementation slices, repair code, create a
  commit, or open a PR
- multiple handoffs are launched from one coordinator session
- workers own different features, PRDs, review findings, bug fixes, or slices
- deleting or archiving the coordinator session/worktree would break the worker

Use the current checkout only for explicitly read-only discovery, monitoring,
summarization, proof gathering, or when the user explicitly asks the worker to use that
checkout. If the task is ambiguous, assume the worker needs isolation.

For parallel handoffs, give each worker a distinct worktree path and branch. Use
names that match the worker's scope, for example:

```text
../checkout-worker-a        branch work/checkout-worker-a
../billing-api-repair       branch work/billing-api-repair
```

Do not point several agents at `"$PWD"` just because the handoff documents were
created there. Put shared research artifacts, PRDs, notes, and source paths in
the handoff as read-only context; make implementation happen in the worker's
own worktree.

## Codex Session Choice

Use a **brand-new Codex session/thread** when the next work is:

- a standalone feature, aside, follow-up, or exploratory task
- a parallel line of work, subtask, bug bash, monitor run, or background worker
- work that should be scoped by the handoff document rather than inherited chat history
- likely to run autonomously, create evidence, watch another thread, or report status later
- using the current repo or worktree only because files are present there, including
  uncommitted changes

For a brand-new Codex repair/edit/PR session, prefer a dedicated Codex-managed
worktree over the same checkout. In Codex app contexts, create or move the new
thread into a Codex worktree before implementation begins when the app exposes
that capability. If the current task must reference uncommitted discovery
artifacts, put those paths in the handoff and seed prompt; do not make the
repair agent write in the discovery worktree just because the artifacts live
there.

Use a **Codex fork** only when the next agent genuinely needs the raw current
conversation history itself, such as continuing an interrupted debugging or
review turn where the exact prior back-and-forth is part of the state.

Do not fork merely because the current worktree has uncommitted changes. For
that case, create a brand-new thread and put the exact repo/worktree path in the
handoff and initial prompt, telling the new agent to `cd` there before commands.
If a clean project thread cannot see the required files, explain that tradeoff
and ask before committing, stashing, copying, or otherwise changing repo state.

Before using a fork, write down the reason in your working notes and final
report. If the reason is only "same directory", "current files", "parallel
worker", "background session", or "convenience", use a brand-new session
instead.

When creating a brand-new Codex session outside tmux, seed it with only a
concise message that:

- links to the handoff document
- states the next session's focus
- tells the new agent to read the handoff before acting
- names the exact repo/worktree path if it must use a non-default checkout
- says whether the session should work in a dedicated worktree; repair/edit/PR
  and parallel worker handoffs should do so by default
- says not to rely on inherited history
- says not to create, fork, rename, pin, archive, or monitor other Codex threads
  unless thread orchestration is explicitly the delegated task

For forks, still link the handoff document so the next agent has the compact
summary, and make the fork prompt narrowly override any irrelevant inherited
history.

For Codex CLI, use tmux placement only when this session is running under tmux. Check `TMUX` and `TMUX_PANE` first:

```sh
printf 'TMUX=%s\nTMUX_PANE=%s\n' "${TMUX:-}" "${TMUX_PANE:-}"
```

If `TMUX` is empty, do not run tmux commands. Write the handoff file and report the normal Codex session/fork option.

If `TMUX` is set, inspect the tmux context before choosing where the handoff should open:

```sh
tmux display-message -p -t "${TMUX_PANE:-}" 'current=#{session_name}:#{window_index}:#{window_name} pane=#{pane_id} panes=#{window_panes}'
tmux list-windows -a -F '#{session_name}:#{window_index}:#{window_name}:panes=#{window_panes}:active=#{window_active}'
tmux list-panes -a -F '#{session_name}:#{window_index}.#{pane_index}:#{pane_id}:#{pane_current_command}:#{pane_current_path}:active=#{pane_active}'
```

Choose the placement deliberately:

- Same tmux window pane: use this when the next session is tightly coupled to the current work and the current window has room.
- Pane in another tmux window: use this when another existing window is clearly the right project/task context. Pass that window or pane target with `--tmux-target`.
- New tmux window: use this for standalone features, asides, unrelated follow-up work, or when existing windows are busy/ambiguous.

For a new tmux window, run:

```sh
~/.codex/skills/handoff/scripts/codex-handoff-tmux \
  --file "$HANDOFF_PATH" \
  --focus "$NEXT_SESSION_FOCUS" \
  --cd "$PWD" \
  --worktree-name "$WORKER_WORKTREE_NAME" \
  --branch "$WORKER_BRANCH"
```

The helper creates or reuses the dedicated worktree, then opens a new tmux
window running a fresh interactive `codex` session seeded with the handoff path,
focus, and worktree path. The tmux pane/window must start with its current path
set to the worker worktree, not the coordinator checkout. It only opens a window
when `TMUX` is set. If you deliberately need a fork of the latest Codex session,
pass `--mode fork-last`; use that only when the latest saved session is the one
you mean to fork.

For a pane in the current tmux window, pass `--pane`. The helper targets
`TMUX_PANE` by default, so it splits the tmux window that launched this Codex
session, even if the user has another tmux window active. Still pass a
dedicated worktree for implementation workers:

```sh
~/.codex/skills/handoff/scripts/codex-handoff-tmux \
  --file "$HANDOFF_PATH" \
  --focus "$NEXT_SESSION_FOCUS" \
  --cd "$PWD" \
  --worktree-name "$WORKER_WORKTREE_NAME" \
  --branch "$WORKER_BRANCH" \
  --pane
```

For a pane in another existing tmux window or pane, pass `--pane --tmux-target "$TARGET"`:

```sh
~/.codex/skills/handoff/scripts/codex-handoff-tmux \
  --file "$HANDOFF_PATH" \
  --focus "$NEXT_SESSION_FOCUS" \
  --cd "$PWD" \
  --worktree-name "$WORKER_WORKTREE_NAME" \
  --branch "$WORKER_BRANCH" \
  --pane \
  --tmux-target "$TARGET"
```

For explicitly read-only sessions that should share the current checkout, omit
`--worktree-name`/`--worktree` and say in the handoff that the worker must not
edit files. Report the placement and isolation evidence: target window name,
pane count, `pane_current_path`, worker worktree path/branch, or the reason a
read-only worker shared the current path.

For brand-new sessions outside tmux, seed the session with only a concise message that links to the handoff document, states the next session's focus, and tells the new agent to read the handoff before acting. For forks, still link the handoff document so the next agent has the compact summary. Report created sessions using the current Codex app requirements.

## Repair And PR Handoffs

When the next session is expected to fix code:

- create or designate a dedicated worktree for it before launch, unless the user
  explicitly asked to use the current checkout
- tell it that the coordinator checkout is read-only context and must not be
  used for implementation
- include the source evidence paths and current repo path as read-only context,
  but make clear that implementation should happen in the repair worktree
- tell it to load the relevant project, testing, vertical-slice/TDD, and
  proof-pack skills before claiming repair readiness
- tell it to create a branch and draft PR when the repair is complete unless
  the user explicitly requested local-only work
- tell it to run `pr-proof-pack` after the draft PR exists, then run
  `code-review` on the PR or branch until both review phases are clean or
  honestly blocked
- tell it to resolve in-scope review findings, rerun affected validation, and
  refresh `pr-proof-pack` after any review fixes before calling the PR ready
- tell it to keep the PR draft/not-ready when proof-pack, review, validation,
  model, tooling, budget, or consult blockers remain
- require the final report to explain the original bug, root cause, changed
  files, verification commands, proof artifacts, PR URL/status,
  `code-review` result, and any residual risk or follow-up

Do not let a repair handoff end with only "fixed it" or a terse file list. The
handoff should make the next agent produce enough context for the user to decide
whether the PR is worth reviewing without replaying the whole session.

Do not duplicate content already captured in other artifacts such as PRDs, plans, ADRs, issues, commits, or diffs. Reference them by path or URL instead.

Redact any sensitive information, such as API keys, passwords, or personally identifiable information.

If the user passed arguments, treat them as a description of what the next session will focus on and tailor the document accordingly.
