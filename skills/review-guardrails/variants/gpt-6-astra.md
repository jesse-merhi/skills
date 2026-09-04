---
name: review-guardrails
description: 'Manage budgets, scope, findings, consults, provisional fixes, and fixed-point rules for autonomous reviews.'
---

# Review guardrails

Govern an authorized until-clean loop without reopening ordinary in-scope work.
Load at the start of `code-review`, `review-until-clean`, or
`cold-pr-review-until-clean`. Budgets bound the loop; do not invent an iteration cap.

## Establish durable authority and state

Before cycle one, record local `review_started`; the branch/base's first authorized
persisted or inherited changed-file/LOC `baseline_diff`; request, target, intended
behavior, and owner in `scope_baseline`; `findings_db_path` (normally
`~/.local/state/agent-review-findings/reviews.sqlite`); optional `decision_log_path`;
empty `consult_queue`; and `consult_cap = 5`. Resolve the installed `code-review`
directory from the available-skills catalog and use:

```sh
review_findings_bin="<code-review-skill-dir>/scripts/review-findings"
```

All findings/scope commands use this absolute launcher, not a possibly retired
bare `review-findings`. Keep setup, current phase, clean counters, remaining
lenses, and consults in active state; mirror setup in an optional decision-log
header. Record findings and commands as accepted, rejected, deferred, provisional,
reopened, or executed rather than reconstructing them later.

## Decide which repairs are permitted

Apply [budgets.md](references/budgets.md) before every cycle and after every
accepted fix through the deterministic CLI. Use `finding-discipline`'s risk rating
for runtime candidates or present-cost evidence for maintenance candidates,
plus its reality, importance, and repair-quality gates. Acceptance alone does
not authorize repair: apply [scope-governor.md](references/scope-governor.md)'s
classification and autonomous fix bar.

Before a patch, apply [systemic-findings.md](references/systemic-findings.md).
Contained systemic repair belongs at the owner; material systemic work or a local
Band-Aid requires consultation. Text paths may be added within budget; new binary
paths need authorization. Use [uncertain-findings.md](references/uncertain-findings.md)
only for accepted risks whose repair is uncertain, never provisional code to
invent evidence that a risk exists.

## Continue or stop on the controlling rule

Continue independent authorized fixes around queued consultations. Preserve
reviewer independence: match prior findings and open consults only after a fresh
pass, using [queue-matching.md](references/queue-matching.md). Non-zero
`scope-check` stops immediately as `blocked-on-consult`. Time/growth budget,
consult cap, and fixed-point stops are binding. Name the controlling limit and
unfinished behavior when blocked; load `speak-fking-english` and the scope-governor
request rules before asking the user.

A fully clean verdict requires the clean streak, empty consult queue, preserved
scope/budget, persisted baseline, final passing `scope-check`, and `scope-complete`.
Prose estimates or reconstructed baselines do not count. Record all dispositions
in the database or loop report. Do not keep reviewing unchanged code at a
clean-except-queue fixed point or describe it as success.
