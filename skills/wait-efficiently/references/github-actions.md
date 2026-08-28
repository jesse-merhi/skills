# GitHub Actions waiting

Use historical durations to choose the next useful observation. Monitoring is
observation only: diagnose or fix a failure only when the user also asked for
that work.

1. Confirm `gh --version` and `gh auth status` succeed.
2. Identify each pending workflow run ID with `gh pr checks` or `gh run list`.
3. Run `scripts/estimate-gh-wait --run-id <id>`.
4. Wait and fetch once inside one held tool call:

   ```sh
   <skill-dir>/scripts/quiet-wait <suggested_wait_seconds>s
   gh run view <run-id> --json status,conclusion,jobs,updatedAt
   ```

5. Report only a meaningful state change: queued to running, a completed job,
   a new failure, or all required checks complete.
6. Recalculate after queued becomes in-progress or a job completes.

The estimator uses completed runs with the same workflow and event. It prefers
the same branch when at least three examples exist, uses the 75th-percentile
duration, subtracts current elapsed time, and falls back to 120 seconds.

When monitoring several runs, wait until the earliest predicted observation.
Do not create one polling loop per check.

Avoid `gh run watch` and `gh pr checks --watch`: their hidden fixed-frequency
polling cannot use the repository's observed durations. If `gh` is missing or
unauthenticated, stop and report the exact prerequisite.
