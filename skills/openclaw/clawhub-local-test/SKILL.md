---
name: clawhub-local-test
description: Run a guarded local ClawHub test instance with development Convex data refreshed from production.
---

# ClawHub local test

Give the user a ready-to-test local ClawHub instance with a development Convex
deployment populated from a production snapshot. The Convex target may be a
local loopback deployment or the worktree's named cloud `dev:` deployment. It
must never be production.

## Workflow

1. Ensure the helper exists on `PATH`:

   ```bash
   mkdir -p ~/.local/bin
   ln -sfn "${CODEX_HOME:-$HOME/.codex}/skills/clawhub-local-test/scripts/clawhub-local-test" ~/.local/bin/clawhub-local-test
   ```

   The symlink preserves the launcher's Effect module tree. Do not copy the
   launcher by itself.

2. Start ClawHub with a prod-like development Convex database:

   ```bash
   clawhub-local-test --repo <clawhub-checkout-or-worktree>
   ```

   When already inside the intended ClawHub checkout, omit `--repo`. Read
   [references/options.md](references/options.md) for snapshot, port, browser,
   fixture, lease, status, and stop options.

3. Report only useful test details:

   - local URL
   - ClawHub repo/worktree path
   - Convex URL, deployment marker, and import target
   - snapshot path and whether it was reused or freshly exported
   - whether dev-auth fixtures were applied
   - whether publisher-abuse fixtures were applied
   - log paths
   - lease expiry
   - `clawhub-local-test --status`
   - `clawhub-local-test --stop`

## Context pointers

- Read [references/helper-behavior.md](references/helper-behavior.md) when you
  need to explain setup, Convex target safety, production export/import,
  fixture seeding, state paths, or TTL behavior.
- Read [references/local-admin.md](references/local-admin.md) when testing or
  repairing local dev-auth, the admin persona, the wrench, or cloud `dev:`
  secret sync.
- Read [references/troubleshooting.md](references/troubleshooting.md) when
  startup, import, dev auth, abuse fixtures, or local persona behavior fails.

## Done means

- The helper path is installed or already present.
- The instance uses the intended ClawHub checkout/worktree.
- The Convex target is local/anonymous or `dev:`, never prod/staging/preview.
- The report includes URL, repo path, Convex target, snapshot/import state,
  fixture state, log paths, lease expiry, and stop/status commands.
- Secrets, raw `.env.local`, production rows, and generated local secrets were
  not pasted into chat.

## Avoid

- importing production snapshots into prod, staging, preview, or unrecognized
  deployments;
- committing or pasting production snapshot contents;
- overriding the helper's deployment safety guard;
- using remote/prod data details as chat evidence when a local summary is
  enough.
