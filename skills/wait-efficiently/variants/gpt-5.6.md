---
name: wait-efficiently
description: 'Wait for a command, CI run, subagent, or timed delay by holding one long call instead of polling; report only meaningful state changes.'
---

# Wait efficiently

Outcome: hold one event-driven wait until completion, an actionable state, or
the selected deadline. Each returned poll costs another model round trip and
resends the conversation.

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

   Codex: read [references/codex.md](references/codex.md).
   Claude Code: read [references/claude-code.md](references/claude-code.md).
   Another harness: prefer a completion notification or callback. Otherwise,
   use one blocking wait sized to the expected work and tool limit.

   Done when the work is running under exactly one pending call.

4. When a deadline expires with the work still running, resume the same wait.

   Restarting the work discards the elapsed run and pays for it twice.

   Done when the work reached a terminal state and was never restarted.

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

Use the harness's event-driven agent wait. In Codex, call `wait_agent` with a
timeout long enough for the expected task, up to the tool's limit. It returns
when the reviewer sends an update or finishes.

After a non-terminal update or timeout, resume the event wait without a
status-list call. Inspect agent status only for an explicit error or repeated
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
