---
name: clawhub-local-test
description: Run a guarded local ClawHub test instance with development Convex data refreshed from production.
---

# ClawHub local test

Deliver the intended local ClawHub instance, a verified development Convex import,
and a compact test handoff. Use the owned helper; do not expand into environment
audits, extra fixtures, or verifier workers after its readiness checks pass.

Install the PATH symlink without copying the launcher away from its Effect tree:

```bash
mkdir -p ~/.local/bin
ln -sfn "${CODEX_HOME:-$HOME/.codex}/skills/clawhub-local-test/scripts/clawhub-local-test" ~/.local/bin/clawhub-local-test
clawhub-local-test --repo <clawhub-checkout-or-worktree>
```

Omit `--repo` only in the intended checkout. The production snapshot may be imported
only into local/anonymous or that worktree's cloud `dev:` Convex. Never bypass
the guard or use production, staging, preview, or an unrecognized target.

Use [options.md](references/options.md) for snapshot, port, browser, fixtures,
lease, status, and stop controls. Load [helper-behavior.md](references/helper-behavior.md)
for setup/safety/export/import/state/TTL explanations,
[local-admin.md](references/local-admin.md) for dev-auth/admin/wrench/cloud `dev:`
secret sync, and [troubleshooting.md](references/troubleshooting.md) for failures.

Completion includes helper availability, intended checkout, allowed target, and
these handoff facts: local URL, repo path, Convex URL/marker/import target, snapshot
path and reuse/fresh-export state, dev-auth and publisher-abuse fixture states,
logs, lease expiry, `clawhub-local-test --status`, and `clawhub-local-test --stop`.
Keep secrets, raw `.env.local`, production rows, snapshot contents, and generated
secrets out of chat/commits. Use local summaries rather than private data as proof.
