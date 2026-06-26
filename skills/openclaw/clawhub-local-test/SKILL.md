---
name: clawhub-local-test
description: Start and manage a local ClawHub manual-test instance backed by a development Convex database refreshed from production. Use when testing ClawHub UI, moderation, API, search, publisher, package, skill, or Convex-backed behavior locally with prod-like data instead of hand-running setup, prod export, dev/local import, dev auth fixture, and app server commands.
---

# ClawHub Local Test

Use this skill to give the user a ready-to-test local ClawHub instance with a
development Convex deployment populated from a production snapshot. The Convex
target may be a local loopback deployment or the worktree's named cloud `dev:`
deployment. It must never be production.

## Default Workflow

1. Ensure the helper exists on `PATH`:

```bash
install -m 755 skills/openclaw/clawhub-local-test/scripts/clawhub-local-test ~/.local/bin/clawhub-local-test
```

2. Start ClawHub with a prod-like development Convex database:

```bash
clawhub-local-test --repo <clawhub-checkout-or-worktree>
```

When already inside the intended ClawHub checkout, omit `--repo`.

3. Report only the useful test details:

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

Do not paste secrets, raw `.env.local`, or production row contents into chat.

## Helper Behavior

The helper:

- runs from the requested ClawHub checkout/worktree
- runs `bun run setup:worktree -- --quiet` if `.env.local` or `.convex` are
  missing
- accepts only local/anonymous Convex targets or `dev:` Convex targets before
  importing data
- starts local Convex when a loopback target is configured and not reachable
- configures cloud `dev:` deployments with a local-only `DEV_AUTH_SECRET` and
  localhost `DEV_AUTH_SITE_URL` so the local admin persona can sign in
- pushes current Convex code to the configured dev target before import so the
  schema matches the worktree
- exports production data with `bunx convex export --prod --path <snapshot.zip>`
- imports with `--replace-all -y` into either `--deployment local` or the named
  `dev:` deployment from `.env.local`
- reapplies ClawHub dev-auth/local fixture data after import, and also when
  import is skipped unless `--no-seed-fixtures` is passed, so a local browser
  can sign in with dev personas
- seeds publisher-abuse review demo rows only when the nomination table is
  empty, unless `--no-seed-abuse-fixtures` is passed; the default empty local
  abuse dashboard should include 16 potential-ban nominations and 124 review
  nominations with `demo-abuse-pub-*` handles
- starts the ClawHub dev server through `scripts/dev-worktree.ts`
- stores state under `~/.clawhub-local-test`
- writes logs under `~/.clawhub-local-test/logs`
- auto-stops after an 8 hour lease unless `--no-ttl` is passed

The production snapshot may contain sensitive production data. Keep it on this
machine, do not commit it, and do not paste its contents into chat.

## Common Options

Use a specific checkout:

```bash
clawhub-local-test --repo ~/repos/clawhub
```

Force a fresh production export:

```bash
clawhub-local-test --refresh
```

Reuse the latest cached snapshot:

```bash
clawhub-local-test --no-refresh
```

Include Convex file storage in the export when download/raw-file behavior is
the thing being tested. This can be slow and large:

```bash
clawhub-local-test --include-file-storage
```

Start on a specific web port:

```bash
clawhub-local-test --port 3017
```

Open a browser after startup:

```bash
clawhub-local-test --open
clawhub-local-test --open --browser "Google Chrome"
```

Skip import when the local DB is already in the desired state:

```bash
clawhub-local-test --skip-import
```

Skip publisher-abuse demo nominations:

```bash
clawhub-local-test --no-seed-abuse-fixtures
```

Use a shorter or longer lease:

```bash
clawhub-local-test --ttl 2h
clawhub-local-test --ttl 30m
```

Inspect or stop the managed instance:

```bash
clawhub-local-test --status
clawhub-local-test --stop
```

## Local Admin and the Wrench

The floating bottom-right wrench is the local dev persona control. It only
appears when the app is opened on `localhost` or `127.0.0.1` and
`VITE_ENABLE_DEV_AUTH=1` is present in the app process. Use **Use Admin** in
that menu to sign in as `@local-admin`; the dev auth mutation upserts that user
with `role: "admin"`. Once signed in, `/management` should show the admin-only
Users tool as well as the staff queues.

For local/anonymous Convex targets, dev auth does not need a shared secret. For
cloud `dev:` Convex targets, the browser signs in through the local app, then
Convex verifies the same `DEV_AUTH_SECRET`. The helper configures that secret
automatically on normal starts. If the wrench is missing or Use Admin fails on a
cloud `dev:` target:

1. Check whether the local app can expose the server-only secret:

```bash
node -e 'fetch("http://127.0.0.1:3000/dev-auth/secret").then(async r => { const j = await r.json(); console.log(JSON.stringify({ status: r.status, hasSecret: typeof j.devAuthSecret === "string" && j.devAuthSecret.length >= 32 })); })'
```

2. If that prints `hasSecret: false`, reinstall the helper from this skill and
restart it. To repair manually, restart the helper with a local-only secret and
set the same secret on the dev Convex deployment:

```bash
secret="$(openssl rand -hex 32)"
printf '%s' "$secret" | bunx convex env set DEV_AUTH_SECRET --deployment <dev-deployment-name>
bunx convex env set DEV_AUTH_SITE_URL http://127.0.0.1:<port> --deployment <dev-deployment-name>

DEV_AUTH_SECRET="$secret" \
DEV_AUTH_SITE_URL=http://127.0.0.1:<port> \
DEV_AUTH_CONVEX_DEPLOYMENT=dev:<dev-deployment-name> \
DEV_AUTH_ENABLED=1 \
VITE_ENABLE_DEV_AUTH=1 \
clawhub-local-test --repo <clawhub-checkout-or-worktree> --skip-import --port <port>
```

3. If you are using an older helper, reseed local fixtures after skipped
imports:

```bash
bunx convex run --deployment <dev-deployment-name> --no-push devSeed:seedLocalFixtures
```

Do not paste the generated secret into chat or commit it. It is only for local
browser-to-dev-Convex authentication.

## Troubleshooting

- If startup fails before import, check
  `~/.clawhub-local-test/logs/convex.err.log`.
- If the app fails after import, check
  `~/.clawhub-local-test/logs/app.err.log`.
- If import fails, the branch schema may not accept the current production
  snapshot. Run `bunx convex dev --once --typecheck=disable` in the worktree,
  then retry.
- If `.env.local` points at prod, staging, preview, or an unrecognized
  deployment, the helper stops before import. Fix the worktree setup first; do
  not override this guard.
- If dev auth does not show the expected local users, rerun with `--refresh` or
  run `bunx convex run --no-push devSeed:seedLocalFixtures` against the local
  deployment.
- If the publisher-abuse dashboard has zero potential-ban candidates locally,
  rerun the helper or seed the demo review queue directly:
  `bunx convex run --deployment <dev-deployment-name> --no-push internal.publisherAbuseDevSeed.seed`.
- If the local dev persona wrench is missing, confirm you are on
  `http://127.0.0.1:<port>` or `http://localhost:<port>` and that the app was
  started with `VITE_ENABLE_DEV_AUTH=1`.
- If the wrench appears but **Use Admin** fails on a cloud `dev:` target, check
  `/dev-auth/secret` as described above. A `dev:` target needs the same
  `DEV_AUTH_SECRET` in both the local app process and the Convex deployment env,
  plus a localhost `DEV_AUTH_SITE_URL`.
