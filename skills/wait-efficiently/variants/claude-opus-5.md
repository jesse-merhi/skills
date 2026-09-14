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

At dispatch, define the bounded assignment, revision or build, acceptance evidence and decisions reserved for the coordinator or user. Require one final result when the assignment completes, fails or needs a decision. The result states that outcome, the revision/build actually examined (including relevant uncommitted changes), evidence locations and any unresolved choice. If work stops before a revision or evidence exists, say so. Keep domain-specific findings and verification in that result; a status label alone is insufficient.

Workers send interim messages only for blockers, changed scope or information that changes another worker's action, while honoring required host updates. Routine progress needs no coordinator acknowledgement. A worker returns when its assignment is finished or blocked; a new assignment requires a new brief.

Finish useful independent work, then wait on the existing worker's native completion mechanism. Retain worker handles, cursors and result/evidence locations in the task's existing notes or session storage so recovery does not require rereading full histories. On a terminal result, preserve the evidence and integrate, diagnose or resolve the decision within existing authority. Worker failure without a final result still requires action: retrieve the available error and report missing evidence. User intervention takes priority over continuing the wait.

On a timeout or routine progress message, resume the event wait without a status query or acknowledgement. A timeout alone, even repeated, is not evidence of a stall. Inspect status or logs for a tool error, a missed task-specific deadline or other concrete evidence that progress stopped. Send host-required updates from known state; they do not require worker check-ins.

Use the longest event wait allowed by both the exposed tool and the host's update and blocking-call limits. A tool's larger maximum does not override the host. Keep the parent turn active while required work is pending unless the host explicitly guarantees completion will wake an ended turn. Completion notifications, parallel agents and background execution do not alone establish that guarantee. Report unsupported suspension as a host limitation; do not add polling agents, timers or orchestration services to emulate it.
