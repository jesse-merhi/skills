---
name: cleanup
description: Discover and remove local development artifacts that belong to finished or abandoned work, including worktrees, branches, stashes, processes, watchers, containers, volumes, build outputs, and simulator state. Use when asked to clean up after a task, PR, branch, worktree, or dev environment; not for source-code refactoring or remote resource deletion.
---

# Cleanup

Remove the complete verified local footprint of finished or abandoned work.
Ownership evidence defines the boundary; matching names alone do not. Preserve
user-authored, saved, shared, reusable, remote, and unrelated state.

## Establish the inventory

Resolve the target repository, worktree, branch/stack, and merged or explicitly
abandoned status from the task and repository evidence. Record exact paths,
refs, project/Compose labels, process working directories, ports, bundle IDs,
and platform identifiers as relevant. Choose a stable checkout or directory
that will remain after removal. Ask only if multiple live targets remain plausible
or a decision changes what data may be lost.

Read repository instructions and existing cleanup scripts, then the relevant
categories in [artifact-discovery.md](references/artifact-discovery.md). Inspect
every category implied by the repo, task history, and running tools. Prefer
native ownership records: Git worktrees, Compose labels, Watchman roots, cwd,
pidfiles, manifests, and platform IDs. Classify each artifact:

- `remove`: exact ownership and disposable state proved;
- `keep`: shared, active, reusable, remote, or unrelated;
- `decision`: uncertain ownership or data value.

Show the inventory before deletion only for a dry run or when a decision is needed.

## Preserve decisions that belong to the user

A cleanup request authorizes clearly target-owned local disposable artifacts.
It excludes remote deletion, user work, credentials, shared infrastructure,
and machine-wide caches. Stop before removing possibly user-authored uncommitted
or untracked files; unique unmerged/unabandoned commits; ambiguously owned stashes;
reusable or shared volumes, databases, simulators, emulators, or caches; or
unclear/shared infrastructure.

Prove ancestry and prefer ordinary local branch deletion. Force deletion needs
independent evidence of squash/rebase merge or abandonment. Remote deletion
requires separate explicit authority.

## Tear down and verify

Keep the worktree until it has supplied all configuration and identity evidence.
From the stable location, use exact paths/selectors in dependency order:

1. Gracefully stop owned processes, dev servers, and task runners.
2. Use scoped native teardown for services, containers, databases, networks,
   volumes, watchers, and platform state.
3. Remove remaining owned temporary files, logs, sockets, pidfiles, generated
   outputs, and non-shared caches.
4. Remove the worktree, matching local branch, target stashes, and stale metadata.

For the current agent worktree, finish reads first and make its deletion the
final filesystem mutation; verify only from the stable location afterward.
Keep shared services running. Global container pruning, all-watch removal,
generic `pkill`, shutting down all simulators, and forced repo-wide `git clean`
are outside this scope.

Repeat discovery using the same exact identities and check the stable checkout.
Account for every item as absent, intentionally retained, or awaiting a user
decision. Report removals, retention reasons, unresolved decisions, and whether
remote branches/resources were left untouched.
