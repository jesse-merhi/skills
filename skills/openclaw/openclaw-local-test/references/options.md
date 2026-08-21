# Common options

Inspect both native clients without starting OpenClaw:

```bash
openclaw-local-test --inspect
```

Select the current Codex home, including its login and `config.toml` route:

```bash
openclaw-local-test --repo ~/repos/openclaw --runtime codex
```

Select the installed Claude CLI and its user settings:

```bash
openclaw-local-test --repo ~/repos/openclaw --runtime claude
```

Override the model when a test needs a specific route:

```bash
openclaw-local-test --runtime codex --model gpt-5.6-sol
openclaw-local-test --runtime claude --model claude-sonnet-5
```

Mirror an existing OpenClaw config only when its channel, plugin, or agent
settings are part of the test:

```bash
openclaw-local-test \
  --repo ~/repos/openclaw/.worktrees/pr-80922 \
  --base-config ~/.openclaw/openclaw.json
```

The helper does not copy Codex or Claude auth values into that config. Existing
secrets already present in an explicit base config remain present in the
isolated copy.

Open the UI after startup:

```bash
openclaw-local-test --open
openclaw-local-test --open --browser "Google Chrome"
```

Choose a lease or disable channels for a smoke test:

```bash
openclaw-local-test --ttl 30m
openclaw-local-test --no-open --no-channels
```

Stop smoke instances after verification. Disable the watchdog only when the
user explicitly requests a long-lived instance:

```bash
openclaw-local-test --no-ttl
```

Inspect or stop the managed instance:

```bash
openclaw-local-test --status
openclaw-local-test --stop
```
