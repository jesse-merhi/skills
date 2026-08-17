# Codex hold mechanisms

Codex API surface, current as of Codex CLI 0.147. Replace this file when the
API changes; the rules in `SKILL.md` do not change with it.

## Shell commands

Keep the wait inside one code-mode cell so its internal waits never become model
turns. Raise the cell's own budget with the `@exec` directive: an inner
`yield_time_ms` cannot outlive the cell that holds it.

```js
// @exec: {"yield_time_ms": 900000, "max_output_tokens": 10000}
const maxOutputTokens = 10000;
let result = await tools.exec_command({
  cmd: "<command>",
  yield_time_ms: 300000,
  max_output_tokens: maxOutputTokens
});
const output = [result.output];
let originalTokens = result.original_token_count ?? 0;
while (result.session_id) {
  result = await tools.write_stdin({
    session_id: result.session_id,
    chars: "",
    yield_time_ms: 300000,
    max_output_tokens: maxOutputTokens
  });
  output.push(result.output);
  originalTokens += result.original_token_count ?? 0;
}
text(output.filter(Boolean).join(""));
if (originalTokens > maxOutputTokens) {
  throw new Error("command output exceeded the safe result budget; inspect its persisted artifact");
}
if (result.exit_code !== 0) {
  throw new Error(`command exited with code ${result.exit_code ?? "unknown"}`);
}
```

An empty `write_stdin` returns when the process exits. Every `yield_time_ms`
here is a ceiling on how long the call may block, so 300000 costs nothing when
the command finishes in ten seconds.

A 30-second yield is the most expensive setting available. It turns each cell
into an alternating `write_stdin` and `functions.wait` treadmill: a
twenty-minute build spends forty round trips reporting that it is still running.

Accumulate each terminal result inside the cell so output received before the
final wait is not lost. Make any command behind a review or validation gate
persist its full artifact to a run-owned file. When a terminal result reports
more original tokens than its output budget, fail the gate and inspect that
artifact rather than classifying truncated output.

If the outer cell yields before the process finishes, resume that cell with one
`functions.wait` call carrying the same 300000 floor. Do not restart the
command, call `notify`, or use `yield_control` for unchanged progress.

## Subagents

Finish useful independent work after dispatch. Once blocked on a result, call
`wait_agent` with `timeout_ms: 600000`; it returns early when mailbox activity
arrives. Read the completed result, and wait again only when the required agent
is still running after an unrelated event or the deadline.

Keep the parent turn active until every required agent reaches a terminal state.
Reach for a further `wait_agent` rather than `list_agents`, a short repeated
wait, a sleep, or a status heartbeat. `notify` is not a replacement: it cannot
start a new parent turn after that turn has ended.

## Independent calls

Nested calls inside one cell are the only batching Codex code mode offers, and
independent read-only calls belong in a single `Promise.all`. This applies to
the reads that surround a wait as much as to the wait itself.
