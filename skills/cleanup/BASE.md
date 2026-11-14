---
name: cleanup
description: 'Remove verified, disposable local artifacts from finished or abandoned development work, and archive the session when asked.'
---

# Cleanup

Identify the task's checkout, branch, processes, services, and generated files. Prove ownership with exact paths, working directories, labels, or native records—not names alone.

Start with the read-only inventory:

```sh
skill-cleanup-inventory --root <repo> --output <new-file.json>
```

Add `--compose-project <name>` for a known Compose project. Inventory collects evidence, not deletion decisions.

Keep user work, shared services, credentials, reusable databases/caches, and remote resources. Ask before removing uncertain data, uncommitted files, unique commits, or stashes. For squash/rebase merges, verify the actual merge before forcing local branch deletion.

From a directory you will keep, read needed configuration, stop owned processes and services, remove disposable state, then remove the worktree and local branch. Delete the current agent worktree last.

Verify with the same paths and identifiers. Report what was removed, retained, or needs a decision. If the user asks for a dry run, stop after the inventory.

## Artifact discovery

Inspect only categories the task used.

| Area | Useful evidence and commands |
| --- | --- |
| Git | `git status --short --branch`, `git worktree list --porcelain`, `git stash list`, current PR merge state, and branch ancestry |
| Generated files | Repository clean targets and `git clean -ndX` for a preview; inspect ignored files before deletion |
| Processes | `ps -axo pid=,ppid=,command=`, `lsof -nP -iTCP -sTCP:LISTEN`, and `lsof -a -p <pid> -d cwd -Fn` |
| Compose | Project/config labels on containers, networks, and volumes; use the exact project and config for teardown |
| Watchers | Registered roots; use `watchman watch-del <path>` for the owned root |
| Mobile/browser | Bundle/package IDs, device IDs, profile directories, and task-created processes |
| Other services | Repository pidfiles, manifests, lease records, logs, and native status/stop commands |

Use current authoritative state, not a stale remote-tracking ref, as merge proof. Linked worktrees, unique commits, untracked files, and stashes may contain user work.

Use native scoped teardown and verify the same paths, PIDs, ports, refs, or IDs are absent. Inspect volume contents and purpose before `--volumes`. Keep shared devices, caches, databases, profiles, and infrastructure. Avoid machine-wide pruning.

If an artifact returns, find its owner process rather than repeatedly deleting it.

## Archive the session

When asked to clean up and archive the current session, or a named one, finish cleanup and then archive without asking again; ask only for decisions cleanup reserves for the user. For a dry run, stop after the inventory.

1. Verify the session, workspace and archive capability from the host's native context. In T3, use `t3_thread_list` and `t3_thread_read`.
2. Leave other active work, unanswered questions and queued messages for their owner; T3 shows them as `pendingRequestCount` and through `t3_queue_list`. Stop only monitoring and schedules this session owns, since a session binding alone doesn't prove ownership. Transfer authorized continuing work.
3. If cleanup fails, report the blocker and leave the session open. Permitted retained artifacts don't block archival; keep evidence outside removed paths.
4. Recheck pending work, then archive with the native tool. In the Codex app, use `mcp__codex_app__set_thread_archived` with `archived: true`, omitting `threadId` for the current task or passing a verified other task's `threadId` and `hostId`. In T3, call `t3_thread_organize` and verify `thread.archived: true` with `t3_thread_read`. If app and provider have separate sessions, verify and report each. Never simulate archival by deleting transcripts or editing internal databases.
5. Report removed and retained artifacts and the confirmed archive. If archiving ends the turn, give cleanup's result first.
