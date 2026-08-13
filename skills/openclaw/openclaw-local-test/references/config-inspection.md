# Config Inspection

Inspect the generated OpenClaw config before testing behavior. The running
Gateway uses `~/.openclaw-local-test/openclaw.json`. Report the selected native
runtime and safety overlay without printing raw auth material or private
endpoint values.

Run the skill-owned inspector so Effect and its schema decoder resolve from the
installed skill checkout rather than the caller's working directory:

```bash
<skill-dir>/scripts/inspect-config "$HOME/.openclaw-local-test/openclaw.json"
```

For Codex, verify the selected model has `agentRuntime.id: "codex"` and the
Codex plugin uses `appServer.homeScope: "user"`. For Claude, verify the model
has `agentRuntime.id: "claude-cli"` and the Anthropic plugin is enabled.

Do not paste raw config into chat. Summarize only the settings that explain the
test's behavior.
