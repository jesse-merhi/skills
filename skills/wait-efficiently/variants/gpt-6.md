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

Use `functions.exec`/`functions.wait` code mode; report missing capability before a long command. Apply the calculated outer deadline with a first-line pragma on launch and each continuation, accounting for time already spent.

1. Choose a unique run-owned directory outside the checkout. Retain paths for full logs and a result file written with the final exit status.
2. Launch once with `exec_command`. Save and emit its `session_id` before waiting; that ID belongs to `write_stdin`, while the outer cell ID belongs to `functions.wait`.
3. Loop launch/resume inside one code cell, using the appropriate launch and resume limits. Emit recovery pointers when created or changed, not on quiet timeouts.
4. Inspect the exit code and saved evidence. If the outer cell disappears, recover through `write_stdin`, saved result/log, or the same remote CI run. Missing handles don't authorize duplicate work; report unknown state if recovery fails.

Keep interactive prompts visible. Use proper shell quoting for varying paths/commands and preserve a failing command's exit status in the result file. The host may lose outer-cell state; durable logs and emitted recovery pointers must survive it.

Batch independent unattended reads with `Promise.allSettled`, retaining every full result and inspecting each error. Use `yield_control` for required user action before awaiting remaining reads. Emit only relevant status/evidence and recovery handles within the combined output budget. Read required instruction documents fully in bounded ranges; recover clipped text instead of substituting summaries.

Use direct calls for agent controls excluded from code mode. Resume `wait_agent` after routine mailbox messages. For Codex app tasks, wait on saved IDs/cursors with `wait_threads`; reserve zero-time snapshots for status requests or diagnosis. Don't create a task merely to wait.

## Workers

Give bounded assignments requiring outcome, revision/build, evidence, findings, verification and unresolved decisions. Interim messages should change the next action.

Finish independent work, then wait on saved handles. Resume after routine messages or quiet timeouts; inspect early for status requests or concrete stalls. Keep the parent active unless completion is guaranteed to wake an ended turn. Don't build a polling workaround.
