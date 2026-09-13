# When a check blocks work

Read the command's stopping reasons. Keep the saved run, elapsed time, consumed allowance and completed review results.

## Diff growth needs diagnosis

A line threshold is an internal warning, not a permission boundary. Inspect why the diff grew and continue authorized work when the design and scope remain coherent. Record the conclusion in the existing scope event reason; do not rebaseline merely to clear a warning.

Use the existing event history to distinguish a new scope expansion from another observation of the same large diff. Repeated upward revisions need deeper reassessment: a wrong approach, patches causing more patches, a missed shared cause, or independent changes that belong in separate cohesive PRs. Explain a meaningful systemic problem and recommend a path when Jesse needs to decide; do not ask for more lines. Actual unrelated work, breaking changes, dependencies and access still require their own authority.

A new human-authored binary or a legacy `rebaseline-required` result retains its explicit authorization requirement. For an authorized scope or baseline change, record the existing authority:

```sh
review-findings scope-authorize --repo <owner/repo> --repo-path <checkout> \
  --branch <branch> --target <target> --base <base> \
  --scope-summary "<authorized scope>" --authorization "<existing user authority>"
```

## A repair failed twice

Ask before another attempt. After approval, record:

```sh
review-findings progress-record --review <id> --outcome repair-authorized \
  --finding-id <decision-id> --authorization "<user's approval>" --evidence <decision-reference>
```

Use the finding's `decisionId`; the CLI supplies the saved phase, head and revision. This clears only that finding's failed-attempt count.

## Time or unanswered questions

At expiry, stop reviews and repairs and report what remains. For open decisions, present the actual questions together and record the answers before continuing. Each answer or scope approval clears only its own blocker; it does not restart time or grant unrelated permission.

A completed clean-pass target stops further review of unchanged code, not progression to the next requested review. Keep completed evidence even when the next action is blocked.
