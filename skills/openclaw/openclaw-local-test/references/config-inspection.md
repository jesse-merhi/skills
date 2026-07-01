# Config Inspection

Inspect the generated OpenClaw config before testing behavior. The running
Gateway uses `~/.openclaw-local-test/openclaw.json`, not the source config
directly. Check the active agent defaults, agent list, permissions, tools,
plugins, and gateway auth/bind settings so manual-test behavior is interpreted
against the actual agent configuration.

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

Do not paste raw config or secrets into chat. Summarize only the settings that
matter for the test, especially permission/approval behavior and which agent is
active.
