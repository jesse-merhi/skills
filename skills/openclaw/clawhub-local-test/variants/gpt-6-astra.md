---
name: clawhub-local-test
description: Run a guarded local ClawHub test instance with development Convex data refreshed from production.
---

# ClawHub local test

Carry the requested guarded local setup through a ready-to-test ClawHub instance.
Resolve routine snapshot/port choices from the documented defaults. The Convex
import boundary stays local/anonymous or the worktree's named cloud `dev:` target;
production, staging, preview, and unrecognized deployments are forbidden.

## Launch through the owned helper

Keep the launcher's Effect tree intact and ensure PATH availability:

```bash
mkdir -p ~/.local/bin
ln -sfn "${CODEX_HOME:-$HOME/.codex}/skills/clawhub-local-test/scripts/clawhub-local-test" ~/.local/bin/clawhub-local-test
clawhub-local-test --repo <clawhub-checkout-or-worktree>
```

Do not copy just the launcher. Omit `--repo` only inside the intended checkout.
Read [options.md](references/options.md) for snapshot, port, browser, fixture,
lease, status, and stop controls. Existing local-test authority covers this
helper workflow, not bypassing its deployment guard.

## Resolve readiness from evidence

Use [helper-behavior.md](references/helper-behavior.md) for setup, target safety,
export/import, fixture, state, and TTL questions; [local-admin.md](references/local-admin.md)
for local dev-auth/admin persona/wrench/cloud `dev:` secret sync; and
[troubleshooting.md](references/troubleshooting.md) for startup, import, auth,
abuse-fixture, or persona failures.

Finish with the helper available, correct checkout, and permitted development
Convex target. Report local URL, repo path, Convex URL/deployment marker/import
target, snapshot path and reused/fresh state, both dev-auth and publisher-abuse
fixture states, logs, expiry, `clawhub-local-test --status`, and
`clawhub-local-test --stop`. Never paste secrets, raw `.env.local`, production
rows, snapshot contents, or generated local secrets; do not commit snapshots.
