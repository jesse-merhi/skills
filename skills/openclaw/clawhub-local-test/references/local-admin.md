# Local admin and the wrench

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
   restart it. To repair manually, restart the helper with a local-only secret
   and set the same secret on the dev Convex deployment:

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
