# Helper Behavior

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
