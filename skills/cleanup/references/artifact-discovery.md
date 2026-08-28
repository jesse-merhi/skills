# Artifact discovery

Read only the sections implicated by the target repository, task history, and
available tools. Skip categories the work could not have created.

## Establish identities

Derive identities from authoritative state before searching broadly:

- repository root, Git common directory, worktree path, branch/ref, PR number,
  and a normalized feature slug
- configuration-defined service, package, Compose project, namespace, app,
  bundle, scheme, device, and database names
- ports, pidfiles, sockets, log paths, temp paths, and cache paths named by the
  repo or commands used during the task

Record exact values. Treat fuzzy name matches as candidates that still need an
ownership check.

## Git and filesystem

Inspect repository and worktree status, worktree metadata, local branches,
merge ancestry, stashes, submodules, ignored outputs, and temporary directories
created by repository tooling.

Refresh the relevant upstream ref or inspect authoritative PR state before
using merge status to justify deletion. A stale local remote-tracking ref is not
proof that recent work is unmerged or merged.

Useful evidence includes:

```sh
git status --short --branch
git worktree list --porcelain
git stash list --format='%gd %ci %gs'
git merge-base --is-ancestor <branch> <upstream>
git clean -ndX
```

`git clean -ndX` is discovery only. Delete exact generated paths or use a
repository-owned clean task. Do not turn its complete output into a forced clean
without proving every entry disposable.

Check linked worktrees before deleting a branch. Inspect untracked and ignored
files before forcing worktree removal; ignored does not mean valueless.

## Processes, ports, and sessions

Inspect process commands, working directories, listeners, pidfiles, and managed
sessions such as tmux, overmind, foreman, or repository-specific runners.

On macOS or Unix-like systems, useful evidence includes:

```sh
ps -axo pid=,ppid=,command=
lsof -nP -iTCP -sTCP:LISTEN
lsof -a -p <pid> -d cwd -Fn
```

A familiar executable name is insufficient: tie the PID to the target through
its working directory, full command, parent process, pidfile, port assignment,
or service manager. Prefer the service's stop command, then graceful process
termination, and use forced termination only when the scoped process will not
exit.

## Containers and local services

Inspect the orchestrator actually used: Docker Compose, Docker, Podman, local
Kubernetes, database CLIs, or repository scripts. Include stopped containers,
networks, named volumes, sidecars, and project-specific images or build cache
only when the target could have created them.

For Compose, prefer its project and config labels over container names:

```sh
docker compose ls --format json
docker ps -a --filter label=com.docker.compose.project=<project>
docker volume ls --filter label=com.docker.compose.project=<project>
docker network ls --filter label=com.docker.compose.project=<project>
```

When the config still exists, use scoped native teardown such as `docker
compose -p <project> -f <file> down --volumes --remove-orphans`. Inspect volume
purpose before including `--volumes`. If the config is gone, remove resources
by exact labels or IDs after inspecting them.

Preserve gateways, proxies, registries, caches, clusters, and databases shared
by other worktrees.

## Watchers, language tools, and build state

Look for exact registered roots or repository-specific state in tools that were
used, such as Watchman, language servers, package managers, build systems,
direnv, Nix, Bazel, Gradle, Xcode, or test runners.

For Watchman, remove the exact root with `watchman watch-del <path>` and verify
that root is absent from `watchman watch-list`. Keep unrelated roots.

Prefer repository-owned clean targets and tool-native project selectors. A
machine-wide cache is normally shared; remove only a target-specific cache or a
cache the user explicitly included.

## Mobile, simulators, emulators, and browsers

Inspect platform state only when the work used it. Identify apps by bundle or
package ID and devices by stable ID or an established task-specific name.
Consider:

- running and installed iOS Simulator apps, target-created simulators, derived
  data, and dev-client state
- Android emulator instances, installed packages, AVDs, Gradle daemons, and
  target-specific build or app data
- browser profiles, test-user-data directories, downloaded drivers, and local
  browser processes created by UI or E2E tooling

Terminate or uninstall the target app before deleting a target-created device.
Preserve a device, profile, or build cache that is shared or whose origin is
unclear.

## Daemons, cloud emulators, and miscellaneous state

Repository history may reveal additional local artifacts: queues, object-store
emulators, tunnels, local cloud stacks, background agents, launchd services,
credentials helpers, sockets, lockfiles, generated certificates, fixture data,
or temporary directories.

Inspect the exact tool's status and configuration. Remove target-owned runtime
state, but preserve credentials and do not mutate real cloud or remote resources
without a separate explicit request.

## Verification matrix

Verify with the same selectors used during discovery:

| Category | Evidence after cleanup |
| --- | --- |
| Git | worktree/ref/stash absent; stable checkout clean and healthy |
| Processes | exact PIDs exited; target ports no longer listening |
| Containers/services | exact project resources absent; shared services still running |
| Watchers/build tools | exact root or project registration absent |
| Mobile/browser | target app, device, profile, or process absent as intended |
| Filesystem | exact generated/temp paths absent; preserved data still present |

Reappearance usually means an owner process is still active. Find and stop that
owner instead of repeatedly deleting the regenerated artifact.
