---
name: cleanup-and-archive
description: 'Clean up a finished or abandoned session’s local artifacts, then archive that session.'
---

# Cleanup and archive

Use the current session unless the user names another. Creating or editing this skill does not invoke it. Invocation authorizes [cleanup](../cleanup/SKILL.md) and archiving the selected session; ask only for decisions cleanup reserves for the user.

1. Identify the session and workspace from native context; verify a named other session before touching it. Discover native archive capability before removing the workspace.
2. Read and execute [cleanup](../cleanup/SKILL.md), which owns inventory, permissions, teardown, and verification. If unavailable, stop and report the blocker. A dry run ends after inventory, without cleanup or archiving.
3. Verify cleanup before archiving. Leave the session open on cleanup failure or an unresolved user decision. Retained artifacts permitted by cleanup do not block archiving; report them and keep closeout evidence outside directories being removed.
4. Archive with the native session tool and its exposed schema. If unavailable or unsuccessful, report cleanup's actual result and incomplete archiving. Never simulate archiving by deleting transcripts or editing internal databases.
5. Report removed and retained artifacts and the confirmed archive result. If archiving ends the turn, give the cleanup closeout first and let the native result confirm archiving.
