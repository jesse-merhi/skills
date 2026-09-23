---
name: cleanup
description: 'Remove verified, disposable local artifacts from finished or abandoned development work.'
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
