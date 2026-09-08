---
name: cleanup-and-archive
description: 'Clean up a finished or abandoned session’s local artifacts, then archive that session.'
---

# Cleanup and archive

Use the current session unless the user names another one. A request to create or edit this skill is not a request to run it. Invoking this workflow authorizes cleanup within [cleanup](../cleanup/SKILL.md)'s boundaries and archiving the selected session; finish those actions without asking again or expanding into unrelated maintenance.

1. Establish the session and its local workspace from native session context. If another session is named, resolve its exact identity before touching its artifacts. Discover the host's native archive capability before removing the workspace so a missing capability can be reported early.
2. Read and execute [cleanup](../cleanup/SKILL.md). It owns artifact inventory, removal permissions, teardown order, and verification. If cleanup is unavailable, stop and report the missing dependency. A dry run ends after the inventory, without cleanup or archiving.
3. Finish cleanup verification before archiving. Leave the session open if cleanup failed or a cleanup decision still needs the user. Deliberately retained artifacts permitted by cleanup do not block completion; say what remains and why. Preserve the closeout evidence outside any directory being removed.
4. Archive through the host's native session tool. In Codex, use `mcp__codex_app__set_thread_archived` with `archived: true`; omit `threadId` for the current task, or pass the verified target's `threadId` and `hostId` when targeting another task. Use the exposed tool schema on other hosts. If archiving is unavailable or fails, report cleanup's actual result and leave archiving explicitly incomplete. Do not simulate archiving by deleting transcripts or editing internal session databases.
5. Report what was removed, what was retained, and whether the archive operation succeeded. Claim success only after the native tool confirms it. If the host's archive operation ends the turn, give the cleanup closeout before calling it and let its native result confirm archiving.
