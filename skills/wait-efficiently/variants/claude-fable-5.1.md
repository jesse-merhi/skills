---
name: wait-efficiently
description: 'Manage CI monitoring, prolonged commands, timed delays, and pending agents with bounded waits.'
---

# Wait efficiently

Start once and retain the completion handle. Never create a helper or thread solely to monitor.

## PRs and CI

Use one supported monitor. Handle existing reviews/comments first and reconcile notifications against the current head and checks. Disclose uncovered queue, combined-check or reaction events; an authorized workflow may reconcile them.

- **T3 PR watch:** call `watch_pull_request`, verify `watching: true`, then end the turn. Before returning work to the user, `unwatch_pull_request` and verify false. Do not add a CLI watcher beside it.
- **Specific CI run or no native PR monitor:** use one [GitHub watch command](references/github-actions.md).

## Tasks and sessions

Keep the launcher’s completion handle; task, session and command IDs are not interchangeable. On timeout, resume the same operation and read its actual result before declaring completion.

For T3 delegated tasks, keep `taskId`; completion wakes the parent, while `task_status` retrieves a result mid-turn. For ordinary T3 threads, pin `runId` in `t3_thread_wait`, then read results with `t3_thread_read`; use `nextPosition` as `afterPosition` for incremental history.

## Completion waits

Choose the longest supported early-return hold within the host's update deadline:

```text
wait_ms = no update deadline
  ? supported_hold_ms
  : min(supported_hold_ms, update_due_in_ms - safety_margin_ms)
```

Use tool schemas and actual host limits; defaults aren't caps. Runtime estimates don't shorten early-return waits. A 60-second update deadline permits about 55 seconds; update first if the budget falls below the tool minimum. Adjust rejected/clamped waits on the same handle. Give outer execution cells the full inner wait budget.

- Requested delays: the host's `sleep` or `quiet-wait 5m`.

Save command IDs and run-owned log/result paths before waiting. Outer cells and inner commands have distinct handles. After a lost handle, recover the operation or saved result before relaunching; timeout isn't completion. Inspect logs for results, failures or concrete stalls, not elapsed time alone.

Keep interactive prompts visible alongside saved logs; complete shared sign-in before batching dependent commands. File-only output suits unattended commands. When user action is required, explain it and wait.

## Commands and agents

Use tracked `Bash` with `run_in_background: true` when completion notifications exist; otherwise hold the foreground command and follow its exposed completion handle. Use `Agent` for authorized subagents; independent reviewers start fresh. Use `Monitor` only for repeated actionable events, respecting its lifetime and limits.

Schedule external-state checks only when authorized and no tracked completion covers them. Missing tools require reporting, not replacement installs or authentication changes.

## Workers

Give bounded assignments requiring outcome, revision/build, evidence, findings, verification and unresolved decisions. Interim messages should change the next action.

Finish independent work, then wait on saved handles. Resume after routine messages or quiet timeouts; inspect early for status requests or concrete stalls. Keep the parent active unless completion is guaranteed to wake an ended turn. Don't build a polling workaround.
