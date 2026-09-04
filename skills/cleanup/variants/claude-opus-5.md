---
name: cleanup
description: Discover and remove local development artifacts that belong to finished or abandoned work, including worktrees, branches, stashes, processes, watchers, containers, volumes, build outputs, and simulator state. Use when asked to clean up after a task, PR, branch, worktree, or dev environment; not for source-code refactoring or remote resource deletion.
---

# Cleanup

Remove the verified disposable local footprint of the named finished or abandoned
work and account for every discovered item. Bound discovery to categories implied
by that work; do not add machine-wide housekeeping or inventory-verifier agents.

Resolve the repository, worktree, branch/stack, merged or explicitly abandoned
status, and a stable directory that will survive deletion. Record exact relevant
paths, refs, project/Compose labels, process cwd, ports, bundle IDs, and platform
identifiers. Use task and repository evidence; ask only if live targets remain
ambiguous or a choice changes data loss.

Read repository cleanup instructions/scripts and relevant
[artifact-discovery.md](references/artifact-discovery.md) categories. Inspect the
whole implicated footprint using native ownership metadata: Git worktrees,
Compose labels, Watchman roots, cwd, pidfiles, manifests, and platform IDs.
Classify each item once as `remove` (proven ownership and disposable), `keep`
(shared, active, reusable, remote, unrelated), or `decision` (uncertain ownership/value).
Present the inventory before deletion only for a dry run or a needed decision.

The request authorizes owned local disposable artifacts, not user work,
credentials, shared infrastructure, machine-wide caches, or remote deletion.
Pause for potentially user-authored uncommitted/untracked files; unique commits
neither merged nor abandoned; ambiguously owned stashes; reusable/shared volumes,
databases, simulators, emulators, or caches; and unclear/shared infrastructure.
Prefer ordinary local branch deletion after ancestry proof. Force deletion
requires independent squash/rebase-merge or abandonment evidence. Remote deletion
needs separate explicit authority.

Keep the target worktree until all identity/configuration reads are done. From
the stable directory, use exact ownership selectors and dependency order:

1. Gracefully stop owned processes, dev servers, and task runners.
2. Use scoped native teardown for services, containers, databases, networks,
   volumes, watchers, and platform state.
3. Remove remaining owned temporary files, logs, sockets, pidfiles, generated
   outputs, and non-shared caches.
4. Remove the worktree, matching local branch, target stashes, and stale metadata.

For the agent's current worktree, deletion is the final filesystem mutation;
continue verification only from the stable location. Keep shared services running.
Global pruning, all-Watchman deletion, generic `pkill`, all-simulator shutdown,
and forced repo-wide `git clean` are outside scope.

Finish with the same exact-identity discovery queries and a healthy stable
checkout. Report removals, retained items and reasons, explicit unresolved
decisions, and whether remote resources stayed untouched. These ownership and
post-removal checks are completion requirements, not optional extra sweeps.
