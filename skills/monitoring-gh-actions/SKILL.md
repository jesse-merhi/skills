---
name: monitoring-gh-actions
description: 'Monitor ongoing GitHub Actions runs with history-aware waiting and report meaningful state changes. Switch workflows before diagnosing or fixing failures.'
---

# Monitoring GitHub Actions

Use this skill when the job is to **wait on GitHub Actions** rather than debug
or fix them. This is a monitoring skill, not a CI triage/fix skill.

## Core Rule

Use `wait-efficiently` for every wait. Keep the current command or wait pending
inside one tool call so the model is not re-entered between checks.

Estimate the next check from completed runs of the same workflow and event:

```bash
<wait-efficiently-dir>/scripts/estimate-gh-wait.py --run-id <run-id>
```

Use its `suggested_wait_seconds`. It prefers same-branch history when enough
samples exist, uses the 75th-percentile duration, and subtracts elapsed runtime.
If history is missing, its fallback is 120 seconds. Do not poll every few
seconds.

## Workflow

1. Run the preflight checks in [preflight.md](references/preflight.md).
2. Choose the matching command from [commands.md](references/commands.md).
3. Estimate the next check from historical duration, wait silently with
   `wait-efficiently`, then fetch status once.
4. If watch mode is not a good fit, use the manual polling fallback from
   [commands.md](references/commands.md), with the same history-aware waits.
5. Report only state changes or meaningful progress.
6. If the goal shifts from waiting to fixing CI, stop using this skill and
   switch to a CI-fix workflow instead.

## Context Pointers

- Use [preflight.md](references/preflight.md) before watching.
- Use [commands.md](references/commands.md) for PR checks, workflow runs, manual
  polling, and common mistakes.
- Use [reporting.md](references/reporting.md) for update style.
