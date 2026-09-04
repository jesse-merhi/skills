---
name: openclaw-stg-test
description: 'Publish and inspect temporary OpenClaw Control UI previews through guarded Cloudflare Quick Tunnels and verify with a fresh OpenClaw browser profile.'
---

# OpenClaw staging test

Carry the authorized mock preview through local proof, guarded publication,
fresh-user public proof, and cleanup. Prepare mock/local evidence before any
genuinely unresolved publication decision; do not add generic approval gates
to an already-authorized preview.

## Establish the safe origin

Ensure helper availability:

```bash
install -m 755 \
  skills/openclaw/openclaw-stg-test/scripts/openclaw-stg-test \
  ~/.local/bin/openclaw-stg-test
```

Use the intended checkout's Control UI and owned E2E mock Gateway on loopback.
Keep synthetic non-sensitive scenarios in uncommitted
`.artifacts/openclaw-stg-test/`. Read [preview-contract.md](references/preview-contract.md)
and serve its attestation from the same origin. Exercise the changed behavior
locally; every request must stay with the mock and avoid real Gateways, proxies,
credentials, or private endpoints. Publish only after this check:

```bash
openclaw-stg-test --url http://127.0.0.1:<preview-port> --ttl 4h
```

The helper refuses non-loopback origins, known Gateway/local-test ports,
missing/unsafe attestations, and leases over 24 hours, and waits for the public
attestation before returning the URL.

## Prove a fresh public user can complete the scenario

Repeat the complete interaction at the `trycloudflare.com` URL. In OpenClaw,
use its browser tool or CLI and inspect available state:

```bash
openclaw browser --json status
openclaw browser profiles
```

Choose a unique run-owned 1–64-character profile: lowercase letter/digit first,
then lowercase letters/digits/hyphens only. Do not reuse an existing disposable
or authenticated profile. On the browser-owning host run:

```bash
openclaw browser create-profile --name <unique-fresh-profile>
openclaw browser --browser-profile <unique-fresh-profile> open <public-url>
# Perform the full public walkthrough.
openclaw browser delete-profile --name <unique-fresh-profile>
```

Profile creation creates immediate cleanup ownership. Remove any temporary
run-owned allowlist entry and delete this profile before terminal handoff on
every exit, including failure/interruption/blockage/needs-user. Remote proxies
reject persistent-profile creation/deletion; run those commands on the browser
node and add only this profile temporarily to `nodeHost.browserProxy.allowProfiles`
when configured. Keep the proxy loopback-only/outside the tunnel. Report exact
leftovers on cleanup failure rather than touching unrelated state.

## Keep publication authentication separate

For requested GitHub proof publication, use the persistent managed `github`
profile under the `openclaw` service user:

```bash
env HOME=/var/lib/openclaw \
  /var/lib/openclaw/.local/bin/openclaw browser \
  --browser-profile github status --json
```

Preserve `/var/lib/openclaw/.openclaw/browser/github/user-data` across lifecycle
operations. Verify authentication from a rendered GitHub page/final URL. Check
readiness, controller ownership, and state-database health before inferring
logout from a failed command; start the existing stopped profile, never replace
it or reset login. Keep this client, CDP, cookies, and user data outside the tunnel.

Return URL, tested route/scenario, checkout, expiry, attestation/walkthrough status,
and `openclaw-stg-test --status` / `openclaw-stg-test --stop` in the originating
session. For early stop report the state and one concrete action/question. Stop
the tunnel when proof completes or safety is uncertain; use a new bounded lease
for more time. Use loopback-only `openclaw-local-test` for authenticated testing.
No helper, tunnel, or reverse proxy may expose port `18789`, a local-test Gateway/
proxy, or any authenticated Gateway.
