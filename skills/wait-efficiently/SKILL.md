---
name: wait-efficiently
description: 'Wait for commands, CI, or external work without token-heavy polling; report meaningful state changes.'
---

# Wait Efficiently

Before waiting, state what is being awaited and when the next meaningful update
will occur. Use the product-native wait mechanism, avoid unchanged heartbeat
updates, and return only for action, a deadline, or a meaningful state change.

## Direct waits

For requests such as "wait five minutes", resolve `<skill-dir>` to this skill
and run:

```sh
<skill-dir>/scripts/quiet-wait 5m
```

In Codex code mode, hold the outer `functions.exec` call longer than the
requested delay. Start the script with a 30-second command yield, then poll its
session internally with 60-second `write_stdin` waits until it exits. Keep that
loop inside the same `functions.exec` call. Do not emit commentary, call
`notify`, or yield control while the wait is unchanged.

Each individual internal wait must be at most 60 seconds. The outer tool call
may span the complete requested delay.

## Long-running commands

Use the same held-call pattern for builds, tests, reviews, deployments, and
other quiet processes:

1. Start with a 30-second command yield.
2. If it is still running, poll internally for 60 seconds at a time.
3. Return to the model only when the process exits, produces a state that
   requires action, or the user-requested deadline arrives.
4. Do not narrate unchanged heartbeats.

If the available tool cannot keep one outer call pending, use the longest safe
blocking wait it supports. Never replace a wait with a tight polling loop.

## Subagents

Use the harness's event-driven agent wait. In Codex, call `wait_agent` with a
15-minute timeout. It returns immediately when the reviewer sends an update or
finishes, so the timeout is a ceiling rather than a delay.

After a non-terminal update, start another 15-minute wait without a status-list
call. If a wait times out, wait another 15 minutes. Inspect agent status only
after two consecutive timeouts or an explicit error; do not follow ordinary
waits with `list_agents`. Keep the coordinator active until it receives the
result. Agent completion is delivered to its mailbox, but ending the
coordinator's turn is not a documented automatic handoff.

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
