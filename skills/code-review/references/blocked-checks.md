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

Stop repeating the same repair. Read both saved failure records, reproduce the current failure when practical, and trace why the approach did not work. Choose a materially different approach that stays within the existing repair authority, then record the diagnosis and new approach:

```sh
review-findings progress-record --review <id> --outcome repair-replanned \
  --finding-id <decision-id> --diagnosis "<why the attempts failed>" \
  --changed-approach "<what will be done differently>" --evidence <diagnostic-reference>
```

Use the finding's `decisionId`; the CLI supplies the saved phase, head and revision. This clears only that finding's failed-attempt count. Two more failures require another diagnosis and changed approach rather than a blind retry.

Do not ask again solely because two authorized local attempts failed. Ask when the changed approach itself needs a decision or authority, including an explicit user limit, unrelated scope, a new dependency, access, spending, a breaking change or publication. After the user supplies that separate authority, add `--authorization "<user's approval>"` to `repair-replanned` so the saved event retains it. Preserve the failed-attempt evidence and every other saved stopping reason.

## Time or unanswered questions

At expiry, stop reviews and repairs and report what remains. For open decisions, present the actual questions together and record the answers before continuing. Each answer or scope approval clears only its own blocker; it does not restart time or grant unrelated permission.

A completed clean-pass target stops further review of unchanged code, not progression to the next requested review. Keep completed evidence even when the next action is blocked.
