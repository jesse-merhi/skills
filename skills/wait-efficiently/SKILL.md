---
name: wait-efficiently
description: 'Wait for a command, CI run, subagent, or timed delay by holding one long call instead of polling; report only meaningful state changes.'
---

# Wait efficiently

A wait costs one model round trip every time it returns. One hold that spans the
whole wait costs one round trip. Polling the same wait costs one per check, and
each check carries the entire conversation.

Hold the wait. Return for completion, an actionable state, or the deadline.

## Hold

1. Name what is being awaited and how long it is expected to take.

   Done when the expected duration is a number rather than "a while".

2. Choose one useful deadline for the mechanism and expected duration.

   **The deadline is a ceiling, not a delay.** Event-driven waits return when
   the work finishes. External systems that cannot wake the harness should be
   sampled at the next historically useful observation. There is no universal
   minimum wait.

   Done when one hold spans the whole expected duration.

3. Make the hold with the mechanism for the current harness.

   Codex: follow [Codex hold mechanisms](#codex-hold-mechanisms).
   Claude Code: follow [Claude Code hold mechanisms](#claude-code-hold-mechanisms).
   Another harness: prefer a completion notification or callback. Otherwise,
   use one blocking wait sized to the expected work and tool limit.

   Done when the work is running under exactly one pending call.

4. When a deadline expires with the work still running, resume the same wait.

   Restarting the work discards the elapsed run and pays for it twice.

   Done when the work reached a terminal state and was never restarted.

## Codex hold mechanisms

Use the capabilities exposed by the current Codex host; do not pin behavior to
a historical CLI version.

### Shell commands

Keep the command and every resume inside one code-mode cell. Set the cell and
command yields to the expected duration, capped by the current tool schema.

```js
// @exec: {"yield_time_ms": <expected-ms>, "max_output_tokens": 10000}
const yieldMs = <expected-ms>;
const maxOutputTokens = 10000;
let result = await tools.exec_command({
  cmd: "<command>",
  yield_time_ms: yieldMs,
  max_output_tokens: maxOutputTokens
});
const output = [result.output];
let originalTokens = result.original_token_count ?? 0;
while (result.session_id) {
  result = await tools.write_stdin({
    session_id: result.session_id,
    chars: "",
    yield_time_ms: yieldMs,
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

An empty `write_stdin` resumes the same process and returns when it exits or the
ceiling is reached. Set `<expected-ms>` before writing the cell: take the
duration named in Hold step 1, express the whole expected run in milliseconds,
and cap it at the maximum the current tool schema accepts. The `@exec` header
is JSON and cannot read `yieldMs`, so type the same number in both places;
without the header the cell yields at the exec tool's own default, which is far
shorter than most waits, no matter what the calls ask for. A sample value copied
from a template is the common failure: it returns with the work still running
and buys another round trip for nothing.

Accumulate each terminal result inside the cell so output received before the
final wait is not lost. Make any command behind a review or validation gate
persist its full artifact to a run-owned file. When a terminal result reports
more original tokens than its output budget, fail the gate and inspect that
artifact rather than classifying truncated output.

If the outer cell yields before the process finishes, resume that same cell with
`functions.wait`. Do not restart the command, call `notify`, or use
`yield_control` for unchanged progress.

### Subagents

Finish useful independent work after dispatch. Once blocked on a result, call
`wait_agent` with a deadline sized to the task and capped by the tool schema; it
returns when mailbox activity arrives. Wait again only when the required agent
is still running after an unrelated event or the deadline.

When `wait_agent` or `wait_threads` runs inside an exec cell, give the cell the
same `// @exec: {"yield_time_ms": <expected-ms>}` header sized to that
deadline; without the header the cell yields at the exec tool's own default
regardless of the timeout the call itself asks for.

Keep the parent turn active until every required agent reaches a terminal state.
Reach for a further `wait_agent` rather than `list_agents`, a short repeated
wait, a sleep, or a status heartbeat. `notify` is not a replacement: it cannot
start a new parent turn after that turn has ended.

### Independent calls

Nested calls inside one cell are the only batching Codex code mode offers, and
independent read-only calls belong in a single `Promise.all`. This applies to
the reads that surround a wait as much as to the wait itself.

## Claude Code hold mechanisms

Use capabilities exposed by the current Claude Code host; do not pin behavior
to a historical release.

Claude Code re-invokes the agent when harness-tracked work finishes, so the
cheapest hold is usually no wait at all.

### One notification when work finishes

Run the work with `Bash` and `run_in_background: true`, using a command that
exits when the condition is true:

```sh
until grep -q "Ready in" dev.log; do sleep 0.5; done
```

The completion notification arrives on its own. Continue with other work in the
meantime, and reach for `BashOutput` only when the notification names something
that needs inspecting.

### One notification per occurrence

Use `Monitor`, whose every stdout line becomes a notification. Filter to the
lines worth acting on, and cover failure states as well as success. A filter
matching only the success marker stays silent through a crash, and silence reads
as "still running".

```sh
tail -f run.log | grep -E --line-buffered "elapsed_steps=|Traceback|FAILED|Killed|OOM"
```

Set `persistent: true` for a session-length watch; otherwise `timeout_ms` caps
it at one hour.

### Blocking in the foreground

Use the current foreground `Bash` ceiling when a completion notification is not
available. Express work completion as a condition rather than a polling loop
that returns to the model.

### Subagents

Subagents run in the background and report on completion. Continue with
independent work and let the notification arrive; use `SendMessage` when a
running agent needs new information.

### Scheduled wake-ups

`ScheduleWakeup` fits external state the harness cannot observe, such as a CI
run or a remote queue, sized to how fast that state actually changes. For
harness-tracked work, the completion notification already arrives, so a wake-up
scheduled to check on it is a wasted round trip.

## Report

Report the terminal state, or the state change that requires action.

Unchanged progress is not a state change. Heartbeat lines, percentage ticks, and
"still running" are the hold working correctly; they are not results and do not
justify a return. For a plain delay, say that the requested time elapsed.

Done when the report names a terminal state or an action, and no line describes
unchanged progress.

## Timed delays

For "wait five minutes" and similar, resolve `<skill-dir>` to this skill and
run:

```sh
<skill-dir>/scripts/quiet-wait 5m
```

Done when one call spanned the whole requested delay.

## Subagents

Use the harness's event-driven agent wait. After a non-terminal update or
timeout, resume the event wait without a status-list call. Inspect agent status only for an explicit error or repeated
timeouts. Keep the coordinator active until it receives the result.

## GitHub Actions

Read [references/github-actions.md](references/github-actions.md), then size the
next observation from completed runs of the same workflow:

```sh
<skill-dir>/scripts/estimate-gh-wait --run-id <run-id>
```

Hold and inspect within one tool call. Recalculate only after a meaningful state
change. The estimator supplies a conservative fallback when history is sparse.

Done when every required check reached a conclusion and each inspection followed
a state change.
