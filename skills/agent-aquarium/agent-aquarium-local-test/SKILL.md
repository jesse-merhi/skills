---
name: agent-aquarium-local-test
description: Start, inspect, refresh, and stop a guarded local Agent Aquarium manual-test instance from a checkout or worktree. Use for Aquarium feature validation, branch comparison, session-discovery checks, queue/archive testing, kingfisher testing, or any request for a ready-to-test local Aquarium URL with isolated SQLite and credential-free provider-state snapshots.
---

# Agent Aquarium Local Test

Give the user a ready-to-test Agent Aquarium instance whose mutations stay
inside managed test state. The default is fast, empty, and isolated.
Production-like Aquarium and provider state are explicit snapshot levels.

## Workflow

1. Install the helper from this skill:

   ```bash
   skills/agent-aquarium/agent-aquarium-local-test/scripts/install-agent-aquarium-local-test
   ```

2. Start the intended checkout or worktree:

   ```bash
   agent-aquarium-local-test --repo <agent-aquarium-checkout-or-worktree>
   ```

   Add `--with-aquarium-snapshot` for current managed state. Add
   `--with-provider-snapshot` when testing discovery or native archival.
   Omit `--repo` when already inside that checkout. Read
   [references/options.md](references/options.md) for refresh, empty-state,
   port, browser, lease, status, and stop options.

3. Verify the reported URL loads and report only useful test details:

   - local URL and repo/worktree path
   - isolated database path
   - snapshot source and whether it was refreshed, reused, or empty
   - Codex and Claude snapshot state
   - loopback, credential, and tmux isolation state
   - log paths and lease expiry
   - `agent-aquarium-local-test --status`
   - `agent-aquarium-local-test --stop`

## Context Pointers

- Read [references/helper-behavior.md](references/helper-behavior.md) when
  explaining snapshot contents, credential exclusion, process isolation,
  state paths, or leases.
- Read [references/troubleshooting.md](references/troubleshooting.md) when
  dependency installation, snapshotting, startup, provider discovery, or
  shutdown fails.

## Done Means

- The helper is installed or already available.
- The intended Agent Aquarium checkout/worktree is running.
- The listener is loopback-only and remote access is disabled.
- Aquarium, Codex, Claude, provider, temporary, and tmux state resolve inside
  the managed runtime directory.
- The source Aquarium database and provider homes remain unchanged.
- The report includes URL, repo, isolated database, snapshot state, isolation
  state, logs, lease expiry, and status/stop commands.

## Guardrails

- Keep provider credentials, auth files, settings, hooks, and environment API
  keys out of the managed provider snapshots.
- Use copied provider state for archive and lifecycle testing. Never point the
  managed app at live provider homes.
- Keep snapshots and logs local. Do not commit or paste their contents.
- Use `--empty` when production-like local state is unnecessary.
