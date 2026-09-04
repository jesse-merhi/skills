---
name: cleanup
description: Discover and remove local development artifacts that belong to finished or abandoned work, including worktrees, branches, stashes, processes, watchers, containers, volumes, build outputs, and simulator state. Use when asked to clean up after a task, PR, branch, worktree, or dev environment; not for source-code refactoring or remote resource deletion.
---

# Cleanup

Complete the target work's local cleanup using proven ownership. Do not infer
ownership from a matching word or broaden the request into machine housekeeping.

1. Resolve the repository, worktree, branch/stack, and merged or explicitly
   abandoned state from the task and repo. Record relevant exact paths, refs,
   project names, Compose labels, process cwd, ports, bundle IDs, and platform
   names. Identify a stable directory from which cleanup can continue after
   the target worktree disappears. Ask only if several live targets remain
   plausible or the choice changes potential data loss.
2. Read repository instructions and cleanup scripts. Inspect used tools and
   read the relevant [artifact-discovery.md](references/artifact-discovery.md)
   categories. Batch independent inventory reads. Inspect every category implied
   by the repository, task history, and running tools before deleting.
3. Classify every item as `remove`, `keep`, or `decision`. Removal needs exact
   target ownership and disposable state. Keep shared, active, reusable, remote,
   and unrelated state. Use native Git, Compose, Watchman, process cwd, pidfile,
   manifest, and platform ownership metadata. Report the inventory before
   deletion for a dry run or when a decision item exists.
4. Stop for a user decision before removing potentially user-authored uncommitted
   or untracked files; unique commits that are neither merged nor abandoned;
   ambiguously owned stashes; reusable/shared volumes, databases, simulators,
   emulators, or caches; or unclear infrastructure. The request does not authorize
   remote resources, credentials, user work, shared infrastructure, or machine-wide
   caches. Prefer ordinary Git deletion after proving ancestry; force-delete a
   local branch only after independently confirming squash/rebase merge or
   abandonment. Remote deletion needs separate explicit authority.
5. Keep the worktree long enough to read its configuration and identity evidence.
   From the stable location, remove in order: gracefully stop owned processes;
   use scoped native teardown for services, containers, databases, networks,
   volumes, watchers, and platform state; remove owned temporary files, logs,
   sockets, pidfiles, outputs, and non-shared caches; then remove the worktree,
   matching local branch, target stashes, and stale metadata.
6. Use exact paths or ownership selectors. Keep shared services running. Do not
   use global container pruning, all-Watchman deletion, generic `pkill`, all-
   simulator shutdown, or forced repository-wide `git clean`. When deleting the
   agent's current worktree, finish all its reads first and make worktree deletion
   the final filesystem mutation. Continue verification from the stable location.
7. Repeat discovery with the same identities and verify the stable checkout is
   healthy. Every item must be absent, deliberately kept, or awaiting a named
   user decision. Report what changed, what was retained and why, unresolved
   decisions, and whether remote branches/resources were left untouched.

During long cleanup, report meaningful changes to the known footprint or blockers.
Finish already-authorized removals and verification without another generic approval.
