---
name: monitoring-gh-actions
description: 'Use when monitoring ongoing GitHub Actions workflow runs or pull request checks through GitHub CLI and needing conservative polling that avoids rate limits.'
---

# Monitoring GitHub Actions

Use this skill when the job is to **wait on GitHub Actions** rather than debug
or fix them. This is a monitoring skill, not a CI triage/fix skill.

## Core Rule

Poll slowly by default. Use **120 seconds** as the default interval unless the
user explicitly asks for tighter monitoring, you are in the final stretch of a
run, or a human is actively waiting and asked for quicker updates.

If you shorten the interval, say why. Prefer `30s` as the shortest normal
interval. Do not poll every few seconds in a loop.

## Workflow

1. Run the preflight checks in [preflight.md](references/preflight.md).
2. Choose the matching command from [commands.md](references/commands.md).
3. If watch mode is not a good fit, use the manual polling fallback from
   [commands.md](references/commands.md).
4. Report only state changes or meaningful progress.
5. If the goal shifts from waiting to fixing CI, stop using this skill and
   switch to a CI-fix workflow instead.

## Context Pointers

- Use [preflight.md](references/preflight.md) before watching.
- Use [commands.md](references/commands.md) for PR checks, workflow runs, manual
  polling, and common mistakes.
- Use [reporting.md](references/reporting.md) for update style.
