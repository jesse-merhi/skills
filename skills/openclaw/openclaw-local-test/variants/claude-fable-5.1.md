---
name: openclaw-local-test
description: 'Run an isolated local OpenClaw test Gateway using current Codex or Claude login and settings.'
---

# OpenClaw local test

Start the requested isolated OpenClaw Gateway and prove that its browser flow is
ready. Native Codex or Claude clients retain ownership of credentials and settings.

1. Resolve `<skill-dir>` and inspect available runtimes:

   ```bash
   <skill-dir>/scripts/openclaw-local-test --inspect
   ```

   This is read-only. It may show auth type, route class, and model, never token
   values or custom endpoint URLs. Confirm at least one runtime is usable.
2. Read [options.md](references/options.md) for model, optional config, browser,
   lease, status, stop, and smoke options. Start the intended checkout:

   ```bash
   <skill-dir>/scripts/openclaw-local-test --repo ~/repos/openclaw --runtime auto
   ```

   Replace the example repo path as needed. `auto` prefers usable Codex, then
   Claude; choose `codex`/`claude` explicitly when the request needs it. Codex's
   native app-server uses `appServer.homeScope: "user"` and the operator's
   `$CODEX_HOME`/`~/.codex` login, provider, custom endpoint/proxy, plugins, and
   model. Claude's bundled `claude-cli` uses the installed client's subscription/
   API-key login and settings. Never copy raw authentication into OpenClaw config.
3. Inspect generated `~/.openclaw-local-test/openclaw.json` with the redacted
   command in [config-inspection.md](references/config-inspection.md). Interpret
   running behavior from that file, not an optional source config. Batch independent
   safe environment/config checks and verify unfamiliar behavior from installed source.
4. Check both endpoints:

   ```bash
   curl -fsS http://127.0.0.1:<gateway-port>/healthz
   curl -fsS http://localhost:<browser-proxy-port>/healthz
   ```

   Startup's typed `wizard.start` readiness check must pass too. It cancels an
   acquired running session via `wizard.cancel` even if a later probe fails.
   Do not give the user the URL when that probe fails.
5. When runtime/channel readiness matters, inspect:

   ```bash
   tail -80 ~/.openclaw-local-test/logs/gateway.err.log
   tail -80 ~/.openclaw-local-test/logs/gateway.log
   ```

   Use [helper-behavior.md](references/helper-behavior.md) for selection, state,
   overlays, proxy, locks, TTL, and security; use
   [troubleshooting.md](references/troubleshooting.md) for startup/login/routing/
   proxy/channel/cleanup failures.
6. Report URL, ports, selected runtime, provider/model, auth/route classes,
   generated config path, expiry, relevant degraded logs, and `--status`/`--stop`.
   Keep credentials and private endpoints out of the report.

Keep Gateway and browser proxy loopback-only. Do not choose ports while another
startup owns the lock. Do not leave reduced smoke instances running unless asked.
Report meaningful startup progress and finish only with all three readiness checks.
