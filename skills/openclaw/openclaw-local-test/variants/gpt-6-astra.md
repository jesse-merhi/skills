---
name: openclaw-local-test
description: 'Run an isolated local OpenClaw test Gateway using current Codex or Claude login and settings.'
---

# OpenClaw local test

Use inspected runtime availability and documented defaults to complete the
requested isolated local launch. Native client authentication remains native;
there is no need for an extra model-choice interview when `auto` resolves it.

## Select and launch from evidence

Resolve `<skill-dir>` and run read-only discovery before launch:

```bash
<skill-dir>/scripts/openclaw-local-test --inspect
<skill-dir>/scripts/openclaw-local-test --repo ~/repos/openclaw --runtime auto
```

Use the intended checkout. Inspection must identify a usable runtime and report
only auth/route class and model, not credentials/custom endpoints. `auto` selects
usable Codex before Claude; use explicit `codex`/`claude` when needed. Codex uses
the native app-server with `appServer.homeScope: "user"` and the operator's
`$CODEX_HOME`/`~/.codex` login, provider, endpoint/proxy, plugins, and model. Claude
uses bundled `claude-cli`, whose installed client owns subscription/API-key login
and settings. Do not copy raw credentials into `openclaw.json`.

Read [options.md](references/options.md) for models, optional base config, browser,
lease, status/stop, and smoke options. Use the generated runtime config
`~/.openclaw-local-test/openclaw.json`, inspected through
[config-inspection.md](references/config-inspection.md)'s redacted command.

## Establish actual readiness

Run both endpoint checks:

```bash
curl -fsS http://127.0.0.1:<gateway-port>/healthz
curl -fsS http://localhost:<browser-proxy-port>/healthz
```

Retain startup's distinct typed `wizard.start` probe and cancellation of acquired
running sessions through `wizard.cancel`, including later probe failure. A failed
wizard check blocks URL handoff. For runtime/channel concerns inspect:

```bash
tail -80 ~/.openclaw-local-test/logs/gateway.err.log
tail -80 ~/.openclaw-local-test/logs/gateway.log
```

Use [helper-behavior.md](references/helper-behavior.md) for runtime/state/overlay/
proxy/lock/TTL/security details and [troubleshooting.md](references/troubleshooting.md)
for failures. Keep Gateway/proxy loopback-only, do not race startup locks with
manual ports, and stop reduced smoke instances unless retention was requested.

Finish with intended checkout/runtime and passing Gateway, proxy, and wizard
checks. Report browser URL, ports, runtime, provider/model, auth/route classes,
config path, lease expiry, relevant degraded logs, and `--status`/`--stop`, without
credentials/private endpoints. Do not infer behavior from an optional source config.
