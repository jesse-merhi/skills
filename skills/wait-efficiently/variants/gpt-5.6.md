---
name: wait-efficiently
description: 'Manage CI monitoring, prolonged commands, timed delays, and pending agents with bounded waits.'
---

# Wait efficiently

Hold one pending operation until completion, an actionable event, or its deadline. Avoid model round trips for unchanged progress; each return carries the conversation again.

## Choose the hold

Name the awaited condition and estimate its duration numerically from the work or available history. Choose a useful deadline capped by the current tool schema and higher-priority communication requirements. It is a ceiling, not a required delay: event waits return early. For external state that cannot wake the harness, observe at the next historically useful time. There is no universal minimum.

Use current host capabilities. Prefer a completion notification or callback; otherwise hold one bounded wait. On timeout, resume the same wait or process. Do not restart work to check whether it finished.

## Codex commands

When code mode exposes command tools, keep launch and every resume in one cell. Substitute the numeric expected milliseconds, capped by current tool limits, in both the JSON header and `yieldMs`; the header cannot read a variable.

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

An empty `write_stdin` continues the same process. Accumulate intermediate output so the final result does not omit early failures. For review or validation gates, persist the full command artifact to a run-owned file. If original token count exceeds the output budget, fail the gate and inspect the artifact; never classify truncated evidence as success.

Set the outer cell yield as well as the command yield. Omitting the header leaves the short cell default in effect. If that cell yields, resume it with `functions.wait` when the host exposes it; do not restart the command, call `notify`, or use `yield_control` for unchanged progress. When code mode or these tools are unavailable, use the currently exposed direct command/session-resume tools and their schemas. Do not invent a tool.

Batch independent reads with `Promise.all` in code mode or the host's native parallel-call mechanism. Keep dependent operations serial.

## Subagents

After dispatch, finish useful independent work. When blocked on a required agent, use the native event wait, such as Codex `wait_agent`, with a task-sized deadline capped by the tool. Resume the event wait after an unrelated message or timeout if the required worker remains active. Call it directly unless the host exposes it in code mode; an enclosing cell needs the same numeric deadline header.

Keep the parent active until required agents are terminal. Do not substitute status-list polling, short repeated waits, sleep, or heartbeat messages. Inspect status only for an explicit error or repeated timeouts. `notify` cannot reopen a parent turn that has ended. In Claude Code, background subagents supply completion notifications; do independent work and use `SendMessage` only when a running worker needs new information.

## Claude Code commands and watches

Use the mechanisms exposed by the current host:

- **One completion:** launch tracked `Bash` with `run_in_background: true`. The command should exit when the condition holds, for example `until grep -q "Ready in" dev.log; do sleep 0.5; done`. Continue independent work and inspect `BashOutput` only when the notification calls for it.
- **Repeated actionable occurrences:** use `Monitor`, where each stdout line becomes a notification. Filter both relevant events and failure states, for example `tail -f run.log | grep -E --line-buffered "elapsed_steps=|Traceback|FAILED|Killed|OOM"`. A success-only filter can hide a crash. Use `persistent: true` for a session-length watch; otherwise its `timeout_ms` is capped at one hour.
- **No completion notification:** use the current foreground `Bash` ceiling and a command-level completion condition, not repeated returns to the model.
- **External state the harness cannot observe:** use `ScheduleWakeup` for a CI run or remote queue, sized to its change rate. Do not schedule duplicate checks for harness-tracked work that already sends completion.

For another harness, use its completion callback/notification or one blocking wait bounded by expected work and tool limits.

## Delays and CI

Resolve `<skill-dir>` to this skill. For a requested delay, hold the existing operation across the requested time:

```sh
<skill-dir>/scripts/quiet-wait 5m
```

For GitHub Actions, first read [references/github-actions.md](references/github-actions.md). Estimate the next observation from completed runs of the same workflow:

```sh
<skill-dir>/scripts/estimate-gh-wait --run-id <run-id>
```

Hold and inspect in one tool call where supported. Use the estimator's conservative fallback for sparse history and recalculate only after a meaningful state change. Finish when every required check has a conclusion.

Report the terminal result or event requiring action. For a simple delay, report that the requested time elapsed. Omit unchanged percentages, heartbeats, and “still running” updates.
