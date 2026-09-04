---
name: clawhub-local-test
description: Run a guarded local ClawHub test instance with development Convex data refreshed from production.
---

# ClawHub local test

Start the intended ClawHub checkout for manual testing with development Convex
data refreshed from production. Only local/anonymous or the worktree's named
cloud `dev:` deployment is an allowed import target.

1. Ensure the launcher is available without separating it from its Effect tree:

   ```bash
   mkdir -p ~/.local/bin
   ln -sfn "${CODEX_HOME:-$HOME/.codex}/skills/clawhub-local-test/scripts/clawhub-local-test" ~/.local/bin/clawhub-local-test
   ```

   Use the symlink, not a standalone copy of the launcher.
2. Read [options.md](references/options.md) for snapshot, port, browser, fixture,
   lease, status, and stop choices. Batch independent environment/configuration
   checks and verify unfamiliar current tool behavior from installed sources.
3. Start the requested checkout:

   ```bash
   clawhub-local-test --repo <clawhub-checkout-or-worktree>
   ```

   Omit `--repo` when already inside it. Do not bypass the deployment guard or
   import snapshots into production, staging, preview, or an unknown deployment.
4. Use [helper-behavior.md](references/helper-behavior.md) to explain setup,
   safety, export/import, seeding, state, or TTL. Read
   [local-admin.md](references/local-admin.md) for dev-auth, admin persona,
   wrench, or cloud `dev:` secret sync. For failures read
   [troubleshooting.md](references/troubleshooting.md).
5. Verify the intended checkout and allowed Convex target. Report the local URL,
   repo path, Convex URL/marker/import target, snapshot path and reused/fresh state,
   dev-auth and publisher-abuse fixture states, logs, lease expiry, and these commands:

   ```bash
   clawhub-local-test --status
   clawhub-local-test --stop
   ```

Give meaningful updates during long snapshot/import/startup work. Do not paste or
commit production rows/snapshots, raw `.env.local`, credentials, or generated
secrets. Local summaries are sufficient evidence.
