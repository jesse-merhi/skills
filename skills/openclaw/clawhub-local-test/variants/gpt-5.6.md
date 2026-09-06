---
name: clawhub-local-test
description: 'Launch a local ClawHub instance with a guarded development database and test personas.'
---

# ClawHub local test

```sh
clawhub-local-test --repo <checkout-or-worktree>
```

The helper handles worktree setup, Convex startup/code sync, production snapshot export, development import, test personas, app startup, and an eight-hour lease. No global installation is needed.

Imports replace development data. Allow only local/anonymous targets or the worktree's named `dev:` deployment; keep the guard intact. Production snapshots remain private and local.

Use `--skip-import` to skip snapshot replacement, `--refresh` for a fresh snapshot, or `--ttl 2h` for a shorter run. Schema sync, dev-auth setup, and fixture seeding still change the development target. Run `--help` for options; don't use this launcher when the database must stay untouched.

Return the URL, checkout, development target, snapshot/fixture status, expiry, and these controls:

```sh
clawhub-local-test --status
clawhub-local-test --stop
```

## Local admin and troubleshooting

After a complete launch, verify that the localhost app's wrench offers **Use Admin** as `@local-admin` with dev auth enabled. This is part of the launch, not an optional extra. For cloud `dev:` targets, the helper synchronizes the app and Convex secret; restart through the helper if they disagree. Inspect only whether `/dev-auth/secret` has a secret, never its value.

For failures, inspect `~/.clawhub-local-test/logs/convex.err.log` or `~/.clawhub-local-test/logs/app.err.log`. Resolve schema mismatches before reimporting. Correct rejected deployment configuration rather than bypassing the import guard. Keep snapshots and generated secrets out of chat and Git.
