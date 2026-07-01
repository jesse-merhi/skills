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
