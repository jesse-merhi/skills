# Codex waits

Use the current host's exposed tools. Command sessions, CLI agents, and Desktop tasks have different handles.

## Commands

1. Launch once with `exec_command`. Set `yield_time_ms` for the expected duration within its limit.
2. If it returns `session_id`, resume with `write_stdin({ session_id, chars: "", yield_time_ms })`. Use the resume tool's own limit, not the shorter launch limit.
3. In code mode, await launch and every resume inside one `functions.exec` cell. If that cell returns a running cell ID, resume it with `functions.wait`; do not start another command or abandon pending promises.
4. Collect the terminal exit code and output. Keep full validation/review output in a run-owned file; inspect it when output is truncated. A timeout or session ID is not success.

Without code mode, call the exposed command and resume tools directly. A shell helper cannot call host tools. Do not use `notify` or `yield_control` for unchanged progress.

## Required agent results

Dispatch once, finish independent work, then use the exposed native agent event wait. For existing Desktop tasks, use `wait_threads` with returned handles and cursors; do not create a new task just to wait. Batch required targets within the tool's limit and resume after timeouts or unrelated messages instead of repeatedly listing status. Inspect status only for errors or repeated timeouts.

Keep the parent turn active until required work is terminal unless the current host explicitly guarantees completion will wake an ended turn. Parallel subagent support and `notify` do not establish that guarantee.
