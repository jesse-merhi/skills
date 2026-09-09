# Temporary Claude lifecycle

The launcher uses `acpx@0.13.1 claude exec` with `CLAUDE_CODE_SKIP_PROMPT_HISTORY=1` scoped to the helper process tree. It leaves the user's environment and existing history unchanged. Python 3 and Unix process inspection (`ps`) are required. Process inspection failure prevents startup.

Each invocation prints a private evidence directory under `${XDG_STATE_HOME:-~/.local/state}/ask-claude/runs/<uuid>`. `ASK_CLAUDE_RUNS_DIR` selects another evidence root. `ASK_AGENT_TIMEOUT_SECONDS` sets the overall deadline, including startup (default 1800 seconds).

The directory contains the input, streamed answer, raw ACP events, stderr, and `run.json`. The record identifies the run, cwd, native IDs returned by `session/new`, recorded process identities, execution outcome and history verification. These files can contain the same sensitive material as the conversation; permissions are private. They are retained for the caller to review, without automatic expiry or deletion.

A separate supervisor watches a pipe from the caller. Cancellation, caller death and timeout trigger bounded process-group termination. It saves received output before final verification. `inspect <run>` repeats the checks; `recover <run>` also stops a group when a recorded process identity still matches. Both reject a run whose supervisor still holds its lock. A reused PID or unrecognized group is never signalled.

An uncatchable supervisor kill, machine failure, escaped process, unreadable state, or interruption before the native ID is returned cannot be reported as verified cleanup. Recover the exact run after interruption; inspect its errors and retain unexpected history for a user decision. The overall deadline also remains active in acpx. A child that deliberately detaches into another process group is outside group teardown; do not use temporary helpers to own ongoing background services.

Verification checks that the owned process group has no running members, that no transcript or subagent transcript directory matches the returned native IDs under the configured Claude projects directory, and that no persisted acpx record references those IDs. Startup with no creation request is recorded as not-created; an unanswered creation request is unknown. An empty ACP list alone is insufficient.

## Native capabilities checked on 2026-09-09

The tested stack was Claude Code 2.1.258, acpx 0.13.1, Claude ACP adapter 0.60.0 and Agent SDK 0.3.215. acpx's adapter dependency range is not an exact adapter pin; the run's ACP initialization evidence records the actual adapter version.

- **Close:** ACP `session/close` releases execution resources. acpx exec closes its client on success/error and cancels/closes on signals. Neither operation deletes native Claude history.
- **Archive:** no archive operation was found for local Claude ACP conversations. Claude's web-session archive UI concerns web sessions.
- **Delete:** the installed Claude adapter advertises `session/delete`, backed by the SDK's exact-session deletion of the transcript and subagent transcript directory. This is destructive, and the launcher does not call it. `claude project purge` deletes broad project state and is unsuitable for helper cleanup.
- **Prevent persistence:** Claude documents `CLAUDE_CODE_SKIP_PROMPT_HISTORY`, CLI `--no-session-persistence`, and SDK `persistSession: false`. The environment setting passes through the current acpx exec path; acpx's SDK option whitelist does not expose `persistSession`.

Sources: [Claude local storage](https://code.claude.com/docs/en/claude-directory), [Claude sessions](https://code.claude.com/docs/en/sessions), [ACP close](https://agentclientprotocol.com/announcements/session-close-stabilized), [Claude ACP adapter](https://github.com/agentclientprotocol/claude-agent-acp), [acpx](https://github.com/openclaw/acpx).
