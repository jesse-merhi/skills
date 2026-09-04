---
name: openclaw-stg-test
description: 'Publish and inspect temporary OpenClaw Control UI previews through guarded Cloudflare Quick Tunnels and verify with a fresh OpenClaw browser profile.'
---

# OpenClaw staging test

Publish a temporary Control UI preview that a fresh reviewer can exercise,
without exposing a live Gateway, browser proxy, operator credentials, or private data.
Ensure the helper is on PATH:

```bash
install -m 755 \
  skills/openclaw/openclaw-stg-test/scripts/openclaw-stg-test \
  ~/.local/bin/openclaw-stg-test
```

Prepare a loopback preview from the intended checkout's Control UI and repo E2E
mock Gateway. Keep synthetic, non-sensitive scenarios under
`.artifacts/openclaw-stg-test/`, uncommitted. Read
[preview-contract.md](references/preview-contract.md) and serve its safety
attestation from the same origin. Exercise the changed interaction locally and
confirm every request stays with the mock, never a real Gateway/proxy, credential,
or private endpoint. Then start the bounded lease:

```bash
openclaw-stg-test --url http://127.0.0.1:<preview-port> --ttl 4h
```

The helper rejects non-loopback origins, known Gateway/local-test ports,
missing/unsafe attestations, and leases over 24 hours. It waits for public
attestation before returning the `trycloudflare.com` URL.

Repeat the complete interaction publicly as a fresh browser user, not just a
reachability check. In OpenClaw use its browser tool or CLI. Discover state:

```bash
openclaw browser --json status
openclaw browser profiles
```

Choose a unique run-owned 1–64-character profile beginning with a lowercase
letter/digit and containing only lowercase letters, digits, or hyphens. Never
reuse an existing disposable or authenticated profile. On the browser-owning host:

```bash
openclaw browser create-profile --name <unique-fresh-profile>
openclaw browser --browser-profile <unique-fresh-profile> open <public-url>
# Complete the public walkthrough before deleting the profile.
openclaw browser delete-profile --name <unique-fresh-profile>
```

Creation immediately establishes cleanup obligations on every exit path: remove
any run-owned allowlist entry and delete this profile before terminal handoff,
including failure, interruption, blockage, or needs-user stops. A remote browser
proxy cannot create/delete persistent profiles; run lifecycle commands on its
node and temporarily add this profile to `nodeHost.browserProxy.allowProfiles`
when configured. Keep the proxy loopback-only and outside the tunnel. If cleanup
fails, report exact leftover IDs/entries without deleting unrelated state.

For requested GitHub proof publication, use the persistent managed `github`
profile owned by the `openclaw` service user:

```bash
env HOME=/var/lib/openclaw \
  /var/lib/openclaw/.local/bin/openclaw browser \
  --browser-profile github status --json
```

Preserve `/var/lib/openclaw/.openclaw/browser/github/user-data` across stop/start.
Verify login from a rendered GitHub page and final URL. On command failure,
check readiness, controller ownership, and state-database health before assuming
logout. Start the existing stopped profile; do not replace it or reset auth.
Keep this publication client, CDP, cookies, and user data outside the tunnel.

Return in the originating session: public URL, route/scenario, local checkout,
lease expiry, walkthrough/attestation result, and `openclaw-stg-test --status` /
`openclaw-stg-test --stop`. Early stops need a concrete next action/question.
Stop the tunnel when proof completes or safety is uncertain; renew by a new
bounded lease. Authenticated testing uses loopback-only `openclaw-local-test`.
Never tunnel port `18789`, its Gateway/browser proxy, or any authenticated Gateway,
including through another helper or reverse proxy.
