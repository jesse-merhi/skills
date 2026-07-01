# Troubleshooting

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
  `/dev-auth/secret` as described in `local-admin.md`. A `dev:` target needs the
  same `DEV_AUTH_SECRET` in both the local app process and the Convex deployment
  env, plus a localhost `DEV_AUTH_SITE_URL`.
