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

- Commands and agents: wait on their existing completion handles.
- CI: use one [GitHub watch command](references/github-actions.md).
- Requested delays: use the host's `sleep` tool or `quiet-wait 5m` for the requested duration.

Retain command-session IDs and run-owned log/result paths before waiting. An outer execution cell and its inner command have different handles. If the outer handle disappears, recover the existing command or saved result before considering a relaunch.

On timeout, resume the same handle. Send required updates from known state. Read logs to check a result, diagnose failure or investigate a stall, not just because a timer expired.

## Required agent results

Give workers bounded assignments. Route each result to the agent that made the assignment: for example, a test executor returns to the execution owner, and the execution owner returns to the main coordinator. Return one final result with the outcome, revision/build, evidence, findings, verification and unresolved decisions; identify missing evidence. Do not copy routine state to ancestor agents. Send an interim message only when it changes the immediate owner's next action.

Finish independent work, then wait on existing worker handles. Preserve handles and results for recovery. Act on completion, failure, decisions or user input; resume after routine messages and timeouts without check-ins. Diagnose errors or concrete stalls, not elapsed waits alone.

Honor host wait limits and required updates. Keep the parent active unless the host guarantees completion will wake an ended turn. Do not build a polling workaround for missing suspension support.
