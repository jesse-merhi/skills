---
name: finding-discipline
description: 'Confirm actionable review findings, deduplicate root causes, and exclude nits, vague risks, and style notes.'
---

# Finding discipline

Evaluate candidate observations against current evidence and return findings
worth an owner's action. Resolve routine reachability and ownership questions
from code. Do not turn uncertainty about a repair into permission to patch.
Generate broadly, accept precisely, and merge duplicate root causes.

## Establish the current consequence

A finding must be introduced or newly exposed by the change, tied to a changed
line/symbol/config/contract, and show a realistic failure or present maintenance
cost. For runtime candidates record:

```text
Production path: <current producer -> transformations -> failing sink>
Reachability evidence: <observed payload, current contract, or repository invariant>
Likelihood: likely | possible | rare | unknown | theoretical
Impact: critical | high | medium | low
Actual consequence: <verified behavior and meaningful user/system impact>
```

Likelihood is `likely` for observed/normal recurring supported inputs, `possible`
for a supported path without exceptional combinations, `rare` for unusual but
supported input/state, `unknown` for missing evidence, and `theoretical` for
arbitrary type values, synthetic examples/tests, dependency maxima, or imagined
states alone. Investigate unknowns; reject theories rather than preserving them
as warnings.

Impact is critical for exploitable security boundaries, irreversible loss/
corruption, or broad outage; high for core-workflow blockage, serious data/
permission errors, or many users; medium for bounded failure with meaningful
recovery cost; low for presentation/inconvenience/easy recovery without material loss.
The findings CLI, not prose judgment, derives severity and disposition:

| Likelihood | Low | Medium | High | Critical |
| --- | --- | --- | --- | --- |
| likely | P3, accept | P2, accept | P1, accept | P0, accept |
| possible | no severity, reject | P2, accept | P1, accept | P1, accept |
| rare | no severity, reject | no severity, reject | P2, consult | P1, consult |
| unknown | no severity, investigate | no severity, investigate | no severity, investigate | no severity, investigate |
| theoretical | no severity, reject | no severity, reject | no severity, reject | no severity, reject |

Worst-case impact cannot compensate for unsupported likelihood. Supply
`--handling fix|consult|follow-up|reject` separately without changing the risk
outcome. Rejection needs its failed gate and evidence rationale.

## Separate problem proof from repair authority

Pass these gates in order before a candidate produces a finding, code, or test:

1. Reality: trace a supported producer through actual guards, invariants, and
   dependency behavior to the failure. Synthetic reproductions may test an
   accepted repair but cannot provide missing production evidence.
2. Importance: establish the violated contract, party, likelihood, impact,
   consequence, and recovery. Compare realistic harm with permanent code, tests,
   and operational complexity.
3. Repair quality: establish root cause/owner, compare no change with checked
   options, prefer repo/dependency primitives, and count new branches, fallbacks,
   abstractions, state transitions, tests, and failure modes.

A failed gate means reject or investigate. Repair quality passes either with a
supported durable repair whose full cost is justified or with an important proven
problem requiring an owner's exact decision. For the latter, record the question,
checked options, and why none is supported; do not patch. Only the repair route
may permit a patch under the owning workflow's authority.

Contained systemic repair may use `fix`; material systemic repair requires consult.
Proven rare/high P2 and rare/critical P1 risks are owner consults about durable
defense in depth, not automatic patches. Prefer existing primitives when authorized;
a special-case maze fails repair quality even for serious risk. An unanswered
consult stays open. Owner rejection is a separate `--owner-resolution`; deliberate
local deferral records residual risk without changing severity. Real adjacent
issues use nonblocking `follow-up` with owner/next action and are reported as
deferred work. Residual risk is only proven, deliberately tolerated harm.

Caps/truncation need evidence of a current producer realistically nearing the
threshold. Delimiter/escaping remedies need supported or observed exact-character
input and material real-parser/renderer failure. Check both independently;
declared limits and arbitrary strings are not proof.

Maintenance candidates require repository proof of changed unnecessary complexity,
duplication, or unused code, with present reading/change/test/ownership cost.
Identify the ownership cause, smaller behavior-preserving replacement, and the
boundary/domain/dependency/expected-variability/test-seam value preserved or removed.
Do not accept vague present-cost claims.

## Confirm once the case is established

Confirm exact runtime trigger, actual wrong behavior, current contract, root
cause/owner, upstream guards, and why repair beats doing nothing after full cost.
If trigger, behavior, or contract is vague, investigate or drop. If repair remains
unsupported, do not patch; consult only for an important proven issue with a
precise question and checked directions. Confirm all risk fields and perform the
final findings check, including current changed-line references. For maintenance,
confirm exact code, evidence, cost, owner error, smaller replacement, preserved
design value, and net benefit; vague evidence/cost means drop.

Runtime records need risk, contract evidence, root cause, and intervention
justification. Maintenance records need evidence, present cost, root cause, and
intervention justification. Patches, deferrals, and approved consults also need
recommended repair; unresolved/declined consults may omit it only with a recorded
explanation. Load `test-audit` after repair passes and before changing tests; its
portfolio policy owns keep/add/consolidate/move/rewrite/delete/no-test. Historical
regression alone is insufficient; visual defects usually call for rendered proof.

## Present the result plainly

Exclude taste/style/naming/formatting without present harm, generic missing tests
without a specific failure, speculative security without a current executable
path, broad "consider" suggestions, duplicates, and stale non-diff findings.
Prefer no finding over a weak one. Keep gate reasoning internal and report concise
findings plus compact audit rejections when the workflow requires them.

Use imperative titles under 80 characters, tight file/line references, and
`::code-comment{...}` for Codex app review findings. Use the CLI's exact outcome:

```text
[P0/P1/P2/P3] <Imperative title>
<Changed path/line> does <bad behavior> on <trigger>, violating <contract>
because <evidence>. Repair at <owner> with <direction>, justified by <benefit
versus no change and full repair cost>.

[P0/P1/P2] <Imperative consultation title>
<Changed path/line> causes <proven behavior> on <trigger> for <party/consequence>.
<Boundary> owns the cause. <Checked options and why unsupported> leave the repair
open. Ask the owner <exact question> before editing.

[maintenance] <Imperative title>
<Changed path/line> adds <defense/duplication/indirection>; <repository evidence>
shows <present reading/change/test cost> without improving <behavior/boundary>.
Use <owner-level simplification>, justified by <benefit versus no change and full cost>.
```

Consult severity describes stakes, not edit authority. The CLI's table overrides
memory; unknown/theoretical and rejected low-combined-risk cases have no severity.
