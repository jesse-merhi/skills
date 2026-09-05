---
name: cleanup
description: 'Remove local development artifacts from finished or abandoned work; excludes source refactoring and remote deletion.'
---

# Cleanup

Resolve and remove the complete disposable local footprint of the target work.
Use the task, repository, and ownership metadata to settle routine identity
questions. Ask when multiple live targets remain plausible or a decision changes
what data would be lost.

## Prove the target and its boundary

Identify repository, worktree, branch/stack, and merged or explicitly abandoned
status. Record relevant exact paths, refs, project/Compose labels, process cwd,
ports, bundle IDs, and simulator/emulator identifiers. Establish a stable
checkout or directory that survives cleanup.

Read repository instructions and existing cleanup scripts, then applicable
[artifact-discovery.md](references/artifact-discovery.md) categories. Inspect
every category implicated by task history, repository, and running tools. Native
Git worktree records, Compose labels, Watchman roots, cwd, pidfiles, manifests,
and platform IDs establish ownership; a substring match does not.

Classify all items as removable with proven ownership/disposability, retained
because shared/active/reusable/remote/unrelated, or requiring a user decision.
Only a requested dry run or a decision item calls for an inventory-before-deletion
pause. Already-authorized disposal does not need an added approval gate.

## Preserve saved state and real authority gates

A cleanup request covers clearly owned local disposable artifacts. It does not
cover remote resources, user-authored work, credentials, shared infrastructure,
or machine-wide caches. Stop before deleting potentially user-authored uncommitted
or untracked files, unique unmerged/unabandoned commits, ambiguously owned stashes,
reusable/shared volumes or databases or platform state or caches, and unclear
infrastructure. State the exact user decision needed.

Prefer ordinary local branch deletion after ancestry proof. Independently confirm
squash/rebase merge or abandonment before force deletion. Remote deletion remains
separately authorized.

## Finish the owned teardown

Retain the worktree until configuration and identity reads are complete. Execute
from the stable location using exact paths/selectors: stop owned processes and
task runners gracefully; perform native scoped service/container/database/network/
volume/watcher/platform teardown; remove remaining owned temporary files, logs,
sockets, pidfiles, outputs, and non-shared caches; remove the worktree, matching
local branch, target stashes, and stale metadata.

If this is the agent's current worktree, its deletion must be the last filesystem
mutation after all reads, with verification from the stable location. Preserve
shared services. Broad pruning, all-watch deletion, generic `pkill`, all-simulator
shutdown, and forced repo-wide `git clean` exceed this request.

Repeat the exact-identity discovery queries and confirm the stable checkout is
healthy. Report every item as removed, deliberately retained with reason, or
awaiting a decision, and state whether remote branches/resources stayed untouched.
