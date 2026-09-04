---
name: wait-efficiently
description: 'Wait for a command, CI run, subagent, or timed delay by holding one long call instead of polling; report only meaningful state changes.'
---

# Wait efficiently

Choose the next useful observation and hold the existing operation until then. Resolve the expected duration from the task and available history; do not ask the user to choose routine wait intervals. Every return to the model resends context, so unchanged progress should remain inside the wait.

## Establish the completion condition

Name what must finish or change and estimate a numeric duration. Use a deadline appropriate to the mechanism, capped by the current tool schema and higher-priority communication constraints. It is a ceiling, not a required delay. Event waits wake early; external systems without a callback need the next historically useful observation. There is no universal minimum hold.

Keep exactly one pending wait or command. When it times out, continue that same operation. Use the capabilities exposed by the current host rather than assuming a historical CLI version or an unavailable API.

## Hold command execution

In Codex code mode, when command tools are exposed, keep launch, output accumulation, and every resume in one cell. Replace the two duration placeholders with the same numeric estimate capped to current limits:

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

The outer JSON header cannot read `yieldMs`; set the literal number in both places. Without the header, the cell's shorter default may return before the inner wait. Empty `write_stdin` resumes the same process. Preserve output from every resume and make review/validation commands save the full artifact to a run-owned file. An original token count above the result budget invalidates the gate until that artifact is inspected; do not infer success from truncated output.

If the outer cell yields, resume it with `functions.wait` when exposed. Do not restart the command, use `notify`, or call `yield_control` merely for unchanged progress. Hosts without code mode use their current direct command and process-resume tools instead. Never invent an API to reproduce this example.

In Claude Code, prefer tracked background `Bash` with `run_in_background: true` and a command that exits on the condition, such as `until grep -q "Ready in" dev.log; do sleep 0.5; done`. Continue useful work while the harness owns the wait. Inspect `BashOutput` when its completion notification identifies a reason.

Use `Monitor` for repeated actionable events; every stdout line notifies the model. Filter relevant events and failures together, for example `tail -f run.log | grep -E --line-buffered "elapsed_steps=|Traceback|FAILED|Killed|OOM"`. A success-only filter can conceal a crash. `persistent: true` supports a session-length watch; otherwise `timeout_ms` is capped at one hour. Without notifications, use the current foreground `Bash` ceiling and a command-level completion condition.

For external state the Claude harness cannot observe, such as a CI run or remote queue, use `ScheduleWakeup` sized to its change rate. Do not duplicate a tracked command's completion notification. Other harnesses should use their notification/callback mechanism, falling back to one bounded blocking wait.

## Hold required agent work

Do independent work after dispatch, batching independent reads in `Promise.all` within code mode or the host's native parallel-call facility. Once the remaining work depends on an agent, use the native event wait with a task-sized deadline capped by the tool.

In Codex, call `wait_agent` directly unless it is exposed within code mode. If enclosed, set its cell's numeric outer deadline as well. On unrelated mailbox activity or timeout, resume the wait while the required worker remains active. Keep the parent turn active until all required agents are terminal. Do not replace event waits with `list_agents` polling, repeated short holds, sleep, or heartbeat messages. Inspect status only for an explicit error or repeated timeouts. `notify` cannot reopen an ended parent turn.

Claude Code background subagents send completion notifications. Use `SendMessage` when a running worker needs new information; otherwise continue independent work and let completion arrive. Apply the current harness's equivalent elsewhere.

## Delay and CI cases

Resolve `<skill-dir>` to this skill and hold a requested delay across its duration:

```sh
<skill-dir>/scripts/quiet-wait 5m
```

For GitHub Actions, read [references/github-actions.md](references/github-actions.md) and use completed history for the same workflow:

```sh
<skill-dir>/scripts/estimate-gh-wait --run-id <run-id>
```

Use the estimator's conservative sparse-history fallback. Hold and inspect inside one call where possible; recalculate after meaningful state change, not on every wake. Finish when every required check has concluded.

Return the terminal result or actionable change. For a delay, state that the requested time elapsed. Omit unchanged percentages, heartbeat lines, and “still running” narration.
