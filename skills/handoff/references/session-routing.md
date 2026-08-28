# Full-session routing

Route two independent decisions: which agent should receive the work, and where
the full session should appear.

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
