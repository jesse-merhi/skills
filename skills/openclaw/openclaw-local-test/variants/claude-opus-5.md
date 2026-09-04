---
name: openclaw-local-test
description: 'Run an isolated local OpenClaw test Gateway using current Codex or Claude login and settings.'
---

# OpenClaw local test

Deliver a usable isolated local Gateway with verified Gateway, browser-proxy,
and wizard readiness. Use the repository helper and native client login ownership;
do not expand setup into a general Gateway audit or verifier team.

Resolve `<skill-dir>`, inspect, then start the intended checkout:

```bash
<skill-dir>/scripts/openclaw-local-test --inspect
<skill-dir>/scripts/openclaw-local-test --repo ~/repos/openclaw --runtime auto
```

Inspection is read-only and must identify a usable runtime without credentials or
custom endpoint URLs. `auto` prefers usable Codex then Claude; explicit `codex`
or `claude` selects the native owner. Codex's app-server uses
`appServer.homeScope: "user"` and `$CODEX_HOME`/`~/.codex` login, provider, endpoint/
proxy, plugins, and model. Bundled `claude-cli` uses the installed Claude client's
subscription/API-key login and settings. Never copy raw auth into config.

Read [options.md](references/options.md) for models, optional config, browser,
lease, status/stop, and smoke controls. Inspect generated
`~/.openclaw-local-test/openclaw.json` using
[config-inspection.md](references/config-inspection.md)'s redacted command; it is
the runtime truth, not an optional source config.

Completion requires both endpoint probes:

```bash
curl -fsS http://127.0.0.1:<gateway-port>/healthz
curl -fsS http://localhost:<browser-proxy-port>/healthz
```

It also requires startup's typed `wizard.start` readiness probe and `wizard.cancel`
cleanup of any acquired running session, even on a later probe failure. Do not
hand off a URL after that check fails. Inspect runtime/channel logs when relevant:

```bash
tail -80 ~/.openclaw-local-test/logs/gateway.err.log
tail -80 ~/.openclaw-local-test/logs/gateway.log
```

Use [helper-behavior.md](references/helper-behavior.md) for selection/state/overlays/
proxy/locks/TTL/security and [troubleshooting.md](references/troubleshooting.md)
for failures. Keep Gateway/proxy loopback-only, respect startup locks instead of
manual port races, and do not retain reduced smoke instances unless requested.

Return compact URL/ports, intended checkout/runtime, provider/model, auth/route
classes, generated config path, expiry, relevant degraded logs, and `--status`/
`--stop` controls. Omit credential values and private endpoints.
