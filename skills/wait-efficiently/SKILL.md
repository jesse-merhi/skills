---
name: wait-efficiently
description: 'Wait for commands, CI, or external work without token-heavy polling; report meaningful state changes.'
---

# Wait Efficiently

Before waiting, state what is being awaited and when the next meaningful update
will occur. Use the product-native wait mechanism, avoid unchanged heartbeat
updates, and return only for action, a deadline, or a meaningful state change.

## Subagents

Finish useful independent work after dispatch. Once blocked on subagent results,
make one native event-driven wait with a 10-minute deadline. In Codex, call
`wait_agent` with `timeout_ms: 600000`; it returns early when mailbox activity
arrives. Read the completed result, and wait again only when the required agent
is still running after an unrelated event or the deadline.

Keep the parent turn active until the required agents reach a terminal state.
Do not poll with `list_agents`, short repeated waits, sleeps, or status
heartbeats. `notify` is not a replacement: it cannot start a new parent turn
after that turn has ended.

## Codex shell waits

Keep long shell commands inside one code-mode cell so internal terminal waits do
not become model turns. For reviews and other work expected to finish within 15
minutes, use this shape:

```js
// @exec: {"yield_time_ms": 900000, "max_output_tokens": 10000}
const maxOutputTokens = 10000;
let result = await tools.exec_command({
  cmd: "<command>",
  yield_time_ms: 30000,
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

An empty `write_stdin` wait returns when the process exits; five minutes is its
deadline, not a delay imposed after completion. If the outer cell yields before
the process finishes, resume that cell with one long `functions.wait` call. Do
not restart the command, call `notify`, or use `yield_control` for unchanged
progress. Accumulate each terminal result inside the cell so output received
before the final wait is not lost. For a review or validation gate, make the
command persist its full artifact to a run-owned file. If any terminal result
reports more original tokens than its output budget, fail the gate and inspect
that artifact instead of classifying truncated output.

## Direct waits

For requests such as "wait five minutes", resolve `<skill-dir>` to this skill
and run:

```sh
<skill-dir>/scripts/quiet-wait 5m
```

In Codex code mode, hold the outer `functions.exec` call longer than the
requested delay. Use the Codex shell-wait pattern above and keep its internal
loop inside the same `functions.exec` call. The outer tool call may span the
complete requested delay.

## Long-running commands

Use the same held-call pattern for builds, tests, reviews, deployments, and
other quiet processes:

1. Start with a 30-second command yield.
2. If it is still running, wait internally for up to five minutes at a time.
3. Return to the model only when the process exits, produces a state that
   requires action, or the user-requested deadline arrives.
4. Do not narrate unchanged heartbeats.

If the available tool cannot keep one outer call pending, use the longest safe
blocking wait it supports. Never replace a wait with a tight polling loop.

## GitHub Actions

Read [github-actions.md](references/github-actions.md), then estimate the next
useful observation from completed runs of the same workflow:

```sh
<skill-dir>/scripts/estimate-gh-wait --run-id <run-id>
```

Wait for the returned `suggested_wait_seconds` inside the same held tool call,
then inspect the run once. Recalculate only after a meaningful state change.
Fall back to 120 seconds when fewer than three comparable runs exist.

## Completion

Report the result after the wait. For a plain delay, say that the requested
time elapsed. For monitoring, report only meaningful state changes or the final
state.
