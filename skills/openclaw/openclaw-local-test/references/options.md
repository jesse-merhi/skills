# Common Options

Use a specific OpenClaw checkout/worktree:

```bash
openclaw-local-test --repo ~/repos/openclaw/.worktrees/pr-80922 --base-config ~/.openclaw/openclaw.json
```

Open the UI after startup:

```bash
openclaw-local-test --open
```

Open in Chrome after startup:

```bash
openclaw-local-test --open --browser "Google Chrome"
```

Use a shorter or longer lease:

```bash
openclaw-local-test --ttl 2h
openclaw-local-test --ttl 30m
```

Keep the browser closed:

```bash
openclaw-local-test --no-open
```

Smoke-test the launcher without starting Slack/Discord listeners:

```bash
openclaw-local-test --no-open --no-channels
```

Stop smoke instances after verification unless the user explicitly wants to keep
that reduced instance running.

Disable the watchdog only when the user explicitly asks for a long-lived
instance:

```bash
openclaw-local-test --no-ttl
```

Inspect or stop the managed instance:

```bash
openclaw-local-test --status
openclaw-local-test --stop
```
