---
name: openclaw-stg-test
description: 'Publish and inspect temporary OpenClaw Control UI previews through guarded Cloudflare Quick Tunnels and verify with a fresh OpenClaw browser profile.'
---

# OpenClaw staging test

Deliver a temporary mock Control UI with local and fresh-user public walkthrough
proof, matching safety attestations, and owned-profile cleanup. These are distinct
requirements; do not replace them with reachability checks or add a verifier team.

Install the owned helper on PATH:

```bash
install -m 755 \
  skills/openclaw/openclaw-stg-test/scripts/openclaw-stg-test \
  ~/.local/bin/openclaw-stg-test
```

Prepare the intended checkout's Control UI and E2E mock Gateway on loopback.
Use synthetic non-sensitive scenario files under uncommitted
`.artifacts/openclaw-stg-test/`. Read [preview-contract.md](references/preview-contract.md)
and serve the same-origin safety attestation. Complete the changed local interaction
and inspect requests: no real Gateway/proxy, credentials, or private endpoints.
Then publish the bounded lease:

```bash
openclaw-stg-test --url http://127.0.0.1:<preview-port> --ttl 4h
```

The helper rejects non-loopback origins, known Gateway/local-test ports,
missing/unsafe attestations, and leases over 24 hours, returning only after public
attestation. Repeat the full scenario at the `trycloudflare.com` URL using a fresh
browser user. In OpenClaw discover the browser tool/CLI state:

```bash
openclaw browser --json status
openclaw browser profiles
```

Create a unique run-owned profile, 1–64 lowercase letters/digits/hyphens starting
with a lowercase letter/digit. Never reuse an existing profile. On its owning host:

```bash
openclaw browser create-profile --name <unique-fresh-profile>
openclaw browser --browser-profile <unique-fresh-profile> open <public-url>
# Complete the public walkthrough.
openclaw browser delete-profile --name <unique-fresh-profile>
```

Guarantee cleanup from creation onward: delete the run-owned profile and remove
its temporary allowlist entry before any terminal handoff, including failure,
interruption, blockage, and needs-user stops. Remote browser proxies cannot
create/delete persistent profiles; do that on the browser node and temporarily
add this profile to configured `nodeHost.browserProxy.allowProfiles`. Keep the
proxy loopback-only/outside the tunnel. Report exact leftovers on cleanup failure
without deleting unrelated profiles/entries.

Requested GitHub proof publication uses the separate persistent managed `github`
profile owned by the service user:

```bash
env HOME=/var/lib/openclaw \
  /var/lib/openclaw/.local/bin/openclaw browser \
  --browser-profile github status --json
```

Preserve `/var/lib/openclaw/.openclaw/browser/github/user-data`, its cookies, and
authentication. Verify a rendered signed-in page and final URL. If a command
fails, check readiness, controller ownership, and state-database health before
assuming logout; start the existing profile when stopped, do not replace/reset it.
Keep this client, CDP, and data outside the tunnel.

Report URL, tested route/scenario, checkout, expiry, proof result, and
`openclaw-stg-test --status` / `openclaw-stg-test --stop` in the originating session.
Early stops need one concrete action/question. Stop the tunnel at proof completion
or safety uncertainty and use a new bounded lease for more time. Authenticated
local testing stays with loopback-only `openclaw-local-test`. Never expose port
`18789`, a local-test Gateway/proxy, or any authenticated Gateway through this
or another tunnel/reverse proxy.
