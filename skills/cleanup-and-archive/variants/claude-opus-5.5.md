---
name: cleanup-and-archive
description: 'Clean up a finished or abandoned session’s local artifacts, then archive that session.'
---

# Cleanup and archive

Invocation authorizes [cleanup](../cleanup/SKILL.md) and archival of the current session, or the one named. Editing this skill doesn't invoke it. Complete this scope without reapproval or unrelated maintenance; ask only for decisions cleanup reserves for the user.

For a dry run, perform only cleanup’s read-only inventory and stop.

1. Verify session, workspace and archive capability from the host’s native context. T3 uses `t3_thread_list`/`t3_thread_read` for thread identity and state.
2. Leave other active work, unanswered questions and queued messages for their owner. T3 exposes questions through `pendingRequestCount` and queued messages through `t3_queue_list`. Stop and verify only owned monitoring/schedules; a session binding alone does not prove ownership. Transfer authorized continuing work.
3. Execute cleanup's inventory, permission and teardown workflow. If unavailable or unsuccessful, report the blocker and leave the session open. Permitted retained artifacts don't block archival; keep evidence outside removed paths.
4. Recheck pending work, then use the native archive tool. In T3, call `t3_thread_organize` and verify `thread.archived: true` through `t3_thread_read`. If app and provider have separate sessions, verify and report each archive result separately. Never simulate archival through transcript deletion or internal databases.
5. Report removed/retained artifacts and confirmed archival, including failures or unresolved decisions. If archiving ends the turn, give cleanup's result first.
