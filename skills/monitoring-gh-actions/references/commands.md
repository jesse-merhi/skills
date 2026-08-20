# Commands

Prefer one status fetch after a history-aware silent wait. GitHub CLI watch
commands hide their polling loop, cannot adapt their interval from historical
duration, and default to very short refresh intervals.

## Monitor a PR

Fetch the PR's current check state:

```sh
gh pr checks --json name,state,workflow,link
```

Add `--required` if only required checks matter.

## Monitor a workflow run

Estimate the next useful observation, wait through `wait-efficiently`, then
fetch the run once:

```sh
<wait-efficiently-dir>/scripts/estimate-gh-wait --run-id <run-id>
gh run view <run-id> --json status,conclusion,jobs,updatedAt
```

## Manual polling fallback

If no comparable history exists, use the estimator's 120-second fallback. Keep
the sleep and next status fetch inside one held tool call:

```sh
gh pr checks --json name,state,workflow,link
<wait-efficiently-dir>/scripts/quiet-wait 120s
gh pr checks --json name,state,workflow,link
```

Report only state changes or meaningful progress:

- queued -> in progress
- pending -> pass/fail/cancel
- new failing job
- all checks complete

## Common mistakes

- Using `gh run watch` with its default `3s` refresh interval.
- Using `gh pr checks --watch` with its default `10s` interval.
- Returning to the model between the wait and the next status fetch.
- Polling manually in a tight `while true` loop.
- Re-reporting unchanged pending states.
- Treating monitoring as debugging.
