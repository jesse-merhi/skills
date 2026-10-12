# Claude CLI archiving

Use this path for a local Claude terminal session without native Desktop archive tools. On macOS/Linux, the bundled Python helper moves the selected transcript and its adjacent session directory into a private `session-archive/<UUID>/` directory under `CLAUDE_CONFIG_DIR` (default `~/.claude`). It preserves their bytes, including subagent logs and saved tool output. Restore puts them back before resuming. This is local file archiving; it does not change Desktop's archive state. Other Claude state and Git worktrees stay in place.

Resolve this skill's directory from the loaded `SKILL.md`. Read the helper's `--help`. Get the current CLI UUID from Bash's `CLAUDE_CODE_SESSION_ID`; for another session, verify its full transcript UUID and project. Honor `CLAUDE_CONFIG_DIR`. Do not substitute a Desktop `local_…` ID or infer a CLI UUID from a shortened background-agent ID.

After cleanup succeeds, run:

```sh
python3 <skill-dir>/scripts/claude-session-archive.py archive <UUID> --defer
```

For a stopped session, `status: archived` confirms relocation. For a live session, `status: queued` starts a detached worker that waits for its recorded processes to exit, including final transcript writes. Give the cleanup closeout and tell the user to run `/exit`. Keep any live worktree and branch retained by cleanup; the worker only archives session files. Never kill the Claude process to force completion, resume a queued session elsewhere, or report a queue as a completed archive.

The worker waits up to 24 hours, then records failure without moving the live session. Keep its manifest and log outside directories cleanup removes. Show the concrete archive location and these commands with the resolved helper path and UUID:

```sh
python3 <skill-dir>/scripts/claude-session-archive.py status <UUID>
python3 <skill-dir>/scripts/claude-session-archive.py restore <UUID>
claude --resume <UUID>
```

If the user revokes a queued archive, run the helper's `cancel <UUID>` command. If archiving or restoration fails, report its actual status and preserve both original and archived files; use `restore` to recover any completed moves. Do not delete transcripts, rewrite their contents, or edit native databases. On an unsupported platform, report that limit and use `/desktop` when available.
