---
name: wait-efficiently
description: 'Manage CI monitoring, prolonged commands, timed delays, and pending agents with bounded waits.'
---

# Wait efficiently

Start the operation once. For a wait that returns as soon as the operation completes, choose:

```text
wait_ms = no update deadline
  ? supported_hold_ms
  : min(supported_hold_ms, update_due_in_ms - safety_margin_ms)
```

Derive `supported_hold_ms` from the tool schema and the current host's actual constraints. Use an exposed maximum when allowed. If the tool accepts an explicit duration without exposing a maximum, choose a meaningful long hold for the operation, such as minutes for a minutes-long command, within known blocking limits. A documented default is a starting value, not a cap. If the host rejects or clamps the duration, adjust the next wait on the same handle. State the uncertainty when tool behavior is unknown.

A completion wait returns early, so an estimate must not shorten it. Use runtime estimates only to choose among otherwise-supported long holds or to size a check for a system that can only poll. For example, an early-return tool with a one-hour maximum and no update deadline should receive one hour even when the operation usually takes five minutes. On a host that requires an update within 60 seconds and disallows longer blocking calls, use a hold such as 55 seconds to leave time for the update; that host constraint does not apply elsewhere. If the calculation is zero, negative or below the tool's minimum, send the update first.

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

Give workers bounded assignments. Route each result to the agent that made the assignment: for example, a test executor returns to the execution owner, and the execution owner returns to the main coordinator. Return one final result with the outcome, revision/build, evidence, findings, verification and unresolved decisions; identify missing evidence. Do not copy routine state to ancestor agents. Send an interim message only when it changes the immediate owner's next action.

Finish independent work, then wait on existing worker handles. Preserve handles and results for recovery. Act on completion, failure, decisions or user input; resume the same long wait after routine messages and quiet timeouts without check-ins. Use an immediate snapshot only to answer a status-only request or diagnose a concrete stall. Diagnose errors or concrete stalls, not elapsed waits alone.

Honor host wait limits and required updates. Keep the parent active unless the host guarantees completion will wake an ended turn. Do not build a polling workaround for missing suspension support.
