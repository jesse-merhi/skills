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

Use code mode for command execution and waiting. If `functions.exec` and `functions.wait` are unavailable, report the missing capability before starting a long-running command. Command sessions, CLI agents, and Desktop tasks have different handles.

### Choose the outer wait

Apply the wait calculation above to `functions.exec` and each `functions.wait` continuation. Set the exec deadline with a first-line pragma, such as `// @exec: {"yield_time_ms": 30000}`. Recalculate before each continuation so time already spent counts toward the next update.

Command launch and resume tools have separate limits. The outer cell's deadline controls when it yields to the model, even if an inner wait is longer.

### Commands

1. Choose a unique run-owned directory outside the checkout. Save the command's full output there and write its exit status to a result file only when it finishes. Retain these paths before launch.
2. Launch once with `exec_command`, using its allowed `yield_time_ms`. When it returns `session_id`, retain and emit that inner command ID before awaiting `write_stdin`.
3. Await launch and resume in a loop inside one `functions.exec` cell. A running cell ID belongs to `functions.wait`; a command `session_id` belongs to `write_stdin`. Recalculate the outer wait before continuing.
4. Collect the exit code and inspect the saved log for the needed evidence. A timeout, missing handle or session ID is not success.

For example, after choosing a fresh directory, adapt this validation launch to the task's authorized command. The shell wrapper saves the command's exit status even when validation fails. Keep untrusted values out of shell interpolation; use proper shell quoting when paths or commands vary.

```javascript
// @exec: {"yield_time_ms": 30000, "max_output_tokens": 1500}
const recovery = {
  logPath: "/tmp/review-run-unique/validation.log",
  resultPath: "/tmp/review-run-unique/validation.exit"
};
store("validationRecovery", recovery);
notify(recovery);
let result = await tools.exec_command({
  cmd: "mkdir -p /tmp/review-run-unique && (bun run validate:effect > /tmp/review-run-unique/validation.log 2>&1; command_exit=$?; printf '%s\n' \"$command_exit\" > /tmp/review-run-unique/validation.exit; exit \"$command_exit\")",
  yield_time_ms: 1000,
  max_output_tokens: 1000
});
while (result.session_id !== undefined) {
  if (recovery.sessionId !== result.session_id) {
    recovery.sessionId = result.session_id;
    store("validationRecovery", recovery);
    notify(recovery); // Recovery identity before entering the inner wait.
  }
  result = await tools.write_stdin({
    session_id: result.session_id, chars: "", yield_time_ms: 60000,
    max_output_tokens: 1000
  });
}
store("validationResult", result);
text({ exitCode: result.exit_code, ...recovery });
```

The short launch exposes its command ID promptly; calculate outer and resume waits for the current update deadline and tool limits. Emit the recovery identity on launch or when it changes, not on every unchanged timeout. A run-owned log preserves shell output even if the outer cell's in-memory result disappears.

If `functions.wait` reports that its cell is unavailable, retrieve the retained recovery record (or the emitted paths/ID after a context transition). Try `write_stdin` with the command session ID, then inspect the saved exit status and log. For CI, query the same remote run's terminal status. Recover that existing result before considering another launch. If neither the session nor a terminal result is available, inspect the original process or external operation and report what remains unknown; a missing cell alone does not authorize duplicating work.

Do not replace code mode with separate launch and polling calls. Use direct calls only for tools the host excludes from code mode, such as native agent controls. `notify` above exposes recovery pointers; do not use it or `yield_control` for unchanged progress. This repository cannot restore the host's outer-cell registry or guarantee retention across host resets.

### Bound task-status output

For existing Desktop tasks, prefer a compact `wait_threads` snapshot (`timeoutMs: 0`) when only status is needed. Keep returned IDs and cursors for later waits. When history is needed, request only relevant turns and output detail.

Batch independent reads with `Promise.allSettled` and store each full result before emitting anything. Inspect each fulfilled result or error, then emit only status, the latest relevant result and recovery handles from the tool's returned schema. Keep large histories and logs in stored results or run-owned files so a later question can select more detail without refetching. Budget the combined emitted text against `functions.exec`'s `max_output_tokens`; per-call limits do not bound the whole batch.

Required instruction documents must still be read in full. Split them into output-sized batches or consecutive ranges, inspect each part, and resume from the last fully read range if a response is clipped. Do not replace required document text with a summary to fit more calls in one cell.

## Required agent results

Give workers bounded assignments. Return one final result with the outcome, revision/build, evidence, findings, verification and unresolved decisions; identify missing evidence. Send interim messages only when they change someone's next action.

Finish independent work, then wait on existing worker handles. Preserve handles and results for recovery. Act on completion, failure, decisions or user input; resume after routine messages and timeouts without check-ins. Diagnose errors or concrete stalls, not elapsed waits alone.

Honor host wait limits and required updates. Keep the parent active unless the host guarantees completion will wake an ended turn. Do not build a polling workaround for missing suspension support.

Use `wait_agent` directly when the host excludes agent controls from code mode. It can wake for any mailbox message; resume after routine messages. For existing Desktop tasks, use `wait_threads` with saved IDs and cursors, batching targets within its limit. Commentary does not wake it. Reserve zero-time snapshots for status requests or diagnosis. Do not create a Desktop task just to wait.
