---
name: cleanup-and-archive
description: 'Clean up a finished or abandoned session’s local artifacts, then archive that session.'
hooks:
  Stop:
    - hooks:
        - type: command
          on_failure: continue
          timeout: 10
          command: |
            python3 -c '
            import json, os, pathlib, subprocess, sys, uuid
            payload = sys.stdin.read()
            event = json.loads(payload)
            session = str(uuid.UUID(event["session_id"]))
            if session != event["session_id"]:
                raise ValueError("Expected a canonical session UUID")
            config = pathlib.Path(os.environ.get("CLAUDE_CONFIG_DIR", "~/.claude")).expanduser().resolve()
            helper = config / "session-archive" / session / "finish.py"
            if helper.is_file():
                sys.exit(subprocess.run([sys.executable, str(helper), "finish", session, "--config-dir", str(config)], input=payload, text=True).returncode)
            '
---

# Cleanup and archive

Use the current session unless the user names another. Creating or editing this skill does not invoke it. Invocation authorizes [cleanup](../cleanup/SKILL.md) and archiving the selected session, including graceful automatic exit of the current Claude CLI after its final closeout; finish both without reapproval. Ask for decisions cleanup reserves for the user. Keep progress updates brief if teardown takes time.

1. Identify the session, workspace and current runtime from native context; verify a named other session before touching it. Use `ToolSearch` with `select:mcp__ccd_session_mgmt__get_session,mcp__ccd_session_mgmt__archive_session`, then read the exposed schemas. When available, call `get_session` with `session_id: "self"` for the current session. Desktop tools may be absent in the terminal CLI; a failed search alone does not prove disconnection. Establish whether native archiving owns the final worktree removal. For a local terminal CLI session without these tools, read [Claude CLI archiving](references/claude-cli.md) before cleanup.
2. Read and execute [cleanup](../cleanup/SKILL.md), which owns inventory, permissions, teardown, and verification. If unavailable, stop and report the blocker. A dry run ends after inventory, without cleanup or archiving.
3. Verify cleanup before archiving, leaving any live-worktree removal owned by archiving to the host. Leave the session open on cleanup failure or an unresolved user decision. Retained artifacts permitted by cleanup do not block archiving when the host preserves them. Keep closeout evidence outside directories being removed.
4. Use `mcp__ccd_session_mgmt__archive_session` with `session_id: "self"` for the current session, or a verified Desktop `sessionId` for another; a CLI transcript UUID is not a Desktop session ID. Follow the exposed schema and host approval flow. If unavailable or unsuccessful, report cleanup's actual result and incomplete archiving. For a local terminal CLI session without native archiving, execute the linked CLI helper, arm its Stop hook only after cleanup succeeds, then give the final closeout. Report archiving as queued until the detached worker confirms completion after automatic graceful exit. Never simulate archiving by deleting transcripts or editing internal databases.
5. Report removed and retained artifacts and the confirmed archive result or explicitly queued CLI archive. For the current CLI, the armed Stop hook runs after this final closeout; do not ask the user to run `/exit`. If native archiving ends the turn, give the cleanup closeout first and let the native result confirm archiving.
