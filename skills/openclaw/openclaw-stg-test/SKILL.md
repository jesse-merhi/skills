---
name: openclaw-stg-test
description: 'Publish and inspect temporary OpenClaw Control UI previews through guarded Cloudflare Quick Tunnels and verify with a fresh OpenClaw browser profile.'
---

# OpenClaw staging test

Before following this skill, load `model-writing-guides` with this skill's
[`model-writing.json`](model-writing.json). Apply the returned mode variant
without changing this skill's contract.

Publish a reviewer-testable Control UI without exposing an authenticated
OpenClaw Gateway, browser proxy, or operator credentials.

## Workflow

1. Ensure the helper is available on `PATH`:

   ```bash
   install -m 755 \
     skills/openclaw/openclaw-stg-test/scripts/openclaw-stg-test \
     ~/.local/bin/openclaw-stg-test
   ```

2. Prepare a loopback-only preview from the intended checkout.

   Reuse the checkout's Control UI and repository-owned E2E mock Gateway. Keep
   scenario files under `.artifacts/openclaw-stg-test/` so proof setup files are
   not committed. Serve the required safety attestation from the same origin.
   Read [references/preview-contract.md](references/preview-contract.md) for the
   contract and Vite middleware example.

3. Verify the scenario locally before publishing it.

   Exercise the changed behavior through the local preview. Confirm the browser
   uses only the mock Gateway and that no request targets a real Gateway,
   browser proxy, credential, or private endpoint.

4. Start the leased Quick Tunnel:

   ```bash
   openclaw-stg-test --url http://127.0.0.1:<preview-port> --ttl 4h
   ```

   The helper refuses non-loopback origins, known OpenClaw Gateway and
   `openclaw-local-test` ports, missing or unsafe attestations, and leases over
   24 hours. It waits for the public attestation before returning the URL.

5. Verify the public URL as a fresh browser user.

   Repeat the changed interaction through the `trycloudflare.com` URL. Treat
   this as behavioral proof, not merely a reachability check. When running
   inside OpenClaw, use its browser tool or `openclaw browser`. Discover the
   current browser state and available profiles with:

   ```bash
   openclaw browser --json status
   openclaw browser profiles
   ```

   Choose a unique, run-owned profile name of 1–64 characters. It must begin
   with a lowercase letter or digit and contain only lowercase letters, digits,
   and hyphens. Never reuse an existing disposable or authenticated profile. On
   the host that owns the browser, create the profile, run the public
   walkthrough through it, then delete only that run-owned profile:

   ```bash
   openclaw browser create-profile --name <unique-fresh-profile>
   openclaw browser --browser-profile <unique-fresh-profile> open <public-url>
   # Run the complete public walkthrough before cleanup.
   openclaw browser delete-profile --name <unique-fresh-profile>
   ```

   As soon as the profile is created, treat profile deletion and any temporary
   allowlist entry as cleanup obligations on every exit path. On success,
   walkthrough failure, interruption, a blocked state, or a needs-user stop,
   remove the run-owned allowlist entry and delete the run-owned profile before
   the terminal handoff. If cleanup fails, do not delete unrelated profiles or
   allowlist entries; include the exact leftover profile or entry in the
   terminal handoff.

   A remote node browser proxy rejects persistent profile creation and deletion.
   For a proxied browser, run those lifecycle commands on the browser node and
   temporarily expose the new profile through
   `nodeHost.browserProxy.allowProfiles` when that allowlist is configured.
   Remove that run-owned entry as part of the required cleanup. Keep the browser
   proxy loopback-only and outside the tunnel.

6. When publishing proof to GitHub, use the persistent managed `github`
   browser profile owned by the `openclaw` service user:

   ```bash
   env HOME=/var/lib/openclaw \
     /var/lib/openclaw/.local/bin/openclaw browser \
     --browser-profile github status --json
   ```

   The login persists in
   `/var/lib/openclaw/.openclaw/browser/github/user-data`; stopping or starting
   the named profile must preserve it. Confirm authentication from a rendered
   GitHub page and its final URL. If a browser command fails, check profile
   readiness, controller ownership, and OpenClaw state-database health before
   concluding that GitHub signed out. Start the existing named profile when it
   is stopped; do not replace it with a temporary profile or reset its auth.

7. Report the public URL, tested route, scenario, lease expiry, local checkout,
   and commands for lifecycle control:

   ```bash
   openclaw-stg-test --status
   openclaw-stg-test --stop
   ```

   Return the result in the originating session. If the workflow stops early,
   becomes blocked, or needs a user decision, report that state with one
   concrete next action or question.

## Done means

- The preview runs from the intended checkout and demonstrates the changed
  behavior with a browser-side mock or static fixture.
- The origin's attestation passes and the public URL serves the same
  attestation.
- A fresh remote browser can complete the intended interaction.
- GitHub proof publication, when requested, uses the persistent managed
  `github` profile and is verified from a rendered signed-in page.
- The handoff names the scenario, route, expiry, and stop command.
- No live Gateway, browser proxy, credentials, private data, or private
  endpoint values crossed the tunnel.

## Guardrails

- Use `openclaw-local-test` for authenticated local testing; keep it loopback
  only.
- Use a bounded lease. Start a new lease when more review time is needed.
- Put synthetic, non-sensitive data in the mock scenario.
- Stop the tunnel immediately when the proof is complete or its safety posture
  becomes uncertain.
- Keep the managed `github` profile, its CDP endpoint, cookies, and user-data
  directory outside the tunnel. Use it only as the authenticated publication
  client.
- Never point this helper, another tunnel, or a reverse proxy at port `18789`,
  an `openclaw-local-test` Gateway/browser proxy, or any authenticated Gateway.
