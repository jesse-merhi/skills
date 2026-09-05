---
name: wait-efficiently
description: 'Manage CI monitoring, prolonged commands, timed delays, and pending agents with bounded waits.'
---

# Wait efficiently

Hold one pending operation until completion, an actionable event, or its deadline. Spend no extra model turns narrating unchanged progress. Do not delegate a worker merely to wait.

## Waiting contract

Identify the awaited condition and a numeric expected duration from current work or relevant history. Choose a mechanism-sized deadline within current tool limits and higher-priority communication requirements. A deadline is a ceiling: notifications and event waits return early. External state without notifications should be observed at the next historically useful time; no universal minimum wait applies.

Use the current host's capabilities. Prefer callbacks or completion notifications; otherwise use one bounded blocking wait. Resume an existing wait or command after timeout, never restart it as a status check. Completion means the required work is terminal, not merely that a wait call returned.

## Codex execution

Where code mode exposes command tools, put launch and all resumes in a single cell. Substitute the same numeric duration, capped to the current schema, in both placeholders. The outer JSON header cannot evaluate `yieldMs`.

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

Accumulate intermediate output. Commands supporting review or validation gates must persist full output to a run-owned artifact. If original token count exceeds the result budget, fail the gate and inspect that artifact before classifying the result. A short final chunk does not make earlier truncation safe.

Empty `write_stdin` continues the same process. Give the outer cell a duration header too; otherwise its short default can defeat the inner hold. Resume a yielded outer cell through `functions.wait` when available. Do not restart work, call `notify`, or use `yield_control` for unchanged progress. If the host lacks code mode, use its exposed direct execution and session-resume tools with current schemas; do not invent missing APIs.

Batch independent reads in `Promise.all` within code mode or native parallel calls. Keep dependent calls serial.

## Claude Code execution

For one completion, run tracked `Bash` with `run_in_background: true` and a command that exits when the condition holds:

```sh
until grep -q "Ready in" dev.log; do sleep 0.5; done
```

Continue independent work until the completion notification. Use `BashOutput` when that notification requires inspection, not for periodic status.

For repeated actionable events, use `Monitor`. Every stdout line triggers a notification, so filter both relevant events and failure states:

```sh
tail -f run.log | grep -E --line-buffered "elapsed_steps=|Traceback|FAILED|Killed|OOM"
```

A filter containing only success can hide a crash. Use `persistent: true` for a session-length watch; otherwise `timeout_ms` is capped at one hour. When completion notifications are unavailable, use the current foreground `Bash` ceiling and a command-level completion condition.

Reserve `ScheduleWakeup` for external state the harness cannot observe, such as CI or a remote queue, at an interval appropriate to actual change. Do not duplicate notifications already provided by tracked work. Other harnesses should use their notification/callback support or one bounded blocking wait.

## Required subagents

Finish independent work after dispatch. Once blocked on required results, use the harness's event-driven agent wait. In Codex, use `wait_agent` with a task-sized deadline within the schema; call directly unless code mode exposes it. A surrounding cell needs the same numeric deadline header. Resume after unrelated messages or timeouts while the required worker is active.

Keep the coordinator active until all required workers are terminal. Do not poll status lists, use repeated short waits or sleeps, or send heartbeat updates. Inspect status only on explicit error or repeated timeouts. `notify` cannot start a new parent turn after it has ended.

In Claude Code, background agents send completion notifications; use `SendMessage` only to provide needed information. Apply the equivalent native event mechanism elsewhere. This waiting policy does not remove agents required by another workflow.

## Delays and GitHub Actions

For a plain delay, resolve `<skill-dir>` and hold the operation for the requested duration:

```sh
<skill-dir>/scripts/quiet-wait 5m
```

For GitHub Actions, read [references/github-actions.md](references/github-actions.md), then estimate the next useful observation from completed runs of the same workflow:

```sh
<skill-dir>/scripts/estimate-gh-wait --run-id <run-id>
```

Use the estimator's conservative fallback for sparse history. Hold and inspect in one tool call where supported; recalculate only after meaningful change. Every required check must reach a conclusion.

Report completion or the event requiring action. For delays, say the requested time elapsed. Keep unchanged percentages, heartbeats, and “still running” messages out of both progress updates and closeout.
