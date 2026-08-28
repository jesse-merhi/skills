# Tmux placement

A tmux session contains windows; each window contains panes. Keep related work
visually beside its source and separate asides at the window level.

Inspect the current pane and layout:

```sh
tmux display-message -p -t "$TMUX_PANE" 'session=#{session_name} window=#{window_index}:#{window_name} pane=#{pane_id} panes=#{window_panes}'
tmux list-panes -t "$TMUX_PANE" -F '#{pane_id}:#{pane_current_command}:#{pane_current_path}:active=#{pane_active}'
```

## Continuation

Open a fresh full session in a new pane in the current window:

```sh
<handoff-dir>/scripts/codex-handoff-tmux \
  --relationship continuation \
  --file "$HANDOFF_PATH" \
  --focus "$NEXT_SESSION_FOCUS" \
  --cd "$WORKING_DIRECTORY"
```

Target `TMUX_PANE`, not whichever tmux window happens to be active elsewhere.
If the window is already too crowded for usable work, open an adjacent named
window in the same tmux session and report the reason.

## Aside

Open a fresh full session in a new window in the current tmux session:

```sh
<handoff-dir>/scripts/codex-handoff-tmux \
  --relationship aside \
  --window-name "$SHORT_TASK_NAME" \
  --file "$HANDOFF_PATH" \
  --focus "$NEXT_SESSION_FOCUS" \
  --cd "$WORKING_DIRECTORY"
```

Create a new tmux session only when the user asks or the work needs a genuinely
different long-lived environment.
