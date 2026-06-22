---
name: openclaw-local-test
description: 'Spin up and manage a local OpenClaw manual-test Gateway in a browser, with optional local Atlassian AIGW, Slack, Discord, and fresh ports.'
---

# OpenClaw Local Test

Use this skill to provide a ready-to-use local OpenClaw instance for manual testing in a browser.

## Default Workflow

1. Ensure the helper exists on PATH:
   - Prefer `~/.local/bin/openclaw-local-test` if present.
   - If missing or clearly stale, install the bundled helper:

```bash
install -m 755 scripts/openclaw-local-test ~/.local/bin/openclaw-local-test
```

2. Start the full manual-test instance. Pass the source config explicitly so the
   user can confirm which local credentials/config will be mirrored:

```bash
openclaw-local-test --repo ~/repos/openclaw --base-config ~/.openclaw/openclaw.json
```

3. Inspect the generated OpenClaw config before testing behavior.
   The running Gateway uses `~/.openclaw-local-test/openclaw.json`,
   not the source config directly. Check the active agent defaults,
   agent list, permissions, tools, plugins, and gateway auth/bind
   settings so manual-test behavior is interpreted against the actual
   agent configuration.

```bash
node - "$HOME/.openclaw-local-test/openclaw.json" <<'NODE'
const fs = require("node:fs");
const configPath = process.argv[2];
const config = JSON.parse(fs.readFileSync(configPath, "utf8"));
const secretKey = /(api[-_]?key|token|secret|password|credential|cookie|authorization)/i;

function redact(value) {
  if (Array.isArray(value)) return value.map(redact);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(Object.entries(value).map(([key, nested]) => [
    key,
    secretKey.test(key) ? "[redacted]" : redact(nested),
  ]));
}

const agentSummary = (agent) => ({
  id: agent?.id,
  default: agent?.default,
  model: agent?.model,
  permissions: redact(agent?.permissions),
  tools: redact(agent?.tools),
  plugins: redact(agent?.plugins),
});

console.log(JSON.stringify({
  configPath,
  gateway: {
    mode: config.gateway?.mode,
    bind: config.gateway?.bind,
    auth: config.gateway?.auth,
  },
  agents: {
    defaults: {
      model: config.agents?.defaults?.model,
      permissions: redact(config.agents?.defaults?.permissions),
      tools: redact(config.agents?.defaults?.tools),
      plugins: redact(config.agents?.defaults?.plugins),
      thinkingDefault: config.agents?.defaults?.thinkingDefault,
    },
    list: Array.isArray(config.agents?.list) ? config.agents.list.map(agentSummary) : [],
  },
  rootPermissions: redact(config.permissions),
  tools: redact(config.tools),
  plugins: {
    allow: config.plugins?.allow,
    entries: redact(config.plugins?.entries),
  },
}, null, 2));
NODE
```

Do not paste raw config or secrets into chat. Summarize only the settings
that matter for the test, especially permission/approval behavior and
which agent is active.

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

6. Report:
   - browser URL, usually `http://localhost:<browser-proxy-port>/`
   - Gateway port and browser proxy port
   - provider/model, usually `atlassian-aigw/gpt-5.5-2026-04-23`
   - config path, active agent id, and relevant permission/tool/plugin
     settings
   - lease expiry time
   - whether Slack and Discord started or any degraded logs appeared
   - `openclaw-local-test --status` and `openclaw-local-test --stop`

## Helper Behavior

The helper:

- chooses a free Gateway/browser proxy port pair from `19010` upward
- writes isolated state to `~/.openclaw-local-test`
- rotates previous per-agent session history on each start so stale provider
  replay state cannot poison manual tests. Set
  `OPENCLAW_LOCAL_TEST_KEEP_SESSIONS=1` only when resume behavior is the thing
  being tested.
- mirrors the explicitly provided `--base-config` so Slack and Discord credentials/config can follow the test instance when the user chooses that
- normalizes the manual-test default model to `atlassian-aigw/gpt-5.5-2026-04-23`
- keeps the source agent configuration unless the helper explicitly
  rewrites a field, so permissions, approvals, tools, and plugin
  allowlists can affect the local test
- forces `tools.exec.host` to `"auto"` so exec auto-review PRs can be tested directly
- starts the local Atlassian AIGW launchd service when available
- starts one shared browser-safe localhost proxy daemon and registers a per-instance route/port for the Gateway
- serializes startup with a machine-wide lock so concurrent agents do not choose the same free-looking port before either process binds it
- verifies the Gateway listener belongs to the Gateway it just started and the browser proxy route belongs to the shared proxy daemon before reporting success
- leaves the browser closed by default and prints the proxied Control UI
  URL. Use `--open` when the browser should launch automatically.
- writes a local lease file and starts a detached watchdog that auto-stops the managed Gateway/proxy after the TTL. The default TTL is `8h`.

The generated config intentionally uses loopback-only, unauthenticated local UI settings for convenience. Running the helper creates a second local copy of the selected config under the state directory. Do not expose the port publicly or paste secrets from the mirrored config into chat.

## Common Options

- Use a specific OpenClaw checkout/worktree:

```bash
openclaw-local-test --repo ~/repos/openclaw/.worktrees/pr-80922 --base-config ~/.openclaw/openclaw.json
```

- Open the UI after startup:

```bash
openclaw-local-test --open
```

- Open in Chrome after startup:

```bash
openclaw-local-test --open --browser "Google Chrome"
```

- Use a shorter or longer lease:

```bash
openclaw-local-test --ttl 2h
openclaw-local-test --ttl 30m
```

- Keep the browser closed:

```bash
openclaw-local-test --no-open
```

- Smoke-test the launcher without starting Slack/Discord listeners:

```bash
openclaw-local-test --no-open --no-channels
```

Stop smoke instances after verification unless the user explicitly wants to keep that reduced instance running.

- Disable the watchdog only when the user explicitly asks for a long-lived instance:

```bash
openclaw-local-test --no-ttl
```

- Inspect or stop the managed instance:

```bash
openclaw-local-test --status
openclaw-local-test --stop
```

## Troubleshooting

- If startup fails, read `~/.openclaw-local-test/logs/gateway.err.log` first, then `gateway.log`.
- If the browser proxy route fails, inspect `~/.openclaw-local-test-proxy/logs/shared-browser-proxy.err.log`.
- If another agent is starting OpenClaw at the same time, the helper may briefly print `waiting for OpenClaw startup lock`; let it wait instead of manually choosing a port.
- If the health endpoint was live but later disappears, check `openclaw-local-test --status`; the helper detaches processes with `setsid`/`nohup`, so a stopped process usually means Gateway startup or channel init failed.
- If an instance should have auto-stopped but did not, run `openclaw-local-test --status`, then `openclaw-local-test --stop`. For compatibility-state instances, use `openclaw-dia-test --status` and `openclaw-dia-test --stop`.
- If Slack/Discord should be live but are not connected, verify the run was not started with `--no-channels`, then inspect the channel startup lines in `gateway.log`.
- If the Atlassian provider fails, verify the AIGW proxy is listening locally and inspect `~/Library/Logs/openclaw-aigw-proxy/stderr.log`.
- `openclaw-dia-test` is a compatibility command for older muscle memory. Prefer `openclaw-local-test` in new instructions.
