# Codex waits

Use the current host's exposed tools. Command sessions, CLI agents, and Desktop tasks have different handles.

## Choose the outer wait

Estimate the operation’s remaining duration, then set `functions.exec` and any `functions.wait` continuation to a suitable deadline within the current host’s limits and communication requirements. A check expected to finish within four minutes can use `// @exec: {"yield_time_ms": 300000}` as the cell’s first line, then `functions.wait({ cell_id, yield_time_ms: 300000 })` if needed, when five minutes of silence is permitted. Completion can return early.

Outer and command-launch limits may differ. Use the exposed tool contract and known host behavior; a host may cap an outer wait. Acceptance of a large value alone does not prove the host will hold it for that duration.

When an update is required within 60 seconds, choose a deadline that leaves time to send it; shorten the wait if an update is already due soon. That communication deadline is separate from runtime capacity. If an update becomes due while the cell is running, send it from the last known state and resume the same cell. This does not require another status command or log read.

A long inner `write_stdin` wait cannot keep a shorter outer wait open. Conversely, short inner waits can be resumed inside one held JavaScript cell without returning to the model between them.

## Commands

1. Launch once with `exec_command`. Set `yield_time_ms` for the expected duration within its limit.
2. If it returns `session_id`, resume with `write_stdin({ session_id, chars: "", yield_time_ms })`. Use the resume tool's own limit, not the shorter launch limit.
3. In code mode, await launch and subsequent command resumes in a loop inside one `functions.exec` cell until terminal. Set its outer yield as described above. If the cell returns a running cell ID, resume it with `functions.wait` and an explicit yield; do not start another command or abandon pending promises.
4. Collect the terminal exit code and output. Keep full validation/review output in a run-owned file; inspect it when output is truncated. A timeout or session ID is not success.

Without code mode, call the exposed command and resume tools directly. A shell helper cannot call host tools. Do not use `notify` or `yield_control` for unchanged progress.

## Required agent results

Dispatch once, finish independent work, then use the exposed native agent event wait. For existing Desktop tasks, use `wait_threads` with returned handles and cursors; do not create a new task just to wait. Batch required targets within the tool's limit and resume after timeouts or unrelated messages instead of repeatedly listing status. Inspect status only for errors or repeated timeouts.

Keep the parent turn active until required work is terminal unless the current host explicitly guarantees completion will wake an ended turn. Parallel subagent support and `notify` do not establish that guarantee.
