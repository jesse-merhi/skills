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

Classify scope by behavior and contract, not by the original file list. An
accepted fix may edit or add any file while it preserves the task contract,
owner boundary, and diff-growth budget. Never consult solely because a path was
not in the baseline diff.

Stop patching and consult when:

- the fix would change what the PR is about
- the fix would cross the owner boundary
- the fix would exceed the diff-growth budget
- two review-triggered patch cycles have not converged
- the best next step is defining a shared contract before more code changes

## User-facing scope requests

Before showing a scope-expansion or consult request, load
`speak-fking-english` and give it the complete draft. Assume the user has not
seen the internal review messages, findings, or fix attempts. Re-establish the
missing context before asking for a decision.

In this order, explain:

- what the original change is trying to do
- what the reviewer found, in plain language
- the extra files or boundary involved
- the concrete behavior that will remain wrong without the extra work
- one direct question, normally `Should I include this fix?`

Keep CLI terms, budget calculations, finding classes, and prescribed approval
phrases out of the request unless the user asks for that detail. If work is
already implemented or tested, say so in one short sentence after explaining
the behavior. Done when the request makes sense without any earlier review
messages.

For example:

```text
Quick context: this PR changes how assignments are recorded. During review, a
reviewer found that assigning the same item twice can still be recorded as a new
assignment.

Fixing that properly also requires changes in two audit-system files outside the
original scope:

- packages/backend/src/audit/api-audit.ts
- packages/common/src/contract/base.ts

If I include the fix, repeat assignments will stop being counted as new. If I
leave it out, that bug will remain for a separate change. Should I include it in
this PR?
```
