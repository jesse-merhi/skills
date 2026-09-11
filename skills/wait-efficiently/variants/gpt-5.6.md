---
name: wait-efficiently
description: 'Manage CI monitoring, prolonged commands, timed delays, and pending agents with bounded waits.'
---

# Wait efficiently

Start the operation once. For waits that return on completion, calculate:

```text
wait_ms = min(tool_limit_ms, update_due_in_ms - 5000)
```

Use the tool's exposed maximum, or its documented default if no maximum is given. Without a required update, use that limit. If the result is zero, negative or below the tool's minimum, send the update first. Completion returns early; no runtime estimate is needed.

- Commands and agents: use [Codex](references/codex.md) or [Claude Code](references/claude.md).
- CI: use one [GitHub watch command](references/github-actions.md).
- Requested delays: use the host's `sleep` tool or `quiet-wait 5m` for the requested duration.

On timeout, resume the same handle. Send required updates from known state. Read logs to check a result, diagnose failure or investigate a stall, not just because a timer expired.
