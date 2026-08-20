# GitHub Actions waiting

Use historical durations to choose the next useful observation.

1. Confirm `gh` is installed and authenticated.
2. Identify each pending workflow run ID.
3. Run `scripts/estimate-gh-wait --run-id <id>`.
4. Wait for `suggested_wait_seconds` inside one held tool call.
5. Inspect the run once and report only a state change.
6. Recalculate after queued becomes in-progress or a job completes.

The estimator uses completed runs with the same workflow and event. It prefers
the same branch when at least three examples exist, uses the 75th-percentile
duration, subtracts current elapsed time, and falls back to 120 seconds.

When monitoring several runs, wait until the earliest predicted observation.
Do not create one polling loop per check.
