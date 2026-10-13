---
name: cleanup-and-archive
description: 'Clean up a finished or abandoned session’s local artifacts, then archive that session.'
---

# Cleanup and archive

Invocation authorizes [cleanup](../cleanup/SKILL.md) and archival of the current session, or the one named. Editing this skill doesn't invoke it. Ask only for decisions cleanup reserves for the user.

For a dry run, perform only cleanup’s read-only inventory and stop.

1. Verify session and workspace from native context and discover archive capability before teardown. In T3, resolve `threadId` with context or `t3_thread_list`, then verify project/worktree with `t3_thread_read`.
2. In T3, leave other active runs, unanswered questions (`pendingRequestCount`) and queued messages (`t3_queue_list`) for their owner. Unwatch owned PRs and verify `watching: false`; pause/delete only owned schedules, preserving shared work. Thread binding alone isn't ownership. Transfer authorized continuing work.
3. Execute cleanup's inventory, permission and teardown workflow. If unavailable or unsuccessful, report the blocker and leave the session open. Permitted retained artifacts don't block archival; keep evidence outside removed paths.
4. Recheck pending work, then use the native archive tool. In T3, call `t3_thread_organize` and verify `thread.archived: true` through `t3_thread_read`. Report provider archival separately using its verified identity/result. Never simulate archival through transcript deletion or internal databases.
5. Report removed/retained artifacts and confirmed archival, including failures or unresolved decisions. If archiving ends the turn, give cleanup's result first.
