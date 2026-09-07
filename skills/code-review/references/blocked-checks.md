# When a check blocks work

Read the command's stopping reasons. Keep the saved run, elapsed time, consumed allowance and completed review results.

## More scope is needed

Use the CLI's measured growth and allowance. Explain the extra change and ask for approval. A new human-authored binary or a legacy `rebaseline-required` result also needs explicit approval.

After approval:

```sh
review-findings scope-authorize --repo <owner/repo> --repo-path <checkout> \
  --branch <branch> --target <target> --base <base> \
  --scope-summary "<approved scope>" --authorization "<user's approval>"
```

If declined, leave the expansion unapplied or revert the blocked repair, record the decision and restore a passing check. Suggest a separate PR when the work is independently useful.

## A repair failed twice

Ask before another attempt. After approval, record:

```sh
review-findings progress-record --repo <owner/repo> --repo-path <checkout> \
  --branch <branch> --target <target> --base <base> --phase <phase> \
  --head <sha> --expected-revision <revision> --outcome repair-authorized \
  --finding-id <decision-id> --authorization "<user's approval>" --evidence <decision-reference>
```

Use the finding's `decisionId` and the current saved revision and head. This clears only that finding's failed-attempt count.

## Time or unanswered questions

At expiry, stop reviews and repairs and report what remains. For open decisions, present the actual questions together and record the answers before continuing. Each answer or scope approval clears only its own blocker; it does not restart time or grant unrelated permission.

A completed clean-pass target stops further review of unchanged code, not progression to the next requested review. Keep completed evidence even when the next action is blocked.
