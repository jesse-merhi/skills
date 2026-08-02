---
name: wait-efficiently
description: 'Wait without token-heavy polling. Use when the user asks to wait, pause, check back later, babysit a command, monitor a long-running process, wait for CI or GitHub Actions, or avoid repeated status polling while external work completes.'
---

# Wait Efficiently

Before waiting, state what is being awaited and when the next meaningful update
will occur. Use the product-native wait mechanism, avoid unchanged heartbeat
updates, and return only for action, a deadline, or a meaningful state change.

## Direct waits

For requests such as "wait five minutes", resolve `<skill-dir>` to this skill
and run:

```sh
<skill-dir>/scripts/quiet-wait.py 5m
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

## GitHub Actions

Read [github-actions.md](references/github-actions.md), then estimate the next
useful observation from completed runs of the same workflow:

```sh
<skill-dir>/scripts/estimate-gh-wait.py --run-id <run-id>
```

Wait for the returned `suggested_wait_seconds` inside the same held tool call,
then inspect the run once. Recalculate only after a meaningful state change.
Fall back to 120 seconds when fewer than three comparable runs exist.

## Completion

Report the result after the wait. For a plain delay, say that the requested
time elapsed. For monitoring, report only meaningful state changes or the final
state.
