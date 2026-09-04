---
name: finding-discipline
description: 'Confirm actionable review findings, deduplicate root causes, and exclude nits, vague risks, and style notes.'
---

# Finding discipline

Turn candidate observations into concrete findings a maintainer would want acted
on. Discover broadly; accept precisely. Use current runtime evidence or present
maintenance cost, merge shared root causes, and prefer no finding over a weak one.

## Establish the risk

A runtime candidate must be introduced or newly exposed by the reviewed change
and tied to a changed line, symbol, configuration, or contract. Record:

```text
Production path: <current producer -> transformations -> failing sink>
Reachability evidence: <observed payload, current contract, or repository invariant>
Likelihood: likely | possible | rare | unknown | theoretical
Impact: critical | high | medium | low
Actual consequence: <verified behavior and meaningful user/system impact>
```

`likely` means observed or normal recurring supported input; `possible` means a
supported path without exceptional combinations; `rare` needs unusual supported
input/state; `unknown` lacks evidence; `theoretical` needs only arbitrary type
values, synthetic calls/tests, dependency maxima, or imagined states. Investigate
unknowns and reject theoretical paths.

Impact is `critical` for an exploitable security boundary, irreversible loss/
corruption, or broad outage; `high` for blocked core work, serious data/permission
errors, or many affected users; `medium` for bounded correctness/workflow failure
with meaningful recovery cost; `low` for presentation, minor inconvenience, or
easy recovery without material loss.

The findings CLI derives severity/disposition from likelihood and impact:

| Likelihood | Low | Medium | High | Critical |
| --- | --- | --- | --- | --- |
| likely | P3, accept | P2, accept | P1, accept | P0, accept |
| possible | no severity, reject | P2, accept | P1, accept | P1, accept |
| rare | no severity, reject | no severity, reject | P2, consult | P1, consult |
| unknown | no severity, investigate | no severity, investigate | no severity, investigate | no severity, investigate |
| theoretical | no severity, reject | no severity, reject | no severity, reject | no severity, reject |

Do not raise severity from worst-case impact or override the CLI in prose.
Supply `--handling fix|consult|follow-up|reject` separately; routing cannot turn
unproven/rejected risk into work. Reject handling needs failed gate and rationale.
Contained systemic repair may use `fix`; material systemic repair requires
`consult`. Owner deferral of accepted local risk records residual risk without
changing severity; owner rejection uses `--owner-resolution`. Unanswered consults
stay open. A real adjacent issue is nonblocking `follow-up` with owner/next action,
reported as deferred work, not accepted residual risk.

## Pass the actionability gates

1. Reality: trace a supported producer through relevant guards/invariants and
   actual dependency behavior to the failing boundary. Synthetic tests cannot
   supply missing production evidence.
2. Importance: name the violated current contract, affected party, likelihood,
   impact, consequence, and recovery. Compare realistic harm with permanent code,
   tests, and operational complexity.
3. Repair quality: identify root cause and owner, compare doing nothing with
   checked repair options, prefer an existing repo/dependency primitive, and
   count new branches, fallbacks, abstractions, states, tests, and failure modes.

A failed gate means reject or investigate, not a finding, patch, or test. Repair
quality passes either with a durable justified repair direction or with an
important owner decision whose exact question, checked options, and unsupported
choices are recorded. Only the repair route can authorize a patch; acceptance
still does not bypass the owning workflow's fix authority. Consult before
proven rare/high or rare/critical defense-in-depth work. Serious risk does not
justify a custom maze of special cases.

Defensive caps/truncation require evidence a current producer realistically
approaches the threshold. Escaping/delimiter remedies require supported/observed
input containing the exact character and a material failure in the real parser/
renderer. Check these claims independently; declared limits and arbitrary string
types are insufficient.

Maintenance findings require changed code with proven current unnecessary
complexity, duplication, or no job, plus a concrete reading/change/test/ownership
cost. Identify the owner error, smaller durable behavior-preserving code, and
which domain concept, boundary, dependency direction, expected variability, or
useful test seam the change preserves/removes.

Choose proof after repair passes. Load `test-audit` before test changes and let
its portfolio decision own keep/add/consolidate/move/rewrite/delete/no-test.
Historical regression alone does not justify coverage; visual defects usually
need rendered proof.

## Confirm and record

Before finalizing, confirm exact trigger (input/state/timing/permission/platform/
version), current wrong behavior, contract evidence, root cause/owner, upstream
guards, and repair benefit versus full cost. Vague trigger/behavior/contract means
investigate or drop. Unsupported repair means no patch; consult only for a proven
important problem with a precise decision and checked directions. Confirm complete
risk fields. For maintenance, verify exact changed code, repository evidence,
present cost, ownership cause, smaller replacement, preserved design value, and
why changing it beats tolerance; vague evidence/cost means drop.

Runtime records include contract evidence, root cause, intervention justification,
and risk rating. Maintenance records include evidence, present cost, root cause,
and intervention justification. Patch, deferral, and approved-consult records
need recommended repair; unresolved/declined consults may omit it only with an
explanation of why no repair is supported.

Exclude style/naming/formatting/architecture taste without present harm, generic
missing tests without a hidden specific failure, speculative security without a
current executable path, broad "consider" suggestions, duplicates, and stale
non-diff findings. Residual risk is proven and deliberately tolerated, never a
parking place for unsupported possibilities. Perform a final review of findings
and changed-line references before presenting them.

## Output

Use imperative titles under 80 characters and tight file/line references. In
Codex app review requests, emit `::code-comment{...}` findings. Use the CLI's exact
severity/disposition, with bodies following these complete patterns:

```text
[P0/P1/P2/P3] <Imperative title>
Changed <path/line> does <bad behavior> when <trigger>, violating <contract>
because <evidence>. Repair at <owner> by <durable direction>; <benefit versus
no change and full repair cost> justifies intervention.

[P0/P1/P2] <Imperative consultation title>
Changed <path/line> causes <proven behavior> on <trigger>, affecting <party and
consequence>. <Boundary> owns the cause. <Checked options and why unsupported>
leave repair unresolved. Ask the owner <exact question> before editing.

[maintenance] <Imperative title>
Changed <path/line> adds <defense/duplication/indirection>; <repo evidence>
proves <present problem and reading/change/test cost> without improving <behavior
or boundary>. Use <owner-level simplification>, justified by <benefit versus
no change and full repair cost>.
```

Consult severity expresses stakes, not patch authority. P0 is likely/critical;
P1 is likely-or-possible/high or possible-or-rare/critical; P2 is likely-or-possible/
medium or rare/high; P3 is likely/low. The CLI remains authoritative.
