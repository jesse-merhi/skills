# Tmux placement

A tmux session contains windows; each window contains panes. Keep related work
visually beside its source and separate asides at the window level.

Inspect the current pane and layout:

```sh
tmux display-message -p -t "$TMUX_PANE" 'session=#{session_name} window=#{window_index}:#{window_name} pane=#{pane_id} panes=#{window_panes}'
tmux list-panes -t "$TMUX_PANE" -F '#{pane_id}:#{pane_current_command}:#{pane_current_path}:active=#{pane_active}'
```

## Codex launch settings

Resolve `HANDOFF_MODEL` and `HANDOFF_EFFORT` using
[the handoff skill](../SKILL.md). Prepare the
required worktree first and set `WORKING_DIRECTORY` to it. Set `HANDOFF_PROMPT`
to direct the new session to read the handoff document, with its next focus and
worktree boundaries. Use native tmux launch arguments below: the bundled
`codex-handoff-tmux` helper cannot pass model or reasoning settings.

## Continuation

Open a fresh full session in a new pane in the current window:

```sh
tmux split-window -h -t "$TMUX_PANE" -c "$WORKING_DIRECTORY" \
  codex --model "$HANDOFF_MODEL" \
  -c "model_reasoning_effort=\"$HANDOFF_EFFORT\"" \
  --cd "$WORKING_DIRECTORY" "$HANDOFF_PROMPT"
```

Target `TMUX_PANE`, not whichever tmux window happens to be active elsewhere.
If the window is already too crowded for usable work, open an adjacent named
window in the same tmux session and report the reason.

## Aside

Open a fresh full session in a new window in the current tmux session:

```sh
HANDOFF_TMUX_SESSION=$(tmux display-message -p -t "$TMUX_PANE" '#{session_id}')
tmux new-window -t "$HANDOFF_TMUX_SESSION:" -n "$SHORT_TASK_NAME" -c "$WORKING_DIRECTORY" \
  codex --model "$HANDOFF_MODEL" \
  -c "model_reasoning_effort=\"$HANDOFF_EFFORT\"" \
  --cd "$WORKING_DIRECTORY" "$HANDOFF_PROMPT"
```

Create a new tmux session only when the user asks or the work needs a genuinely
different long-lived environment.
