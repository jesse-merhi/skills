---
name: openclaw-local-test
description: 'Spin up and manage a local OpenClaw manual-test Gateway in a browser, with optional local Atlassian AIGW, Slack, Discord, and fresh ports.'
---

# OpenClaw Local Test

Provide a ready-to-use local OpenClaw instance for manual testing in a browser.

## Workflow

1. Ensure the helper exists on `PATH`.

   Prefer `~/.local/bin/openclaw-local-test` if present. If missing or clearly
   stale, install the bundled helper:

   ```bash
   install -m 755 scripts/openclaw-local-test ~/.local/bin/openclaw-local-test
   ```

2. Start the full manual-test instance.

   Pass the source config explicitly so the user can confirm which local
   credentials/config will be mirrored:

   ```bash
   openclaw-local-test --repo ~/repos/openclaw --base-config ~/.openclaw/openclaw.json
   ```

   Read [references/options.md](references/options.md) for alternate repo,
   browser, lease, status, stop, and smoke-test options.

3. Inspect the generated config before testing behavior.

   The running Gateway uses `~/.openclaw-local-test/openclaw.json`, not the
   source config directly. Read
   [references/config-inspection.md](references/config-inspection.md) for the
   redacted inspection command and reporting rules.

4. Verify both endpoints after startup:

   ```bash
   curl -fsS http://127.0.0.1:<gateway-port>/healthz
   curl -fsS http://localhost:<browser-proxy-port>/healthz
   ```

5. Check logs when channel/provider readiness matters:

   ```bash
   tail -80 ~/.openclaw-local-test/logs/gateway.log
   tail -80 ~/.openclaw-local-test/logs/gateway.err.log
   ```

6. Report only useful test details:

   - browser URL, usually `http://localhost:<browser-proxy-port>/`
   - Gateway port and browser proxy port
   - provider/model, usually `atlassian-aigw/gpt-5.5-2026-04-23`
   - config path, active agent id, and relevant permission/tool/plugin settings
   - lease expiry time
   - whether Slack and Discord started or any degraded logs appeared
   - `openclaw-local-test --status` and `openclaw-local-test --stop`

## Context Pointers

- Read [references/helper-behavior.md](references/helper-behavior.md) when you
  need to explain state paths, session rotation, model/config rewriting, proxy
  behavior, startup locks, TTL, or security posture.
- Read [references/troubleshooting.md](references/troubleshooting.md) when
  startup, proxy, provider, channel, or cleanup behavior fails.

## Done Means

- The helper path is installed or already present.
- The instance started from the intended OpenClaw repo and explicit base config.
- Health checks passed for both Gateway and browser proxy.
- The active generated config was inspected with secrets redacted.
- The report includes URL, ports, provider/model, relevant config summary, lease
  expiry, channel status, and stop/status commands.
- Raw config, secrets, and credentials were not pasted into chat.

## Avoid

- exposing the local Gateway/browser proxy publicly;
- interpreting behavior against the source config instead of the generated
  runtime config;
- manually choosing ports while another startup is waiting on the lock;
- keeping reduced smoke-test instances running unless the user explicitly asks;
- using `openclaw-dia-test` for new instructions except as a compatibility
  stop/status fallback.
