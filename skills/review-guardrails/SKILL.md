---
name: review-guardrails
description: 'Bound autonomous review loops with wall-clock, diff-growth, scope, consult-queue, provisional-fix, and tracked-finding rules.'
---

# Review Guardrails

Load this skill at the start of any until-clean review loop (`code-review`,
`review-until-clean`, `cold-pr-review-until-clean`). It bounds how long an
autonomous review may run, how much review fixes may grow the PR, and what
happens to findings that need the user instead of autonomy. There is no
iteration cap: the budgets are the bound.

## State

Record at setup, before the first review cycle:

```text
review_started = <local timestamp>
baseline_diff  = <changed files and changed lines of the original target,
                  from `git diff --stat`>
scope_baseline = <request, target, intended behavior, owner boundary, files>
consult_queue  = []
consult_cap    = 5 open questions for the user
```

Put `review_started`, `baseline_diff`, and `scope_baseline` in the decision
log header when `code-review` is running; otherwise keep them in the loop
report.

## Wall-Clock Budget

- Default: **8 hours per review run**, measured from `review_started`.
- Check before starting each review cycle. When the budget has expired, stop
  fixing and report honestly: decisions logged, remaining findings triaged,
  and a handoff summary of what is still open.
- Do not keep looping past the budget because a clean streak is almost met.
- A machine-local override may set a different budget value for one machine.
  It must name a value; "no budget" is not a valid override.

## Diff-Growth Budget

- Review fixes may grow the diff by about **30% of baseline lines**. New
  tests that prove a fixed bug do not count against the budget.
- Check after every fix batch by comparing `git diff --stat` of the current
  target against `baseline_diff`.
- A fix that would exceed the budget, or touch a file outside the mapped
  review surface, is never applied silently: it becomes a consult-queue
  item.
- Past the budget, remaining findings become Deferred entries in the
  decision log or loop report. When the honest answer is that the PR should
  be split, say so plainly.

## Scope Governor

Before applying a review-driven fix, classify the finding against the frozen
`scope_baseline`:

- `In-scope blocker`: introduced or exposed by this diff, inside the same
  owner boundary, and fixable without changing the task contract.
- `Follow-up`: real issue, but adjacent or broader than this PR.
- `Stop-and-consult`: requires a new shared contract, migration, API shape,
  storage shape, product/security judgment, or different owner boundary.

Patch only in-scope blockers. Record follow-ups as Deferred entries and do
not patch them in this PR. Add stop-and-consult findings to `consult_queue`
with the scope reason.

Stop patching and consult when:

- the fix would change what the PR is about
- the fix would cross the owner boundary
- the fix would exceed the diff-growth budget
- two review-triggered patch cycles have not converged
- the best next step is defining a shared contract before more code changes

## Uncertain Findings: Fix or Consult

Some findings are real enough to act on but uncertain: marked `PLAUSIBLE`,
contested between passes, or a judgment call. Never silently fix or
silently reject one. Decide with the provisional-fix test — all four must
hold:

1. **Root cause**: the fix removes the failure mode, not the symptom or
   the reviewer's report of it. Suppressing an error path, papering a null
   check over a broken invariant, or tweaking a condition to dodge the
   reported case all fail.
2. **Right altitude**: the fix lands where the invariant lives. A special
   case added to shared infrastructure to protect one caller fails
   (`improve-codebase-architecture` has the long form).
3. **Small and local**: within the diff-growth budget and inside the
   mapped review surface.
4. **Cleanly reversible**: one commit or hunk whose revert restores the
   original exactly.

Test passes -> **provisional fix (Class A)**:

- Apply the fix now and log it as `Provisional: D<N>` in the decision log.
- Ask the user in parallel; do not wait for the answer. The loop continues
  on the fixed tree, so later passes are full-value and nothing re-raises.
- The user keeps it -> close the entry; the fix was already reviewed.
- The user rejects it -> revert the commit/hunk, reset the streak, resume.

Test fails -> **consult (Class B)**: the only available fix is a bandaid,
the direction is the user's call (product, security posture, data
migration), or the fix would break a budget or the review surface. Add it
to `consult_queue` with a fingerprint (file, code element, one-sentence
root cause), raise it with the user without waiting — immediately when the
user is active, otherwise in the suspension or final report — and keep
fixing other findings. In Claude Code use the question tool; in Codex ask
in the reply.

The consult cap bounds how much uncertainty may pile up: when open
questions for the user reach `consult_cap` (default 5, counting open Class
B entries plus provisional fixes still awaiting keep-or-revert), suspend as
blocked-on-consult before starting another review cycle. Present all open
questions in one batch and resume after the answers. A machine-local
override may change the cap's value.

## Tracked-Finding Notices

Open Class B findings sit unfixed in the tree, so every later pass would
re-derive them and the streak would degrade. Give later reviewers the
open-thread fact, the way a visible review thread does — nothing more:

```text
Already tracked by the maintainer, do not re-report:
D7 - refunds.ts isRefundActive(): pending refunds not treated as active.
Related issues in the same code ARE in scope.
```

- One line per open queue entry, appended to the reviewer's checklist or
  target instructions. Facts only: no severity, no rationale, no proposed
  fix, no opinion on validity. The notice must never say or imply the code
  is fine.
- Rebuild the notice list from the decision log's currently open consult
  entries at every reviewer dispatch. Never copy it from a previous pass
  and never maintain it by hand: a resolved entry must vanish from the
  next notice, and a stale notice silently suppresses real review.
- Only the orchestrating agent writes queue entries and notices. Reviewers
  never edit the queue or the decision log before their verdict.
- Engine support: the claude workflow takes the notice in its target
  instructions; cold reviewers take it as a checklist line. Bare
  `codex review` takes no instructions, so the codex engine cannot send
  notices — with open Class B findings it suspends as blocked-on-consult
  at the first clean-except-queue pass instead of burning a degraded
  streak.

## Queue Matching and the Fixed Point

Even with notices, a reviewer may independently re-derive an open queue
item — and the codex engine gets no notices at all. Matching exists to
recognize those re-raises during triage — never to fabricate a clean
verdict:

- Register each consult-queue finding with a fingerprint: file, code element
  (function, hook, config key), and the root cause or behavior in one
  sentence.
- A finding in a later pass that matches an open queue entry gets a one-line
  match note on that entry instead of a second queue entry or a new fix.
- Match on the same root cause at the same code, not on exact wording or
  line numbers. When unsure, treat the finding as new.
- Never feed the queue or prior findings to a reviewer. Bare native reviews
  take no instructions, and cold reviewers must stay neutral; matching
  happens only while triaging their output.

Pass classification with an open queue:

- `clean-except-queue`: every finding in the pass matches an open queue
  entry. The reviewer confirmed there is nothing new, so the pass counts
  toward the clean streak — but it can never produce a final clean verdict.
- Streak met with a non-empty queue is the **fixed point**: the tree cannot
  change without the user, and re-reviewing an unchanged tree adds nothing.
  Suspend the loop and report `blocked-on-consult` with the queue. Do not
  keep re-running the engine on an unchanged tree past the streak
  requirement.

Resolution:

- The user accepts a queued finding -> fix it, close the entry, reset the
  streak, and resume the loop on the changed tree.
- The user rejects it -> record the rejection and its reason in the decision
  log. If the streak was already met and no queue entries remain open,
  report success citing those rejections; the completed streak already
  covered this exact tree.
- Never report a fully clean verdict while the queue has open entries.

Why this terminates: every pass either fixes something (bounded by the
diff-growth budget), extends the streak (bounded by the streak
requirement), or suspends on the queue. The wall-clock budget backstops all
of it.
