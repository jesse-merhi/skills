---
name: clawhub-local-test
description: 'Launch a local ClawHub instance with a guarded development database and test personas.'
---

# ClawHub local test

```sh
clawhub-local-test --repo <checkout-or-worktree>
```

The helper handles worktree setup, Convex startup/code sync, production snapshot export, development import, test personas, app startup, and an eight-hour lease. No global installation is needed.

Imports replace development data. Only local/anonymous or the worktree's named `dev:` deployment is allowed; keep the guard intact. Production snapshots remain private and local.

Use `--skip-import` to skip snapshot replacement, `--refresh` for a fresh snapshot, or `--ttl 2h` for a shorter run. Schema sync, dev-auth setup, and fixture seeding still change the development target. Run `--help` for options; don't use this launcher when the database must stay untouched.

Return the URL, checkout, development target, snapshot/fixture status, expiry, and these controls:

```sh
clawhub-local-test --status
clawhub-local-test --stop
```

## Local admin and troubleshooting

The local wrench with **Use Admin** as `@local-admin` is part of a complete launch, not an optional extra. Verify it on the localhost app with dev auth enabled. For cloud `dev:` targets, the helper synchronizes the app and Convex secret; restart through the helper if they disagree. Inspect only whether `/dev-auth/secret` has a secret, never its value.

For failures, inspect `~/.clawhub-local-test/logs/convex.err.log` or `app.err.log`. Resolve schema mismatches before reimporting. Correct rejected deployment configuration rather than bypassing the import guard. Keep snapshots and generated secrets out of chat and Git.
