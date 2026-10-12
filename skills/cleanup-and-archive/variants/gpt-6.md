---
name: cleanup-and-archive
description: 'Clean up a finished or abandoned session’s local artifacts, then archive that session.'
---

# Cleanup and archive

Use the current session unless the user names another. Creating or editing this skill does not invoke it. Invocation authorizes [cleanup](../cleanup/SKILL.md) and archiving the selected session. Resolve routine choices without reapproval; ask for decisions cleanup reserves for the user.

1. Identify the session, workspace and current runtime from native context; verify a named other session before touching it. Discover archive capability in that runtime before cleanup and determine whether it owns the final worktree removal. Local Claude CLI sessions without native archiving use [Claude CLI archiving](references/claude-cli.md).
2. Read and execute [cleanup](../cleanup/SKILL.md), which owns inventory, permissions, teardown, and verification. If unavailable, stop and report the blocker. A dry run ends after inventory, without cleanup or archiving.
3. Verify cleanup before archiving, leaving any live-worktree removal owned by archiving to the host. Leave the session open on cleanup failure or an unresolved user decision. Retained artifacts permitted by cleanup do not block archiving when the host preserves them. Keep closeout evidence outside directories being removed.
4. Use `mcp__codex_app__set_thread_archived` with `archived: true`; omit `threadId` for the current task or pass a verified other task's `threadId` and `hostId`. For a local Claude CLI runtime, use the linked CLI helper instead. If unavailable or unsuccessful, report cleanup's actual result and incomplete archiving. Never simulate archiving by deleting transcripts or editing internal databases.
5. Report removed and retained artifacts and the confirmed archive result or explicitly queued CLI archive. If archiving ends the turn, give the cleanup closeout first and let the native result confirm archiving.
