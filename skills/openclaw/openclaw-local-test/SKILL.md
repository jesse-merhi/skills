---
name: openclaw-local-test
description: 'Run an isolated local OpenClaw test Gateway using current Codex or Claude login and settings.'
---

# OpenClaw Local Test

Provide a ready-to-use local OpenClaw instance for manual testing in a browser.

## Workflow

1. Inspect native runtime availability.

   ```bash
   openclaw-local-test --inspect
   ```

   The report may name an auth type, route class, and model. It must not print
   credential values or custom endpoint URLs.

2. Start the intended OpenClaw checkout.

   ```bash
   openclaw-local-test --repo ~/repos/openclaw --runtime auto
   ```

   `auto` prefers a usable Codex login, then Claude. Use `--runtime codex`
   or `--runtime claude` when the choice matters.

   - Codex uses OpenClaw's native Codex app-server with
     `appServer.homeScope: "user"`. The app-server reads the operator's
     `$CODEX_HOME` or `~/.codex`, including its API-key or ChatGPT login,
     model provider, custom endpoint/proxy settings, plugins, and model.
   - Claude uses OpenClaw's bundled `claude-cli` runtime. The installed
     `claude` process owns its subscription or API-key login and user settings.

   Read [references/options.md](references/options.md) for explicit models,
   optional base configs, browser, lease, status, stop, and smoke-test options.

3. Inspect the generated OpenClaw config.

   The running Gateway uses `~/.openclaw-local-test/openclaw.json`. Read
   [references/config-inspection.md](references/config-inspection.md) for the
   redacted inspection command and reporting rules.

4. Verify both endpoints and wizard readiness after startup:

   ```bash
   curl -fsS http://127.0.0.1:<gateway-port>/healthz
   curl -fsS http://localhost:<browser-proxy-port>/healthz
   ```

   Startup also performs a typed `wizard.start` readiness probe. It cancels an
   acquired running session through `wizard.cancel`, including when a later
   probe step fails. Do not hand off the URL when that check fails.

5. Check logs when runtime or channel readiness matters:

   ```bash
   tail -80 ~/.openclaw-local-test/logs/gateway.err.log
   tail -80 ~/.openclaw-local-test/logs/gateway.log
   ```

6. Report the browser URL, ports, selected runtime, provider/model, auth and
   route classes, config path, lease expiry, relevant degraded logs, and the
   `--status` / `--stop` commands.

## Context Pointers

- Read [references/helper-behavior.md](references/helper-behavior.md) to explain
  runtime selection, state paths, config overlays, proxy behavior, startup
  locks, TTL, or security posture.
- Read [references/troubleshooting.md](references/troubleshooting.md) when
  startup, native login, model routing, proxy, channel, or cleanup fails.

## Done Means

- The helper is installed and `--inspect` identifies at least one usable native
  runtime.
- The instance starts from the intended OpenClaw checkout with the intended
  Codex or Claude runtime.
- The generated config selects the native runtime without copying raw auth
  material into `openclaw.json`.
- Gateway, browser proxy, and wizard lifecycle checks pass.
- The report includes the useful runtime and lease details without credentials
  or private endpoint values.

## Avoid

- copying Codex or Claude token values into OpenClaw config;
- exposing the loopback-only Gateway or browser proxy publicly;
- interpreting behavior against an optional source config instead of the
  generated runtime config;
- manually choosing ports while another startup holds the lock;
- leaving reduced smoke-test instances running unless the user asks.
