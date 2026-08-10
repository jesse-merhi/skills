# Troubleshooting

## The helper rejects the checkout

Confirm `package.json` exists and its package name is `agent-aquarium`. Pass the
exact checkout or worktree with `--repo`.

## Node or pnpm is unavailable

Agent Aquarium requires Node 24. The helper uses an active Node 24 or resolves
the repository's `.node-version` through `fnm`. Install/activate that runtime
and enable Corepack when neither path is available. Omit `--skip-install` when
the worktree does not yet have `node_modules`.

## Snapshot refresh fails

Run `--empty` to separate snapshot trouble from application startup. Verify the
source paths with `--dry-run`. Source paths must be absolute. The source state
is read-only; repair permissions there rather than weakening helper guards.

## Sessions are missing

Run `--refresh`, then inspect `--status` to confirm Codex and Claude snapshots
were populated. The guarded instance intentionally has no provider credentials
and no access to the ordinary Aquarium tmux socket, so live-control evidence may
be unavailable even when copied sessions are visible.

## Startup times out

Inspect `app.err.log` first, then `app.log`. Check that the selected port is not
occupied and retry without `--skip-install`. The helper stops the failed app
process but preserves its logs.

## Stop leaves a process behind

Run `--stop` again and inspect `--status`. The helper records the supervisor
process and terminates its complete managed child group; unrelated Aquarium,
provider, and tmux processes are outside that group.
