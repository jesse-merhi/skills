---
name: wait-efficiently
description: 'Manage CI monitoring, prolonged commands, timed delays, and pending agents with bounded waits.'
---

# Wait efficiently

Start once and retain the completion handle. Never create a helper or thread solely to monitor.

## T3

Use these routes for T3-owned work; native command/agent handles remain with their launcher.

- **PRs:** handle existing reviews/comments, call `watch_pull_request`, confirm `watching: true`, then end the turn. Reconcile wakes against the current head and checks. No duplicate CLI watcher or poller. Disclose uncovered queue, combined-check and reaction events; only an authorized workflow such as pr-burndown adds reconciliation. Before returning work to the user, `unwatch_pull_request` and verify `watching: false`.
- **Delegated tasks:** retain `taskId` and end the turn for its completion notification. Use `task_status` when the result is needed mid-turn or to reconcile a notification.
- **Threads:** pin `runId` in `t3_thread_wait`; omission selects the latest run. On timeout, resume that run. Read actual results with `t3_thread_read`; use `nextPosition` as `afterPosition` for incremental history.

## Completion waits

Choose the longest supported early-return hold within the host's update deadline:

```text
wait_ms = no update deadline
  ? supported_hold_ms
  : min(supported_hold_ms, update_due_in_ms - safety_margin_ms)
```

Use tool schemas and actual host limits; defaults aren't caps. Runtime estimates don't shorten early-return waits. A 60-second update deadline permits about 55 seconds; update first if the budget falls below the tool minimum. Adjust rejected/clamped waits on the same handle. Give outer execution cells the full inner wait budget.

- Commands and agents: use their existing completion handles.
- CI outside T3: one [GitHub watch command](references/github-actions.md).
- Requested delays: the host's `sleep` or `quiet-wait 5m`.

Save command IDs and run-owned log/result paths before waiting. Outer cells and inner commands have distinct handles. After a lost handle, recover the operation or saved result before relaunching; timeout isn't completion. Inspect logs for results, failures or concrete stalls, not elapsed time alone.

Keep interactive prompts visible alongside saved logs; complete shared sign-in before batching dependent commands. File-only output suits unattended commands. When user action is required, explain it and wait.

## Workers

Give bounded assignments requiring outcome, revision/build, evidence, findings, verification and unresolved decisions. Interim messages should change the next action.

Finish independent work, then wait on saved handles. Resume after routine messages or quiet timeouts; inspect early for status requests or concrete stalls. Keep the parent active unless completion is guaranteed to wake an ended turn. Don't build a polling workaround.
