---
name: cleanup
description: Discover and remove local development artifacts that belong to finished or abandoned work, including worktrees, branches, stashes, processes, watchers, containers, volumes, build outputs, and simulator state. Use when asked to clean up after a task, PR, branch, worktree, or dev environment; not for source-code refactoring or remote resource deletion.
---

# Cleanup

Outcome: remove the complete verified local footprint of the target work while
preserving saved or shared state. Treat ownership evidence, not a matching
keyword, as the deletion boundary.

## Scope and authority

A request to clean up authorizes removal of clearly target-owned, local,
disposable artifacts. It does not authorize deletion of remote branches or
resources, user-authored work, credentials, shared infrastructure, or
machine-wide caches.

Before mutating anything, identify:

- the target repository, worktree, branch or stack, and whether it is merged or
  explicitly abandoned
- exact identity signals such as absolute paths, Git refs, project names,
  Compose labels, process working directories, ports, bundle IDs, and simulator
  or emulator names
- a stable checkout or directory from which cleanup can continue if the target
  worktree disappears

If the target is not clear, infer it from the current task, repository state,
and recent commands. Ask only when multiple live targets remain plausible or a
choice changes what data will be lost.

## Discover the footprint

Limit discovery to categories implicated by the named work. Complete that footprint without expanding into machine-wide housekeeping or adding inventory-verifier agents.

Read repository instructions and cleanup scripts before inventing commands.
Inspect the tools and services the work actually used, then read
[the artifact discovery guide](references/artifact-discovery.md) for the
relevant categories.

Build one inventory with each item classified as:

- **remove**: exact target ownership and disposable state are established
- **keep**: shared, active, reusable, remote, or unrelated
- **decision**: ownership or data value is ambiguous

Use native ownership metadata first: Git worktree records, Compose project
labels, Watchman roots, process working directories, pidfiles, service
manifests, and platform identifiers. A matching substring alone is not proof.

Discovery is complete when every artifact category implied by the repository,
task history, and running tools has been inspected and every found item is
classified. Report the inventory before deletion only when it contains a
decision item or the user asked for a dry run.

## Protect recoverable work

Stop and request a decision before removing:

- uncommitted or untracked files that may be user-authored
- a branch with unique commits that is neither merged nor explicitly abandoned
- a stash that cannot be tied unambiguously to the target
- a volume, database, simulator, emulator, or cache that may contain reusable
  data or serve another checkout
- infrastructure whose ownership is shared or unclear

Prefer ordinary Git deletion after proving ancestry. Force-delete a local
branch only after squash/rebase merge or abandonment is independently
confirmed. Remote deletion remains a separate, explicit action.

## Remove in dependency order

Keep the target worktree available until it has supplied the configuration and
identity evidence needed for cleanup. Then:

1. Stop target-owned processes, dev servers, and task runners gracefully when
   possible.
2. Use each tool's scoped teardown operation for services, containers,
   databases, networks, volumes, watchers, and platform state.
3. Remove target-owned temporary files, logs, sockets, pidfiles, generated
   outputs, and non-shared caches that remain.
4. Remove the Git worktree, matching local branch, target-specific stashes, and
   stale worktree metadata.

Run from the stable location, use exact paths or ownership selectors, and keep
shared services running. Broad commands such as global container pruning,
deleting every Watchman watch, generic `pkill`, shutting down every simulator,
or repository-wide forced `git clean` are outside scoped cleanup.

When the target is the agent's current worktree, finish all reads from it first,
run removal from the stable checkout, and make worktree deletion the final
filesystem mutation. Continue verification only from the stable location.

## Verify and report

Repeat the discovery queries using the same exact identities. Cleanup is
complete when every discovered item is either absent, deliberately retained,
or awaiting an explicit user decision, and the stable checkout is healthy.

Report:

- what was removed
- what was intentionally retained and why
- anything unresolved, including the exact decision needed
- whether remote branches or resources were left untouched
