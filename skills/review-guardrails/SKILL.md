---
name: review-guardrails
description: 'Manage budgets, scope, findings, consults, provisional fixes, and fixed-point rules for autonomous reviews.'
---

# Review guardrails

Load this skill at the start of any until-clean review loop (`code-review`,
`review-until-clean`, `cold-pr-review-until-clean`). It bounds how long an
autonomous review may run, how much review fixes may grow the PR, and what
happens to findings that need the user instead of autonomy. There is no
iteration cap: the budgets are the bound.

## Required state

Record at setup, before the first review cycle:

```text
review_started = <local timestamp>
baseline_diff  = <changed files and changed lines of the original target,
                  persisted by `$review_findings_bin scope-start`>
scope_baseline = <request, target, intended behavior, owner boundary, files>
findings_db_path = <local SQLite path, normally ~/.local/state/agent-review-findings/reviews.sqlite>
decision_log_path = <optional path for long-form rationale, when available>
consult_queue  = []
consult_cap    = 5 open questions for the user
```

Resolve `review_findings_bin` once from the installed `code-review` skill path in
the available-skills catalog:

```sh
review_findings_bin="<code-review-skill-dir>/scripts/review-findings"
```

Use that absolute launcher for every findings and scope command. Never invoke a
bare `review-findings`; it is not an installed command and may select a retired
binary left on `PATH`.

Keep `review_started`, `baseline_diff`, `scope_baseline`, the current review
phase, clean streak counters, remaining lenses, and open consult-queue entries
in active loop state. Record triaged findings and verification commands in the
findings database as soon as they are accepted, rejected, deferred, made
provisional, reopened, or run. If an optional decision log exists, mirror setup
fields in its header.

## Workflow

1. Freeze the loop state and `scope_baseline`.
2. Apply the wall-clock budget and run the deterministic scope-budget CLI from
   [budgets.md](references/budgets.md) before each review cycle and after each
   accepted fix.
3. Classify each accepted finding with the scope governor in
   [scope-governor.md](references/scope-governor.md).
4. Patch only in-scope blockers.
5. For uncertain findings, use the provisional-fix or consult rules in
   [uncertain-findings.md](references/uncertain-findings.md).
6. When consult entries are open, provide reviewer notices according to
   [tracked-finding-notices.md](references/tracked-finding-notices.md).
7. Match repeated queue findings and stop at the fixed point using
   [queue-matching.md](references/queue-matching.md).
8. Treat a non-zero `scope-check` as an immediate blocked-on-consult stop. Stop
   honestly when the wall-clock budget, diff-growth budget, consult cap, or
   fixed point is reached. Before showing any scope or consult question to the
   user, load `speak-fking-english` and use the user-facing request rules in
   [scope-governor.md](references/scope-governor.md).

## Completion rules

- A fully clean verdict is valid only when the clean streak requirement is met
  and the consult queue has no open entries.
- A clean-except-queue fixed point is a blocked-on-consult state, not success.
- Every patched finding must stay within `scope_baseline` and the diff-growth
  budget.
- A clean verdict requires a persisted scope baseline, a final passing
  `scope-check`, and `scope-complete`; a prose estimate or reconstructed
  baseline does not count.
- Every deferred, provisional, rejected, reopened, or accepted finding must be
  recorded in the findings database or loop report.
- Do not keep re-running an unchanged tree after the fixed point.

## Context pointers

- Use [budgets.md](references/budgets.md) for the wall-clock and diff-growth
  budgets.
- Use [scope-governor.md](references/scope-governor.md) for in-scope,
  follow-up, and stop-and-consult classification.
- Use [uncertain-findings.md](references/uncertain-findings.md) for
  provisional fixes and consult-cap behavior.
- Use [tracked-finding-notices.md](references/tracked-finding-notices.md) for
  notices given to later reviewers.
- Use [queue-matching.md](references/queue-matching.md) for re-raise matching,
  clean-except-queue passes, and fixed-point termination.
