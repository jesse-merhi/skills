---
name: wait-efficiently
description: 'Manage CI monitoring, prolonged commands, timed delays, and pending agents with bounded waits.'
---

# Wait efficiently

Start the operation once. For waits that return on completion, calculate:

```text
wait_ms = min(tool_limit_ms, update_due_in_ms - 5000)
```

Use an exposed maximum as `tool_limit_ms`. A documented default is a fallback, not a maximum: when the schema accepts an explicit duration, use the longest duration already confirmed on that host, bounded by the required update deadline. If longer values are unverified, start with the default. Without a required update, use the exposed maximum or longest confirmed duration. If the result is zero, negative or below the tool's minimum, send the update first. Completion returns early; no runtime estimate is needed.

When one wait runs inside an outer execution cell, give the outer cell the full `wait_ms`. A shorter outer default wakes the model without changing the operation's state.

- CI: use one [GitHub watch command](references/github-actions.md).
- Requested delays: use the host's `sleep` tool or `quiet-wait 5m` for the requested duration.

Retain command-session IDs and run-owned log/result paths before waiting. An outer execution cell and its inner command have different handles. If the outer handle disappears, recover the existing command or saved result before considering a relaunch.

On timeout, resume the same handle. Send required updates from known state. Read logs to check a result, diagnose failure or investigate a stall, not just because a timer expired.

## Commands and agents

Use the current host's exposed schemas.

1. For a command, use tracked `Bash` with `run_in_background: true` when completion notifications are supported. Keep the task ID, do independent work, then inspect its terminal result on notification.
2. Without that notification contract, hold the foreground command and use the exposed task-result mechanism until it finishes. Do not replace it with a new shell process.
3. For an authorized subagent, use the exposed `Agent` tool and its completion mechanism. Keep its handle; resume only when its history belongs to the task. A cold reviewer must be fresh, not a resumed or forked implementation worker.

Use `Monitor` only if exposed and repeated actionable events are needed, not for one completion. Filter its output for meaningful changes and failures, and respect its lifetime and timeout limits.

For external state without tracked completion, use a host scheduling tool only when the user requested a later check. Do not add a timer for an already-tracked command or agent. Missing tools are a limitation to report, not permission to install replacements or change authentication.

## Required agent results

Give workers bounded assignments. Return one final result with the outcome, revision/build, evidence, findings, verification and unresolved decisions; identify missing evidence. Send interim messages only when they change someone's next action.

Finish independent work, then wait on existing worker handles. Preserve handles and results for recovery. Act on completion, failure, decisions or user input; resume after routine messages and timeouts without check-ins. Diagnose errors or concrete stalls, not elapsed waits alone.

Honor host wait limits and required updates. Keep the parent active unless the host guarantees completion will wake an ended turn. Do not build a polling workaround for missing suspension support.
