---
name: monitoring-gh-actions
description: 'Use when monitoring ongoing GitHub Actions workflow runs or pull request checks through GitHub CLI and needing conservative polling that avoids rate limits.'
---

# Monitoring GitHub Actions

Use this skill when the job is to **wait on GitHub Actions** rather
than debug or fix them. This is a monitoring skill, not a CI
triage/fix skill.

## Core rule

**Poll slowly by default.** GitHub CLI watch commands default to
very short refresh intervals (`3s` for `gh run watch`, `10s` for
`gh pr checks --watch`). Override them.

Use **120 seconds** as the default interval unless:

- the user explicitly asks for tighter monitoring
- you are in the final stretch of a run and need a faster answer
- a human is actively waiting in the loop and has asked for quicker
  updates

If you shorten the interval, say why. Prefer `30s` as the shortest
normal interval. Do not poll every few seconds in a loop.

## Before watching

1. Confirm `gh` is installed: `gh --version`
2. Confirm auth is valid: `gh auth status`
3. Identify what you are watching:
   - a **PR's checks**: use `gh pr checks`
   - a specific **workflow run**: use `gh run watch <run-id>`
   - if you don't yet know the run id, find it first with
     `gh run list` or `gh pr checks`

If `gh` is missing or unauthenticated, stop and tell the user.

## Preferred commands

### Monitor a PR

Use:

```sh
gh pr checks --watch --interval 120
```

Add `--required` if only required checks matter.

### Monitor a specific workflow run

Use:

```sh
gh run watch <run-id> --interval 120 --compact
```

Add `--exit-status` when the result should drive the next command.

## Manual polling fallback

If watch mode is not a good fit, do one immediate snapshot, then
sleep between polls:

```sh
gh pr checks --json name,state,workflow,link
sleep 120
gh pr checks --json name,state,workflow,link
```

Only report **state changes** or meaningful progress:

- queued -> in progress
- pending -> pass/fail/cancel
- new failing job
- all checks complete

Do not spam the user with identical snapshots.

## Common mistakes

- Using `gh run watch` with its default `3s` refresh interval
- Using `gh pr checks --watch` with its default `10s` interval
- Polling manually in a tight `while true` loop
- Re-reporting unchanged pending states
- Treating monitoring as debugging; if the goal shifts to fixing CI,
  switch to a CI-fix workflow instead

## Reporting style

Keep updates short:

- what is being watched
- current overall state
- next poll timing
- only the failing or newly-finished checks when something changes
