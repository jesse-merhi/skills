---
name: review-guardrails
description: 'Manage budgets, scope, findings, consults, provisional fixes, and fixed-point rules for autonomous reviews.'
---

# Review guardrails

Apply these rules from the start of `code-review`, `review-until-clean`, or
`cold-pr-review-until-clean`. There is no iteration cap. The scope, time, growth,
and consultation budgets define when the loop stops.

1. Before the first cycle, record the local `review_started` timestamp; the
   branch/base's first authorized persisted/inherited changed-file and LOC
   `baseline_diff`; `scope_baseline` with request, target, behavior, and owner;
   `findings_db_path` (normally `~/.local/state/agent-review-findings/reviews.sqlite`);
   optional `decision_log_path`; empty `consult_queue`; and `consult_cap = 5`.
2. Resolve the installed `code-review` directory from the available-skills catalog:

   ```sh
   review_findings_bin="<code-review-skill-dir>/scripts/review-findings"
   ```

   Use that absolute launcher for every findings and scope command. Do not use
   bare `review-findings`, which may select a retired binary. Keep setup state,
   phase, clean counters, remaining lenses, and queue active. Mirror setup fields
   in the optional decision-log header.
3. Freeze scope. Apply [budgets.md](references/budgets.md) before each cycle and
   after each accepted fix using the deterministic scope CLI. Batch independent
   budget, registry, scope, and coverage reads. Stop immediately as
   `blocked-on-consult` on non-zero `scope-check`.
4. Use `finding-discipline` to establish the runtime risk rating or maintenance
   present-cost evidence and pass reality, importance, and repair-quality gates.
   Then classify accepted findings and apply the separate autonomous fix bar in
   [scope-governor.md](references/scope-governor.md).
5. Before patching, use [systemic-findings.md](references/systemic-findings.md).
   Repair a contained systemic issue at its owner; consult for material systemic
   work or any local Band-Aid. New text paths may fit the budget; new binaries
   require authorization. For an accepted finding with uncertain repair, use
   [uncertain-findings.md](references/uncertain-findings.md). Do not write provisional
   code to decide whether a risk exists.
6. Record each accepted, rejected, deferred, provisional, or reopened finding
   and each validation command when it happens. Hide prior findings from fresh
   reviewers; only after return use [queue-matching.md](references/queue-matching.md)
   to match against the registry and open consults.
7. Stop when wall-clock/growth budget, consult cap, or fixed point is reached.
   A clean streak with an open queue is `blocked-on-consult`, not success.
   Do not repeat unchanged-tree reviews after that fixed point; required
   clean-streak passes still run. Before showing scope or consult
   questions, load `speak-fking-english` and follow the scope-governor request rules.
8. Declare clean only with the required streak, empty consult queue, preserved
   scope/budget, persisted baseline, final passing `scope-check`, and
   `scope-complete`. Every patch needs the autonomous fix bar; every disposition
   belongs in the database or loop report. A prose estimate is not a baseline.

During long work, report changed budgets, scope decisions, consult state, or blockers.
