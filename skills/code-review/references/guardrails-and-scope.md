# Guardrails And Scope

## Scope Governor

Before Phase 1, freeze the review scope:

- original request, issue, or PR purpose
- base and target branch
- intended behavior
- owner boundary
- changed files (text paths are informational; new binaries require approval)
- non-test changed lines

Before patching a reviewer finding, classify it:

- `In-scope blocker`: introduced or exposed by this diff, inside the same owner
  boundary, and fixable without changing the task contract.
- `Follow-up`: real issue, but adjacent or broader than this PR.
- `Stop-and-consult`: requires a new shared contract, migration, API shape,
  storage shape, product/security judgment, or different owner boundary.

Patch only in-scope blockers. Record follow-ups in the findings database and do
not patch them in this PR. Put stop-and-consult findings in the consult queue
with the scope reason.

## Budgets And Consult Gates

`review-guardrails` owns the bounds for this skill: the wall-clock budget
(default 8 hours per run), the deterministic diff-growth budget (exactly 30%
of baseline production changed lines by default), the consult queue for findings that need user input, and the
queue-matching and fixed-point rules that stop later review passes from
re-litigating queued findings. There is no iteration cap: the budgets are the
bound.

Orchestrator specifics:

- Resolve the absolute `review_findings_bin` launcher as required by
  `review-guardrails`. Persist `review_started`, `scope_baseline`, and
  `baseline_diff` with `"$review_findings_bin" scope-start`. On resume, load them
  with `"$review_findings_bin" scope-status`.
- Run `"$review_findings_bin" scope-check` after every accepted fix and before the
  next review pass.
  Its non-zero result immediately suspends the whole review as
  blocked-on-consult; do not accumulate more findings up to `consult_cap`.
- Use the CLI report as evidence, not as the message. Follow
  `review-guardrails`' user-facing scope-request rule: load
  `speak-fking-english`, explain the extra boundary and concrete behavior in
  plain language, then ask one direct question.
- After approval, run `"$review_findings_bin" scope-authorize` with the user's words and revised scope,
  then reset the current phase. On rejection, revert the over-budget batch,
  defer the finding, and make `scope-check` pass before resuming.
- Provisional fixes (Class A) are findings with status `provisional`; the review
  owner's keep-or-revert answer updates the finding to `fixed` or `rejected`.
- Keep the consult queue in the findings database: each entry carries its
  fingerprint (file, code element, root cause). Review passes that re-raise a
  queued finding get a one-line match note on that finding instead of a new
  entry.
- Generate tracked-finding notices for cold reviewers and the claude workflow
  from the currently open consult entries at every dispatch, per
  `review-guardrails`. Never reuse a previous pass's notice text.
- When open questions for the user reach `consult_cap` (default 5, counting open
  Class B entries plus unanswered provisional fixes), suspend the whole review
  as blocked-on-consult and present them in one batch before running more
  cycles.
- When a phase suspends as `blocked-on-consult`, bring the queue to the user:
  ask directly in an interactive session, otherwise end with the questions in
  the report. Resume the phase when answers arrive: accepted findings get fixed
  and reset the phase; rejections are recorded and let the suspended streak
  close.
- The overall review cannot close while the queue has open entries. There is no
  "clean except" verdict: the result is clean only after the queue is resolved,
  otherwise it is blocked-on-consult.
