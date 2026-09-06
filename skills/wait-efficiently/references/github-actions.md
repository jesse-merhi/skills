# GitHub Actions waits

Choose one installed watch command. Check `gh run watch --help` or `gh pr checks --help` for supported flags:

```sh
gh run watch <run-id> --exit-status --compact --interval <seconds>
gh pr checks <pr> --watch --required --interval <seconds>
```

Set an interval suited to workflow duration and urgency. Omit `--required` when all checks matter; use `--fail-fast` with the PR watch only when the first failure answers the task. For several checks, use one PR watch rather than a loop per check.

Hold that command with the host's tracked-command mechanism. The CLI polls internally without a model turn per poll. Preserve its exit status and result: `--exit-status` reports run failure, and `gh pr checks` exit code 8 means pending, not success.

If continuous watching is unsuitable, optionally use `estimate-gh-wait --run-id <id>` to choose the next observation time. It uses completed runs for the same workflow/event, favors at least three same-branch samples, and falls back conservatively with sparse history. It is not a prerequisite for a watch.

Report unavailable tools or credentials without changing authentication. Watching does not authorize reruns, cancellation, or repairs.
