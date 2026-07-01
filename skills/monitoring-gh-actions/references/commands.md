# Commands

GitHub CLI watch commands default to very short refresh intervals: `3s` for
`gh run watch` and `10s` for `gh pr checks --watch`. Override them.

## Monitor A PR

Use:

```sh
gh pr checks --watch --interval 120
```

Add `--required` if only required checks matter.

## Monitor A Workflow Run

Use:

```sh
gh run watch <run-id> --interval 120 --compact
```

Add `--exit-status` when the result should drive the next command.

## Manual Polling Fallback

If watch mode is not a good fit, do one immediate snapshot, then sleep between
polls:

```sh
gh pr checks --json name,state,workflow,link
sleep 120
gh pr checks --json name,state,workflow,link
```

Report only state changes or meaningful progress:

- queued -> in progress
- pending -> pass/fail/cancel
- new failing job
- all checks complete

## Common Mistakes

- Using `gh run watch` with its default `3s` refresh interval.
- Using `gh pr checks --watch` with its default `10s` interval.
- Polling manually in a tight `while true` loop.
- Re-reporting unchanged pending states.
- Treating monitoring as debugging.
