# Full-session routing

These rules apply to full-session transfers. Mechanical-worker mode selects its
model and return channel before applying any full-task placement rules.
Route two independent decisions: which agent should receive the work, and where
the full session should appear.

## Codex model selection

Invoking this skill authorizes `gpt-6-astra` with `medium` reasoning for a
Codex full-session handoff. Default each unspecified setting independently:
keep an explicit user-selected model or effort, including choices already made
in this task. Apply this policy to Codex destinations from any harness; it does
not select a different destination or change Claude session settings.

Honor higher-priority tool restrictions. If a launcher requires an explicit
user model request and does not accept skill invocation as that request, this
skill cannot supply that authority: report the restriction and request the
missing explicit choice before launching. Do not bypass it through another
launcher or silently inherit a different model.

Check that the selected model and effort are supported by the destination.
If either is unsupported or cannot be set, preserve the handoff document and
report the exact limitation; do not silently switch models or effort.

Pass the settings through the launcher's configuration, not just the handoff
prompt. For the Codex app's `create_thread`, use `model` and `thinking`; for
interactive Codex, use `--model` and `-c 'model_reasoning_effort="medium"'`,
substituting the selected effort. For a bridge, ACPX, or fork, inspect its
supported configuration and ensure the initial turn uses the selected settings.
Record the settings in the handoff document and report the effective model and
effort with launch evidence. Distinguish requested settings from verified ones;
a request or queued task is not proof of the running configuration.

## Surface evidence

Use evidence from the current session in this order:

1. Non-empty `TMUX` and `TMUX_PANE`, plus a successful `tmux display-message`
   against that pane, prove tmux placement.
2. A native app task API, an app session marker such as `CODEX_THREAD_ID`, and
   matching process ancestry prove the current app.
3. Process ancestry under `Claude.app`, `ChatGPT.app`, or `Codex.app` is
   stronger than finding an unrelated process with `pgrep`.
4. A globally running supported app is a fallback only when the current session
   is neither tmux nor an app session.

Do not use the frontmost macOS application as the primary signal. The user may
focus a browser or editor while the agent continues in a different surface.

## Agent launchers

- Codex app: use the harness's native new-task capability. A pending client or
  worktree identifier means setup is queued; verify the real task before
  reporting it started.
- Codex app from another harness: use a tested bridge to the running Codex app
  server's `thread/start` and initial turn methods when one is available.
- Codex CLI: launch a fresh interactive Codex session. Use ACPX for a named
  persistent full session when an interactive terminal is unavailable.
- Claude Code: launch a fresh interactive session, optionally named with
  `--name`. Use `--fork-session` only with an intentional resume. Do not use
  `--bg` or `claude agents` for a handoff.

When the requested surface cannot be created, preserve the handoff document and
report the unsupported launch. Do not change the destination without saying so.
