---
name: review-guardrails
description: 'Manage budgets, scope, findings, consults, provisional fixes, and fixed-point rules for autonomous reviews.'
---

# Review guardrails

Keep `code-review`, `review-until-clean`, and `cold-pr-review-until-clean` within
authorized scope, time, and change budgets. Load at loop start. Budgets, not an
iteration cap, bound the work.

Before the first cycle, record `review_started` as a local timestamp,
`baseline_diff` as the branch/base's first authorized persisted or inherited
changed-file/LOC baseline, `scope_baseline` as request/target/behavior/owner,
`findings_db_path` (normally `~/.local/state/agent-review-findings/reviews.sqlite`),
optional `decision_log_path`, an empty `consult_queue`, and `consult_cap = 5`.
Resolve the installed `code-review` path from the available-skills catalog once:

```sh
review_findings_bin="<code-review-skill-dir>/scripts/review-findings"
```

Use that absolute launcher for every findings/scope command. Bare `review-findings`
is not installed and may resolve to a retired binary. Keep setup state, current
phase, clean counters, remaining lenses, and consults active; mirror setup in
an optional decision-log header. Record accepted, rejected, deferred, provisional,
reopened findings and verification commands as their state changes, not at the end.

Apply [budgets.md](references/budgets.md) before each cycle and after each accepted
fix. Freeze scope and use the deterministic CLI. A non-zero `scope-check` means
immediate `blocked-on-consult`, not permission to continue fixing.

Use `finding-discipline`'s runtime risk rating or maintenance present-cost evidence
and its reality, importance, and repair-quality gates before acceptance. Then
apply [scope-governor.md](references/scope-governor.md)'s classification and
separate autonomous fix bar. Before patching use
[systemic-findings.md](references/systemic-findings.md): contained systemic repairs
belong at the owner; material systemic changes and local Band-Aids require consult.
New text paths are allowed within budget; new binary paths require authorization.

For a real accepted finding with an uncertain repair, use
[uncertain-findings.md](references/uncertain-findings.md). Provisional code cannot
establish whether the risk exists. Hide prior findings from fresh reviewers,
then match returned candidates to the registry/queue through
[queue-matching.md](references/queue-matching.md).

Stop on time/diff budget, consult cap, or fixed point. A required clean streak
with open consults is blocked, never "clean except" or success. After that fixed
point, do not repeat unchanged reviews; required clean-streak passes still run.
Before a scope/consult question, load `speak-fking-english`
and follow the scope-governor's user-facing request rules.

Clean requires the required streak, empty consult queue, preserved scope/budget,
persisted baseline, final passing `scope-check`, and `scope-complete`. Every patch
must pass the autonomous fix bar. Prose estimates and reconstructed baselines
are insufficient; keep every disposition in the database or loop report.
