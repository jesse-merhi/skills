# Config Inspection

Inspect the generated OpenClaw config before testing behavior. The running
Gateway uses `~/.openclaw-local-test/openclaw.json`. Report the selected native
runtime and safety overlay without printing raw auth material or private
endpoint values.

```bash
node - "$HOME/.openclaw-local-test/openclaw.json" <<'NODE'
const fs = require("node:fs");
const configPath = process.argv[2];
const config = JSON.parse(fs.readFileSync(configPath, "utf8"));
const secretKey = /(api[-_]?key|token|secret|password|credential|cookie|authorization|baseurl|endpoint|proxy)/i;

function redact(value) {
  if (Array.isArray(value)) return value.map(redact);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(
    Object.entries(value).map(([key, nested]) => [
      key,
      secretKey.test(key) ? "[redacted]" : redact(nested),
    ]),
  );
}

const entries = config.agents?.entries && typeof config.agents.entries === "object"
  ? Object.fromEntries(
      Object.entries(config.agents.entries).map(([id, agent]) => [
        id,
        {
          default: agent?.default,
          model: agent?.model,
          workspace: agent?.workspace,
          tools: redact(agent?.tools),
        },
      ]),
    )
  : {};

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
      models: redact(config.agents?.defaults?.models),
      workspace: config.agents?.defaults?.workspace,
    },
    entries,
  },
  tools: redact(config.tools),
  plugins: {
    allow: config.plugins?.allow,
    entries: redact(config.plugins?.entries),
  },
}, null, 2));
NODE
```

For Codex, verify the selected model has `agentRuntime.id: "codex"` and the
Codex plugin uses `appServer.homeScope: "user"`. For Claude, verify the model
has `agentRuntime.id: "claude-cli"` and the Anthropic plugin is enabled.

Do not paste raw config into chat. Summarize only the settings that explain the
test's behavior.
