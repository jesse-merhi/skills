# GitHub Actions waits

Choose one installed watch command. Check `gh run watch --help` or `gh pr checks --help` for supported flags:

```sh
gh run watch <run-id> --exit-status --compact --interval <seconds>
gh pr checks <pr> --watch --required --interval <seconds>
```

Resolve the PR's current head and required checks. Use a 30-second interval unless the caller specifies another. Omit `--required` when all checks matter; use `--fail-fast` with the PR watch only when the first failure answers the task. For several checks, use one PR watch.

Hold that command with the host's tracked-command mechanism. The CLI polls internally without a model turn per poll. Preserve its exit status and result: `--exit-status` reports run failure, and `gh pr checks` exit code 8 means pending, not success.

Before reporting success, reconcile results with the required checks on that head. Empty or partial results are incomplete; required checks must succeed unless the owner explicitly accepts a skipped or neutral result. Recheck the head if it changed during the wait.

Report unavailable tools or credentials without changing authentication. Watching does not authorize reruns, cancellation, or repairs.
