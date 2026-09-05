---
name: wait-efficiently
description: 'Wait for a command, CI run, subagent, or timed delay by holding one long call instead of polling; report only meaningful state changes.'
---

# Wait efficiently

Before starting a sustained phase of repeated CI observations, established
checks, log collection, or packaging approved evidence, use `handoff` mechanical-
worker mode when its compact brief saves owner work. Keep one command already
held until completion local. Once a worker owns the phase, the owner waits for
its terminal event; do not also inspect CI or poll the worker. Implementation,
failure diagnosis, and review judgment remain with the capable owner.

Keep one wait pending. Return to the model when work finishes, action is needed, or the deadline expires. Repeated checks of unchanged progress waste round trips.

## 1. Choose the duration and mechanism

Name the condition you are waiting for. Estimate a numeric duration from the current work or relevant history. Cap the hold at the current tool's limit and any higher-priority communication requirement.

Use a completion notification or callback if available. Otherwise choose one blocking wait. The deadline is a ceiling, not a sleep requirement: an event wait returns as soon as the event arrives. There is no fixed minimum duration. For an external system that cannot notify the harness, schedule the next observation when its history suggests useful change.

Use the capabilities of the current host, not assumptions about an older release. Select the matching route below. Keep exactly one pending operation and resume it on timeout; do not restart the underlying work.

## 2. Wait for a command

### Codex

If the host exposes command tools inside code mode, launch and resume the command in one cell. Before submitting it, replace both `<expected-ms>` placeholders with the same numeric duration from step 1, capped by tool limits. The JSON header cannot read `yieldMs`.

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

Empty `write_stdin` resumes the same process. Keep all returned output, including output from earlier resumes. Commands used for review or validation gates must save their full artifact in a run-owned file. If original token count exceeds the result budget, fail the gate and read that artifact before deciding the result.

Set both the outer header and inner command yield. Without the header, the cell can return at its short default even when the inner wait is long. If the outer cell yields, resume that cell with `functions.wait` when available. Do not restart, call `notify`, or use `yield_control` for unchanged progress. If code mode is absent, use the exposed direct command and session-resume tools. Check their current schema; do not invent missing tools.

Batch independent reads with `Promise.all` inside code mode or the host's native parallel calls. Keep dependent calls serial.

### Claude Code

For one completion event, use tracked `Bash` with `run_in_background: true`. Make the command exit when the awaited condition becomes true:

```sh
until grep -q "Ready in" dev.log; do sleep 0.5; done
```

Continue other work. The harness sends a completion notification; use `BashOutput` only when that notification identifies something to inspect.

For repeated actionable events, use `Monitor`. Each stdout line becomes a notification, so filter for useful events and failures:

```sh
tail -f run.log | grep -E --line-buffered "elapsed_steps=|Traceback|FAILED|Killed|OOM"
```

Do not filter for success alone; that can hide a crash. Set `persistent: true` for a session-length watch. Otherwise `timeout_ms` is capped at one hour. If completion notifications are unavailable, use the current foreground `Bash` ceiling with a command-level completion condition.

Use `ScheduleWakeup` only for external state the harness cannot observe, such as a CI run or remote queue. Size it to the expected rate of change. Do not add a scheduled check for work that already has a completion notification.

### Other harnesses

Use the available completion notification or callback. If none exists, hold one blocking wait sized to the work and tool limit.

## 3. Wait for required agents

Do useful independent work after dispatch. In Codex, call `wait_agent` once blocked, with a deadline sized to the task and capped by the tool. If an unrelated message or timeout arrives while the required agent is still running, resume the event wait. Call it directly unless the host exposes it inside code mode; if enclosed in a cell, set the same numeric deadline in its outer header.

In Claude Code, background subagents report completion. Continue independent work and use `SendMessage` when a running agent needs new information. Use the equivalent event mechanism in another harness.

Keep the parent turn active until every required agent is terminal. Do not poll `list_agents`, repeat short waits, sleep between model calls, or issue status heartbeats. Inspect status only after an explicit error or repeated timeouts. `notify` cannot start a new parent turn after it has ended.

## 4. Handle a delay or GitHub Actions wait

For a requested delay, resolve `<skill-dir>` and hold the operation for the requested time:

```sh
<skill-dir>/scripts/quiet-wait 5m
```

For GitHub Actions, read [references/github-actions.md](references/github-actions.md), then estimate from completed runs of the same workflow:

```sh
<skill-dir>/scripts/estimate-gh-wait --run-id <run-id>
```

Use its conservative fallback if history is sparse. Hold and inspect in one call where the host supports it. Recalculate only after meaningful state change. Continue until all required checks have concluded.

## 5. Report the result

Report completion or the state change that needs action. For a plain delay, say the requested time elapsed. Do not report unchanged percentage ticks, heartbeat lines, or “still running.” Preserve the current process or wait identifier if the task must continue after context compaction; resume that operation rather than launching another.
