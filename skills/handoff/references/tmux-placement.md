# Tmux placement

For Codex CLI, use tmux placement only when this session is running under tmux.
Check `TMUX` and `TMUX_PANE` first:

```sh
printf 'TMUX=%s\nTMUX_PANE=%s\n' "${TMUX:-}" "${TMUX_PANE:-}"
```

If `TMUX` is empty, do not run tmux commands. Write the handoff file and report
the normal Codex session/fork option.

If `TMUX` is set, inspect the tmux context before choosing where the handoff
should open:

```sh
tmux display-message -p -t "${TMUX_PANE:-}" 'current=#{session_name}:#{window_index}:#{window_name} pane=#{pane_id} panes=#{window_panes}'
tmux list-windows -a -F '#{session_name}:#{window_index}:#{window_name}:panes=#{window_panes}:active=#{window_active}'
tmux list-panes -a -F '#{session_name}:#{window_index}.#{pane_index}:#{pane_id}:#{pane_current_command}:#{pane_current_path}:active=#{pane_active}'
```

Choose the placement deliberately:

- Same tmux window pane: use this when the next session is tightly coupled to
  the current work and the current window has room.
- Pane in another tmux window: use this when another existing window is clearly
  the right project/task context. Pass that window or pane target with
  `--tmux-target`.
- New tmux window: use this for standalone features, asides, unrelated follow-up
  work, or when existing windows are busy/ambiguous.

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
session, even if the user has another tmux window active. Still pass a dedicated
worktree for implementation workers:

```sh
~/.codex/skills/handoff/scripts/codex-handoff-tmux \
  --file "$HANDOFF_PATH" \
  --focus "$NEXT_SESSION_FOCUS" \
  --cd "$PWD" \
  --worktree-name "$WORKER_WORKTREE_NAME" \
  --branch "$WORKER_BRANCH" \
  --pane
```

For a pane in another existing tmux window or pane, pass
`--pane --tmux-target "$TARGET"`:

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
