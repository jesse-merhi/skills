# Scope governor

Before applying a review-driven fix, classify the finding against the frozen
`scope_baseline`:

- `In-scope blocker`: introduced or exposed by this diff, inside the same owner
  boundary, and fixable without changing the task contract.
- `Follow-up`: real issue, but adjacent or broader than this PR.
- `Stop-and-consult`: requires a new shared contract, migration, API shape,
  storage shape, product/security judgment, or different owner boundary.

Patch only in-scope blockers. Record adjacent work as `--handling follow-up`
with `--status deferred` and its owner or next action; it stays visible without
blocking this PR. Add stop-and-consult findings to `consult_queue` with the
scope reason, then record them with `--handling consult`.

## Autonomous Fix Bar

Before patching an in-scope blocker, prove all of these:

- The candidate passed `finding-discipline`'s reality, importance, and repair
  quality gates. The registry contains contract evidence for a runtime finding,
  plus root cause, recommended repair, and intervention justification for
  either finding kind.
- A runtime finding contains `finding-discipline`'s risk rating, non-synthetic
  reachability and consequence evidence, and the CLI-derived `accept`
  disposition and severity.
- A maintenance finding records repository proof of current unnecessary
  complexity, duplication, or code with no current job in
  `--maintenance-evidence`, plus a concrete current reading, change, test, or
  ownership cost in `--present-cost`. It has the CLI-derived `accept`
  disposition, but no runtime risk fields or severity.
- The failure violates the current task contract, not a stricter contract
  invented by the reviewer.
- The fix uses an existing repository or dependency primitive when one owns the
  behavior. Do not emulate a dependency's full semantics through accumulating
  special cases.
- The recommended repair is better than doing nothing and proportional to the
  observed likelihood and impact. Count permanent branches,
  fallbacks, schema fields, migrations, helpers, and tests as cost even when
  production changed-line growth stays under budget.
- For a runtime finding, severity combines likelihood and impact. It does not substitute
  for reachability, likelihood, or consequence evidence.

Do not autonomously patch a P3 whose remedy only hardens hypothetical input. If
the input is reachable and the current contract explicitly permits the
behavior, record `--handling reject` with that contract evidence. If accepting
it is instead a product tolerance decision, record `--handling consult` and do
not edit.

Reject observations that fail the reality, importance, contract, or repair
value test. Record residual
risk only when reachability and impact are proven but the current change
deliberately leaves it unresolved. Use stop-and-consult for a fix that needs a
new contract or user-owned trade-off.

Stop patching and consult when:

- the durable repair crosses `systemic-findings`' material consultation boundary
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
