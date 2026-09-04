---
name: openclaw-local-test
description: 'Run an isolated local OpenClaw test Gateway using current Codex or Claude login and settings.'
---

# OpenClaw local test

Provide an isolated local Gateway ready for manual browser testing, using the
operator's native Codex or Claude client to own authentication and settings.
Resolve `<skill-dir>` and inspect first:

```bash
<skill-dir>/scripts/openclaw-local-test --inspect
<skill-dir>/scripts/openclaw-local-test --repo ~/repos/openclaw --runtime auto
```

Use the intended checkout path. `--inspect` is read-only and must identify a
usable native runtime without exposing credentials or custom endpoint URLs.
`auto` prefers usable Codex then Claude; choose `codex`/`claude` explicitly when
needed. Codex uses the native app-server with `appServer.homeScope: "user"`,
reading `$CODEX_HOME` or `~/.codex` login, provider, custom endpoint/proxy, plugins,
and model. Claude uses bundled `claude-cli`, with the installed client owning
subscription/API-key login and user settings. Do not copy raw auth into config.

Read [options.md](references/options.md) for model, optional source config, browser,
lease, status, stop, and smoke options. Inspect the generated runtime config at
`~/.openclaw-local-test/openclaw.json` using the redacted command and reporting
rules in [config-inspection.md](references/config-inspection.md), not an optional
source config.

Verify both endpoints:

```bash
curl -fsS http://127.0.0.1:<gateway-port>/healthz
curl -fsS http://localhost:<browser-proxy-port>/healthz
```

Startup's typed `wizard.start` probe must also pass. It cancels an acquired running
session with `wizard.cancel`, including later probe failure; do not hand off a
URL when readiness fails. For runtime/channel concerns inspect relevant logs:

```bash
tail -80 ~/.openclaw-local-test/logs/gateway.err.log
tail -80 ~/.openclaw-local-test/logs/gateway.log
```

Use [helper-behavior.md](references/helper-behavior.md) for selection, state,
overlays, proxy, locks, TTL, and security details; use
[troubleshooting.md](references/troubleshooting.md) for startup/login/routing/
proxy/channel/cleanup failures. Do not choose ports manually under another
startup lock, expose Gateway/proxy publicly, or leave reduced smoke instances
running unless requested.

Report browser URL, ports, runtime, provider/model, auth/route classes, generated
config path, lease expiry, relevant degraded logs, and `--status`/`--stop` commands.
Completion requires intended checkout/runtime, native auth ownership, and passing
Gateway, proxy, and wizard lifecycle checks without leaked credentials/endpoints.
