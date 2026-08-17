---
name: wait-efficiently
description: 'Hold one long wait for a command, build, test, CI run, subagent, or timed delay instead of polling; report only meaningful state changes.'
---

# Wait Efficiently

A wait costs one model round trip every time it returns. One hold that spans the
whole wait costs one round trip. Polling the same wait costs one per check, and
each check carries the entire conversation.

Hold the wait. Return for completion, an actionable state, or the deadline.

## Hold

1. Name what is being awaited and how long it is expected to take.

   Done when the expected duration is a number rather than "a while".

2. Set the hold deadline to that full expected duration, and never below 300
   seconds.

   **The deadline is a ceiling, not a delay.** The hold returns the moment the
   work finishes, so a longer deadline never costs waiting time. A short
   deadline buys nothing and spends a round trip every time it expires.

   Done when one hold spans the whole expected duration.

3. Make the hold with the mechanism for the current harness.

   Codex: read [references/codex.md](references/codex.md).
   Claude Code: read [references/claude-code.md](references/claude-code.md).
   Another harness: use its longest single blocking wait, and prefer a
   completion callback over any wait at all.

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

For "wait five minutes" and similar, resolve `<skill-dir>` to this skill and run:

```sh
<skill-dir>/scripts/quiet-wait 5m
```

Hold the call for the full requested delay.

## GitHub Actions

Read [references/github-actions.md](references/github-actions.md), then size the
hold from completed runs of the same workflow:

```sh
<skill-dir>/scripts/estimate-gh-wait --run-id <run-id>
```

Hold for the returned `suggested_wait_seconds`, then inspect the run once.
Recalculate only after a meaningful state change. Fall back to 120 seconds when
fewer than three comparable runs exist.
