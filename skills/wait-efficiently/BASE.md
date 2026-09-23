---
name: wait-efficiently
description: 'Manage CI monitoring, prolonged commands, timed delays, and pending agents with bounded waits.'
---

# Wait efficiently

Start the operation once. For an early-return completion wait, choose:

```text
wait_ms = no update deadline
  ? supported_hold_ms
  : min(supported_hold_ms, update_due_in_ms - safety_margin_ms)
```

Derive `supported_hold_ms` from the tool schema and actual host limits. Use the exposed maximum when allowed. Without one, choose a meaningful long hold within known blocking limits; defaults are not caps. If rejected or clamped, adjust the next wait on the same handle and state unknown behavior.

Do not shorten an early-return wait to a runtime estimate. Use estimates only to choose among supported long holds or size a poll-only check. A one-hour maximum with no update deadline means one hour, even for a five-minute operation. If the host requires updates within 60 seconds and forbids longer blocks, use about 55 seconds; that constraint is host-specific. If the calculation falls below the tool minimum, update first.

Give an outer execution cell the full inner `wait_ms`; a shorter outer default wakes the model without advancing the operation.

- Commands and agents: wait on their existing completion handles.
- CI: use one [GitHub watch command](references/github-actions.md).
- Requested delays: use the host's `sleep` tool or `quiet-wait 5m` for the requested duration.

Save command-session IDs and run-owned log/result paths before waiting. Outer cells and inner commands have different handles. If the outer handle disappears, recover the existing command or saved result before considering a relaunch.

On timeout, resume the same handle and update from known state. Read logs for a result, failure or concrete stall, not merely because time passed.

## Required agent results

Give workers bounded assignments. Return one result with outcome, revision/build, evidence, findings, verification, unresolved decisions and missing evidence. Interim messages should change someone's next action.

Finish independent work before waiting on saved worker handles. Act on completion, failure, decisions or user input. After routine messages or quiet timeouts, resume the same wait without check-ins. Snapshot immediately only for status requests or concrete stalls; elapsed time alone is not a stall.

Honor host wait limits and required updates. Keep the parent active unless the host guarantees completion will wake an ended turn. Do not build a polling workaround for missing suspension support.
