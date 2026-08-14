# Scope Governor

Before applying a review-driven fix, classify the finding against the frozen
`scope_baseline`:

- `In-scope blocker`: introduced or exposed by this diff, inside the same owner
  boundary, and fixable without changing the task contract.
- `Follow-up`: real issue, but adjacent or broader than this PR.
- `Stop-and-consult`: requires a new shared contract, migration, API shape,
  storage shape, product/security judgment, or different owner boundary.

Patch only in-scope blockers. Record follow-ups as `deferred` findings and do
not patch them in this PR. Add stop-and-consult findings to `consult_queue` with
the scope reason, then record them in the findings database.

Stop patching and consult when:

- the fix would change what the PR is about
- the fix would cross the owner boundary
- the fix would exceed the diff-growth budget
- two review-triggered patch cycles have not converged
- the best next step is defining a shared contract before more code changes

## User-facing scope requests

Before showing a scope-expansion or consult request, load
`speak-fking-english` and give it the complete draft. Lead with the decision the
user must make, not the review machinery.

Include only:

- the extra files or boundary involved
- the concrete behavior that will remain wrong without the extra work
- one direct question, normally `Should I include this fix?`

Keep CLI terms, budget calculations, finding classes, and prescribed approval
phrases out of the request unless the user asks for that detail. If work is
already implemented or tested, say so in one short sentence after explaining
the behavior.

For example:

```text
I found one related fix that touches two files outside this review:

- packages/backend/src/audit/api-audit.ts
- packages/common/src/contract/base.ts

Without it, assigning the same item twice can be reported as a new assignment.
Should I include this fix?
```
