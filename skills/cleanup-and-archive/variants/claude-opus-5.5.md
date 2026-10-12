---
name: cleanup-and-archive
description: 'Clean up a finished or abandoned session’s local artifacts, then archive that session.'
---

# Cleanup and archive

Use the current session unless the user names another. Creating or editing this skill does not invoke it. Invocation authorizes [cleanup](../cleanup/SKILL.md) and archiving the selected session, not unrelated maintenance; finish both without reapproval. Ask only for decisions cleanup reserves for the user.

1. Identify the session, workspace and current runtime from native context; verify a named other session before touching it. Use `ToolSearch` with `select:mcp__ccd_session_mgmt__get_session,mcp__ccd_session_mgmt__archive_session`, then read the exposed schemas. When available, call `get_session` with `session_id: "self"` for the current session. Desktop tools may be absent in the terminal CLI; a failed search alone does not prove disconnection. Establish whether native archiving owns the final worktree removal.
2. Read and execute [cleanup](../cleanup/SKILL.md), which owns inventory, permissions, teardown, and verification. If unavailable, stop and report the blocker. A dry run ends after inventory, without cleanup or archiving.
3. Verify cleanup before archiving, leaving any live-worktree removal owned by archiving to the host. Leave the session open on cleanup failure or an unresolved user decision. Retained artifacts permitted by cleanup do not block archiving when the host preserves them. Keep closeout evidence outside directories being removed.
4. Use `mcp__ccd_session_mgmt__archive_session` with `session_id: "self"` for the current session, or a verified Desktop `sessionId` for another; a CLI transcript UUID is not a Desktop session ID. Follow the exposed schema and host approval flow. If unavailable or unsuccessful, report cleanup's actual result and incomplete archiving. In the terminal CLI, tell the user to run `/desktop`, then `/cleanup-and-archive` in Desktop; `/desktop` transfers the conversation and exits the CLI. If Desktop is unavailable, report that limit and keep the transcript. Never simulate archiving by deleting transcripts or editing internal databases.
5. Report removed and retained artifacts and the confirmed archive result. If archiving ends the turn, give the cleanup closeout first and let the native result confirm archiving.
