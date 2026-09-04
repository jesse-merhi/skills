---
name: finding-discipline
description: 'Confirm actionable review findings, deduplicate root causes, and exclude nits, vague risks, and style notes.'
---

# Finding discipline

Inspect the complete candidate set, then return evidence-backed actionable
findings. Generate candidates for recall and accept for precision. Keep this
review read-only unless the owning workflow separately authorizes repair.

## Evaluate each candidate in order

1. Tie it to changed code or a newly exposed contract. Establish a realistic
   runtime failure or present maintenance cost. Batch independent contract and
   reachability reads, but do not skip dependencies between proof steps.
2. For runtime risk, record:

   ```text
   Production path: <current producer -> transformations -> failing sink>
   Reachability evidence: <observed payload, current contract, or repository invariant>
   Likelihood: likely | possible | rare | unknown | theoretical
   Impact: critical | high | medium | low
   Actual consequence: <verified behavior and meaningful user/system impact>
   ```

   `likely` is observed or normal recurring supported input; `possible` is a
   supported path without exceptional combinations; `rare` is an unusual supported
   input/state; `unknown` lacks evidence; `theoretical` relies only on arbitrary
   types, synthetic calls/tests, dependency maxima, or imagined states.
   Investigate unknowns. Reject theoretical cases.
3. Rate impact: critical means exploitable security boundary, irreversible loss/
   corruption, or broad outage; high means blocked core work, serious data or
   permission errors, or many users; medium means bounded failure with meaningful
   recovery cost; low means presentation, minor inconvenience, or easy recovery
   without material loss. Let the findings CLI assign severity and disposition:

   | Likelihood | Low | Medium | High | Critical |
   | --- | --- | --- | --- | --- |
   | likely | P3, accept | P2, accept | P1, accept | P0, accept |
   | possible | no severity, reject | P2, accept | P1, accept | P1, accept |
   | rare | no severity, reject | no severity, reject | P2, consult | P1, consult |
   | unknown | no severity, investigate | no severity, investigate | no severity, investigate | no severity, investigate |
   | theoretical | no severity, reject | no severity, reject | no severity, reject | no severity, reject |

   Do not choose or inflate severity yourself. Supply
   `--handling fix|consult|follow-up|reject` separately. Handling does not make
   rejected or unproven risk actionable. Reject with the failed gate and rationale.
4. Pass reality: trace supported producer to the sink and check guards, invariants,
   and actual dependency behavior. A test built from the reviewer's example may
   validate an accepted repair; it cannot establish production reachability.
5. Pass importance: name the current violated contract, party, likelihood,
   impact, consequence, and recovery. Compare realistic harm with the lasting
   code, test, and operational cost of intervention.
6. Pass repair quality: identify root cause and owning boundary, compare doing
   nothing with plausible checked options, prefer existing repository/dependency
   primitives, and count new branches, fallbacks, abstractions, transitions,
   tests, and failure modes. A specific patch is not necessarily a justified one.

## Decide the permitted outcome

Failure at any gate means reject or investigate, not a finding, code, or test.
Repair quality can pass through a supported durable repair whose benefit exceeds
full cost, or a proven important problem needing an owner decision. For consultation,
record the exact question, options checked, and why no repair is supported yet.
Only the repair route may authorize patching under the owning workflow.

Use `consult` for product, security, compatibility, operational, or architectural
choices, including proven rare/high P2 and rare/critical P1 risks. A contained
systemic repair may use `fix`; material systemic repair requires consult first.
Prefer existing primitives for authorized defense in depth; avoid special-case mazes.
Keep unanswered consults open. Record owner rejection with `--owner-resolution`.
Owner deferral of accepted local risk becomes residual without changing severity.
A real adjacent issue is nonblocking `follow-up`, with owner/next action, reported
as deferred work. Residual risk must be proven and deliberately tolerated.

For caps/truncation, prove a current producer can realistically approach the
threshold. For escaping/delimiters, prove supported or observed input contains the
exact character and the real renderer/parser fails materially. Assess these
independently; an arbitrary type or declared limit is not enough.

For maintenance, prove changed unnecessary complexity, duplication, or code with
no current job. Name repository evidence, present reading/change/test/ownership
cost, root cause/owner, smaller behavior-preserving code, and the boundary/domain/
dependency/variability/test-seam value preserved or removed. Vague evidence or
cost means drop the candidate.

After repair quality passes, load `test-audit` before any test change. Its portfolio
policy chooses keep, add, consolidate, move, rewrite, delete, or no test. History
alone does not justify a regression test; UI defects usually need rendered proof.

## Confirm, record, and report

Confirm each runtime trigger (input, state, timing, permission, platform, version),
wrong behavior, current contract, root cause, ownership, upstream guards, and
repair benefit versus no change and full cost. If trigger/behavior/contract remain
vague, inspect further or drop it. If repair is unsupported, do not patch; consult
only with a proven important problem and a precise question with checked options.
Perform the final findings pass and verify line references still overlap the change.

Record runtime risk plus contract evidence, root cause, and intervention justification.
Record maintenance evidence/present cost plus root cause and intervention justification.
Patches, deferrals, and approved consults need a recommended repair. Unresolved or
declined consults may omit it only when their decision explains why none is supported.

Merge duplicate root causes. Exclude taste, style, naming, formatting, generic
missing tests without a specific hidden failure, speculative security without a
current executable path, broad "consider" suggestions, and stale non-diff findings.
Prefer no finding over weak findings and do not retain theories as warning notes.
During long review, report only meaningful evidence or direction changes.

Use tight file/line references and imperative titles under 80 characters. For Codex
app review findings, use `::code-comment{...}`. Follow these output patterns:

```text
[P0/P1/P2/P3] <Imperative title>
<Changed path/line> causes <bad behavior> on <trigger>, breaking <contract>
because <evidence>. Fix at <owner> with <durable direction>; <benefit versus
no change and full repair cost> justifies it.

[P0/P1/P2] <Imperative consultation title>
<Changed path/line> causes <proven behavior> on <trigger> for <party/consequence>.
The cause belongs to <boundary>. <Options checked and why unsupported> leave
repair unresolved. Ask the owner <exact question> before editing.

[maintenance] <Imperative title>
<Changed path/line> adds <defense/duplication/indirection>. <Repository evidence>
proves <present reading/change/test cost> without improving <behavior/boundary>.
Use <owner-level simplification>; <benefit versus no change and full cost> justifies it.
```

Use the CLI's exact severity/disposition. Consultation severity records stakes,
not permission to patch. The table governs P0–P3; unknown/theoretical and rejected
low-combined-risk cases have no severity.
