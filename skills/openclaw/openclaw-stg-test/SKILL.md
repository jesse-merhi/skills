---
name: openclaw-stg-test
description: 'Publish, inspect, and stop a temporary remote OpenClaw Control UI preview through a guarded Cloudflare Quick Tunnel. Use for PR staging links, remote manual testing, reviewer handoff, or browser proof when the preview is backed only by browser-side mocks or static fixtures.'
---

# OpenClaw Staging Test

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
   scenario files under `.artifacts/openclaw-stg-test/` so proof scaffolding is
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
   this as behavioral proof, not merely a reachability check.

6. Report the public URL, tested route, scenario, lease expiry, local checkout,
   and commands for lifecycle control:

   ```bash
   openclaw-stg-test --status
   openclaw-stg-test --stop
   ```

## Done Means

- The preview runs from the intended checkout and demonstrates the changed
  behavior with a browser-side mock or static fixture.
- The origin's attestation passes and the public URL serves the same
  attestation.
- A fresh remote browser can complete the intended interaction.
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
- Never point this helper, another tunnel, or a reverse proxy at port `18789`,
  an `openclaw-local-test` Gateway/browser proxy, or any authenticated Gateway.
