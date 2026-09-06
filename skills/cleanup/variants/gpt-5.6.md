---
name: cleanup
description: 'Remove verified, disposable local artifacts from finished or abandoned development work.'
---

# Cleanup

Identify the task's checkout, branch, processes, services, and generated files. Ownership must come from exact paths, process working directories, service labels, or other native records—not just similar names.

Start with the read-only inventory:

```sh
skill-cleanup-inventory --root <repo> --output <new-file.json>
```

Add `--compose-project <name>` for a known Compose project. The inventory collects evidence; it does not decide what is safe to delete.

Keep user work, shared services, credentials, reusable databases/caches, and remote resources. Ask before removing uncertain data, uncommitted files, unique commits, or stashes. For squash/rebase merges, verify the actual merge before forcing local branch deletion.

From a directory that will remain, stop owned processes and services, remove their disposable state, then remove the worktree and local branch. Read needed configuration before deleting it. Delete the current agent worktree last.

Verify with the same paths and identifiers. Report what was removed, retained, or needs a decision. A dry run stops at that inventory.

## Artifact discovery

Inspect only categories the task used. Match exact ownership before removing anything.

| Area | Useful evidence and commands |
| --- | --- |
| Git | `git status --short --branch`, `git worktree list --porcelain`, `git stash list`, current PR merge state, and branch ancestry |
| Generated files | Repository clean targets and `git clean -ndX` for a preview; inspect ignored files before deletion |
| Processes | `ps -axo pid=,ppid=,command=`, `lsof -nP -iTCP -sTCP:LISTEN`, and `lsof -a -p <pid> -d cwd -Fn` |
| Compose | Project/config labels on containers, networks, and volumes; use the exact project and config for teardown |
| Watchers | Registered roots; use `watchman watch-del <path>` for the owned root |
| Mobile/browser | Bundle/package IDs, device IDs, profile directories, and task-created processes |
| Other services | Repository pidfiles, manifests, lease records, logs, and native status/stop commands |

A matching name or stale remote-tracking ref is not ownership or merge proof. Inspect current authoritative state. Linked worktrees, unique commits, untracked files, and stashes may contain user work.

Use native scoped teardown, then verify the same paths, PIDs, ports, refs, or IDs are absent. Inspect volume contents/purpose before including `--volumes`. Keep shared devices, caches, databases, profiles, and infrastructure. Avoid machine-wide pruning.

If an artifact returns, find its owner process rather than repeatedly deleting it.
