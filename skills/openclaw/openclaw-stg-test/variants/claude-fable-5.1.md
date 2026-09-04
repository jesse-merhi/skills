---
name: openclaw-stg-test
description: 'Publish and inspect temporary OpenClaw Control UI previews through guarded Cloudflare Quick Tunnels and verify with a fresh OpenClaw browser profile.'
---

# OpenClaw staging test

Publish a safe mock Control UI and verify its real public walkthrough. Keep live
Gateways, browser proxies, credentials, private data, and private endpoints out
of every tunnel.

1. Ensure the launcher is on PATH:

   ```bash
   install -m 755 \
     skills/openclaw/openclaw-stg-test/scripts/openclaw-stg-test \
     ~/.local/bin/openclaw-stg-test
   ```

2. Prepare the intended checkout's Control UI with its repository E2E mock
   Gateway on loopback. Put synthetic non-sensitive scenarios in uncommitted
   `.artifacts/openclaw-stg-test/`. Read
   [preview-contract.md](references/preview-contract.md) and serve the safety
   attestation from the same origin. Batch only independent preparation/checks.
3. Complete the changed interaction locally. Confirm requests use only the mock
   and never a real Gateway, proxy, credential, or private endpoint.
4. Publish with a bounded lease:

   ```bash
   openclaw-stg-test --url http://127.0.0.1:<preview-port> --ttl 4h
   ```

   The helper rejects non-loopback origins, known Gateway/local-test ports,
   missing/unsafe attestations, and leases longer than 24 hours. Wait for its
   public-attestation check before using the returned URL.
5. Repeat the complete interaction at the `trycloudflare.com` URL in a fresh
   browser profile. In OpenClaw use the browser tool or CLI; discover current state:

   ```bash
   openclaw browser --json status
   openclaw browser profiles
   ```

   Choose a unique run-owned profile of 1–64 lowercase letters/digits/hyphens,
   starting with a lowercase letter or digit. Do not reuse existing profiles.
   On the host that owns the browser:

   ```bash
   openclaw browser create-profile --name <unique-fresh-profile>
   openclaw browser --browser-profile <unique-fresh-profile> open <public-url>
   # Run the whole public walkthrough here.
   openclaw browser delete-profile --name <unique-fresh-profile>
   ```

6. From profile creation onward, guarantee deletion and removal of any run-owned
   allowlist entry before terminal handoff on success, failure, interruption,
   blockage, or needs-user stop. For a remote proxy, run persistent-profile lifecycle
   commands on the browser node and temporarily expose only the new profile via
   `nodeHost.browserProxy.allowProfiles` if configured. Keep the proxy loopback-only
   and outside the tunnel. Report exact leftovers if cleanup fails; do not remove
   unrelated profiles or entries.
7. For requested GitHub proof publication, use the persistent managed service-user
   `github` profile, separate from the disposable walkthrough profile:

   ```bash
   env HOME=/var/lib/openclaw \
     /var/lib/openclaw/.local/bin/openclaw browser \
     --browser-profile github status --json
   ```

   Preserve `/var/lib/openclaw/.openclaw/browser/github/user-data`. Confirm
   authentication from a rendered GitHub page and final URL. On command failure,
   check profile readiness, controller ownership, and state-database health
   before declaring logout. Start the existing stopped profile; never replace
   it with a temporary one or reset auth. Keep its CDP/cookies/data outside the tunnel.
8. Return in the originating session with URL, tested route/scenario, checkout,
   expiry, and `openclaw-stg-test --status` / `openclaw-stg-test --stop`. Report
   meaningful evidence changes or blockers, and one next action/question on early stop.

Stop the tunnel when proof is complete or safety becomes uncertain. Use a new
bounded lease for more time. Authenticated testing belongs in loopback-only
`openclaw-local-test`; never tunnel port `18789`, any local-test Gateway/proxy,
or another authenticated Gateway, including through a different proxy/helper.
