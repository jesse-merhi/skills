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

Give each worker a bounded assignment with a revision/build, acceptance evidence and reserved decisions. When it finishes, fails or needs a decision, require one final result: outcome, examined revision/build and relevant uncommitted changes, evidence locations, findings, verification and unresolved choices. State when a revision or evidence is unavailable. A new assignment needs a new brief.

Workers send interim messages only for blockers, scope changes or information that changes another worker's action. Honor required host updates; routine progress needs no coordinator acknowledgement.

Finish useful independent work, then wait on the existing worker. Save handles, cursors and evidence locations in the task's notes or session storage for recovery. When a result arrives, preserve its evidence and integrate, diagnose or resolve the decision within existing authority. If a worker fails without a result, retrieve its available error and report missing evidence. Act on user input before resuming the wait.

After a timeout or routine message, resume the event wait without a status query or acknowledgement. Repeated timeouts alone do not prove a stall. Inspect status or logs for a tool error, missed task deadline or concrete evidence that progress stopped. Give required host updates from known state; do not request worker check-ins for them.

Use the longest event wait allowed by the tool and the host's update and blocking-call limits. Keep the parent turn active while required work is pending unless the host explicitly guarantees that completion wakes an ended turn. Background execution and completion notifications alone do not guarantee this. Report unsupported suspension as a host limit; do not emulate it with polling agents, timers or orchestration services.
