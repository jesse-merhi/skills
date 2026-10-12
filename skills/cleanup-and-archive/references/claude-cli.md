# Claude CLI archiving

Use this path for a local Claude terminal session without native Desktop archive tools. On macOS/Linux, the bundled Python helper moves the selected transcript and its adjacent session directory into a private `session-archive/<UUID>/` directory under `CLAUDE_CONFIG_DIR` (default `~/.claude`). It preserves their bytes, including subagent logs and saved tool output. Restore puts them back before resuming. This is local file archiving; it does not change Desktop's archive state. Other Claude state and Git worktrees stay in place.

Resolve this skill's directory from the loaded `SKILL.md`. Read the helper's `--help`. Get the current CLI UUID from Bash's `CLAUDE_CODE_SESSION_ID`; for another session, verify its full transcript UUID and project. Honor `CLAUDE_CONFIG_DIR`. Do not substitute a Desktop `local_…` ID or infer a CLI UUID from a shortened background-agent ID. The Claude profiles register a session-scoped [Stop hook](https://code.claude.com/docs/en/hooks#stop-input) when invoked; verify hooks are available before cleanup. It stays registered across dry runs, clarifications and retries, and requests exit only for an armed queue. This does not change settings files.

After cleanup succeeds, run:

```sh
python3 <skill-dir>/scripts/claude-session-archive.py archive <UUID> --defer --auto-exit
```

Use `--auto-exit` only for the current CLI. For another or already stopped session, omit it and let any live session exit independently. For a stopped session, `status: archived` confirms relocation. For the current live CLI, `status: queued` arms automatic exit and starts a detached worker. Give the final cleanup closeout, stating that graceful exit and archiving will finish automatically. Do not ask the user to run `/exit`.

At Stop, the private helper snapshot verifies the main session, transcript path, empty native background-task and session-cron arrays, live archive worker, and the registered CLI PID in its own process ancestry. It requests SIGTERM once through Claude's graceful shutdown; the worker waits for all known session processes to exit before moving files, including shutdown writes. Keep any live worktree and branch retained by cleanup; the worker only archives session files. Never force-kill a process, signal another session, resume a queued session elsewhere, or report a queue as a completed archive. If hooks or the native task fields are unavailable, or any guard fails, report incomplete automatic exit and keep the session files in place; do not substitute a manual-exit success claim.

The worker waits up to 24 hours, then records failure without moving the live session. Its manifest, log and helper snapshot live in the private archive bundle outside directories cleanup removes. Show the concrete archive location and these commands with that snapshot's path and UUID when queued, or the resolved installed helper path when already archived:

```sh
python3 <helper-path> status <UUID>
python3 <helper-path> restore <UUID>
claude --resume <UUID>
```

If the user revokes a queued archive, run the helper's `cancel <UUID>` command. If archiving or restoration fails, report its actual status and preserve both original and archived files; use `restore` to recover any completed moves. Do not delete transcripts, rewrite their contents, or edit native databases. On an unsupported platform, report that limit and use `/desktop` when available.
