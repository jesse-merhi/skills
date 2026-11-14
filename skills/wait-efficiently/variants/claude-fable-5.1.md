---
name: wait-efficiently
description: 'Use before waiting on CI, a long command, a timed delay or a delegated agent.'
---

# Wait efficiently

Start once and retain the completion handle. Never create a helper or thread solely to monitor.

## PRs and CI

Use one supported monitor. Handle existing reviews/comments first and reconcile notifications against the current head and checks. Disclose uncovered queue, combined-check or reaction events; an authorized workflow may reconcile them.

- **T3 PR watch:** call `watch_pull_request`, verify `watching: true`, then end the turn. Before returning work to the user, `unwatch_pull_request` and verify false. Do not add a CLI watcher beside it.
- **Specific CI run or no native PR monitor:** use one [GitHub watch command](references/github-actions.md).

## Tasks and sessions

Keep the launcher’s completion handle; task, session and command IDs are not interchangeable. On timeout, resume the same operation and read its actual result before declaring completion. Keep the parent active unless completion is guaranteed to wake an ended turn.

For T3 delegated tasks, keep `taskId`; completion wakes the parent, while `task_status` retrieves a result mid-turn. For ordinary T3 threads, pin `runId` in `t3_thread_wait`, then read results with `t3_thread_read`; use `nextPosition` as `afterPosition` for incremental history.

## Completion waits

Hold the longest early-return wait the host allows; send an update first if a deadline is near. For requested delays, use the host's `sleep` or `quiet-wait 5m`.

Save command IDs and run-owned log/result paths before waiting. Outer cells and inner commands have distinct handles. After a lost handle, recover the operation or saved result before relaunching; timeout isn't completion. Inspect logs for results, failures or concrete stalls, not elapsed time alone.

Keep interactive prompts visible alongside saved logs; complete shared sign-in before batching dependent commands. File-only output suits unattended commands. When user action is required, explain it and wait.

## Commands and agents

Use tracked `Bash` with `run_in_background: true` when completion notifications exist; otherwise hold the foreground command and follow its exposed completion handle. Use `Agent` for authorized subagents; independent reviewers start fresh. Use `Monitor` only for repeated actionable events, respecting its lifetime and limits.

Schedule external-state checks only when authorized and no tracked completion covers them. Missing tools require reporting, not replacement installs or authentication changes.
