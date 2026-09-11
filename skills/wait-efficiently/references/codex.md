# Codex waits

Use code mode for command execution and waiting. If `functions.exec` and `functions.wait` are unavailable, report the missing capability before starting a long-running command. Command sessions, CLI agents, and Desktop tasks have different handles.

## Choose the outer wait

Apply [the wait calculation](../SKILL.md) to `functions.exec` and each `functions.wait` continuation. Set the exec deadline with a first-line pragma, such as `// @exec: {"yield_time_ms": 30000}`. Recalculate before each continuation so time already spent counts toward the next update.

Command launch and resume tools have separate limits. The outer cell's deadline controls when it yields to the model, even if an inner wait is longer.

## Commands

1. Launch once with `exec_command`, using its allowed `yield_time_ms`.
2. If it returns `session_id`, resume with `write_stdin({ session_id, chars: "", yield_time_ms })`. Use the resume tool's own limit, not the shorter launch limit.
3. Await launch and resume in a loop inside one `functions.exec` cell. If it returns a running cell ID, continue that cell with `functions.wait` and the calculated deadline.
4. Collect the terminal exit code and output. Keep full validation/review output in a run-owned file; inspect it when output is truncated. A timeout or session ID is not success.

Do not replace code mode with separate launch and polling calls. Use direct calls only for tools the host excludes from code mode, such as native agent controls. Do not use `notify` or `yield_control` for unchanged progress.

## Required agent results

Dispatch once, finish independent work, then use the exposed native agent event wait. For existing Desktop tasks, use `wait_threads` with returned handles and cursors; do not create a new task just to wait. Batch required targets within the tool's limit and resume after timeouts or unrelated messages instead of repeatedly listing status. Inspect status only for errors or repeated timeouts.

Keep the parent turn active until required work is terminal unless the current host explicitly guarantees completion will wake an ended turn. Parallel subagent support and `notify` do not establish that guarantee.
