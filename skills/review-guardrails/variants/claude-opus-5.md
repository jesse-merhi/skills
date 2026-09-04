---
name: review-guardrails
description: 'Manage budgets, scope, findings, consults, provisional fixes, and fixed-point rules for autonomous reviews.'
---

# Review guardrails

Bound the complete review by authorized scope, wall-clock time, change budget,
and consultation state. Use at the start of `code-review`, `review-until-clean`,
or `cold-pr-review-until-clean`. Do not add an iteration cap or extra rounds
past the defined fixed point.

Initialize before review: local `review_started`; first authorized branch/base
changed-file/LOC `baseline_diff`, persisted or inherited; `scope_baseline` containing
request/target/behavior/owner; `findings_db_path` (normally
`~/.local/state/agent-review-findings/reviews.sqlite`); optional `decision_log_path`;
empty `consult_queue`; and `consult_cap = 5`. Resolve the installed `code-review`
path from the catalog once:

```sh
review_findings_bin="<code-review-skill-dir>/scripts/review-findings"
```

Use the absolute launcher for all findings/scope commands; bare `review-findings`
may resolve to a retired binary. Retain setup state, phase, clean counters,
remaining lenses, and consults in active state. Mirror setup in an optional
log header and record finding dispositions and verification commands as they occur.

Apply [budgets.md](references/budgets.md) before every cycle and after accepted
fixes. Record and triage every genuine candidate before deciding whether to fix:
`finding-discipline` supplies runtime risk ratings or maintenance present-cost
proof plus reality, importance, and repair-quality gates.
[scope-governor.md](references/scope-governor.md) separately owns classification
and the autonomous fix bar.

Use [systemic-findings.md](references/systemic-findings.md) before repair:
contained systemic fixes belong at the owner; material systemic work and local
Band-Aids need consultation. Allow budgeted text paths, but require authority
for new binaries. Use [uncertain-findings.md](references/uncertain-findings.md)
for accepted findings with uncertain repairs, not for uncertainty about whether
risk exists. After a fresh reviewer returns, use
[queue-matching.md](references/queue-matching.md) against the registry and queue;
never leak those records into its initial context.

Stop immediately on non-zero `scope-check`, or when time/growth budget, consult
cap, or fixed point is reached. A satisfied clean streak with open consults is
`blocked-on-consult`, not success. Keep questions short and concrete after loading
`speak-fking-english` and the scope-governor's user-facing request rules.

Completion integrates the required checks: clean streak, empty queue, preserved
scope/budget, persisted baseline, final passing `scope-check`, and `scope-complete`.
Every patch passes the autonomous fix bar; every disposition is recorded in the
database or loop report. Do not replace persisted evidence with prose estimates
or add unchanged-tree reviews after the fixed point.
