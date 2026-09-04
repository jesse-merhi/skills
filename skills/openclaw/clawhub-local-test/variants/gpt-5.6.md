---
name: clawhub-local-test
description: Run a guarded local ClawHub test instance with development Convex data refreshed from production.
---

# ClawHub local test

Provide a ready-to-test local ClawHub checkout backed by a production snapshot
imported only into local/anonymous or the worktree's named cloud `dev:` Convex.
Never import into production, staging, preview, or an unrecognized deployment.

Ensure the helper is on PATH, preserving its Effect module tree through a symlink:

```bash
mkdir -p ~/.local/bin
ln -sfn "${CODEX_HOME:-$HOME/.codex}/skills/clawhub-local-test/scripts/clawhub-local-test" ~/.local/bin/clawhub-local-test
clawhub-local-test --repo <clawhub-checkout-or-worktree>
```

Omit `--repo` only when already in the intended checkout. Do not copy the launcher
alone or override its deployment guard. Use [options.md](references/options.md)
for snapshots, ports, browser, fixtures, lease, status, and stop options.

For setup, export/import safety, fixtures, state, or TTL explanation read
[helper-behavior.md](references/helper-behavior.md). For local dev-auth, admin
persona, wrench, or cloud `dev:` secret sync read
[local-admin.md](references/local-admin.md). For startup/import/auth/abuse-fixture/
persona failure use [troubleshooting.md](references/troubleshooting.md).

Report local URL, checkout path, Convex URL/deployment marker/import target,
snapshot path and fresh-export/reuse state, dev-auth and publisher-abuse fixture
states, logs, lease expiry, `clawhub-local-test --status`, and
`clawhub-local-test --stop`. Completion requires the helper, intended checkout,
and verified permitted development target. Keep secrets, raw `.env.local`,
production rows, snapshot contents, and generated secrets out of chat and commits;
use local summaries as evidence.
