---
name: finding-discipline
description: 'Confirm actionable review findings, deduplicate root causes, and exclude nits, vague risks, and style notes.'
---

# Finding discipline

Receive the complete genuine candidate set, then produce precise findings and
compact evidence-backed rejections. A short accepted report must not suppress
candidate discovery. Collect confirmation evidence inside the gates below;
do not repeat the investigation in an extra final sweep or verifier worker.

## Evidence and rating

A finding must be introduced or newly exposed by the reviewed change and tied
to a changed line, symbol, config, or contract. Establish a realistic runtime
failure or current maintenance cost before deciding to intervene. Record runtime cases as:

```text
Production path: <current producer -> transformations -> failing sink>
Reachability evidence: <observed payload, current contract, or repository invariant>
Likelihood: likely | possible | rare | unknown | theoretical
Impact: critical | high | medium | low
Actual consequence: <verified behavior and meaningful user/system impact>
```

`likely` means observed or normal recurring supported inputs; `possible` a
supported path without exceptional combinations; `rare` unusual supported input/
state; `unknown` missing evidence; `theoretical` only arbitrary type values,
synthetic calls/tests, dependency maxima, or imagined states. Investigate unknowns
and reject theories. Critical impact means exploitable security boundary,
irreversible loss/corruption, or broad outage; high means blocked core workflow,
serious data/permission error, or many users; medium means bounded failure with
meaningful recovery cost; low means presentation, inconvenience, or easy recovery
without material loss.

The findings CLI derives the outcome; preserve this exact matrix:

| Likelihood | Low | Medium | High | Critical |
| --- | --- | --- | --- | --- |
| likely | P3, accept | P2, accept | P1, accept | P0, accept |
| possible | no severity, reject | P2, accept | P1, accept | P1, accept |
| rare | no severity, reject | no severity, reject | P2, consult | P1, consult |
| unknown | no severity, investigate | no severity, investigate | no severity, investigate | no severity, investigate |
| theoretical | no severity, reject | no severity, reject | no severity, reject | no severity, reject |

Do not elevate severity from worst-case impact. Route separately with
`--handling fix|consult|follow-up|reject`; routing cannot turn unproven/rejected
risk into work. Rejection records its failed gate and rationale.

## Integrated actionability and confirmation

1. Reality: trace a supported producer through relevant upstream guards,
   invariants, and actual dependency behavior to the sink. Establish exact
   input/state/timing/permission/platform/version, what the code does, and why
   the current caller/test/docs/type/API/UI/security/previous-behavior contract
   makes it wrong. A synthetic example can test an accepted repair, not supply
   missing production evidence. Vague trigger/behavior/contract means investigate
   or drop.
2. Importance: record the party, likelihood, impact, consequence, and recovery.
   Compare realistic harm against lasting code, tests, and operational complexity.
   Low combined risk may require no finding and no code.
3. Repair quality: name root cause and owning boundary, compare doing nothing
   with checked durable directions, prefer existing repository/dependency primitives,
   and count every branch, fallback, abstraction, state transition, test, and
   failure mode. Check that upstream protections do not already resolve the issue.

Each gate must pass independently. Repair quality permits either a supported
durable repair with justified full cost, or a proven important problem needing
an owner decision. For consultation, record the exact question, options checked,
and why none is supported. Only the repair route may authorize a patch under the
owning workflow; a specific possible patch is not enough.

For caps/truncation, independently prove a current producer realistically nears
the threshold. For escaping/delimiters, prove supported or observed input with
the exact character and a material failure in the real renderer/parser. Evidence
for one does not prove the other; arbitrary types and dependency limits are insufficient.

For maintenance, establish exact changed unnecessary complexity, duplication,
or code with no current job; repository proof; present reading/change/test/
ownership cost; root cause/owner error; smaller behavior-preserving code; and the
boundary, domain, dependency direction, expected variability, or useful test seam
preserved/removed. Compare benefit with tolerance of the current cost. Vague
evidence or cost means drop, not a cleanup recommendation.

## Disposition and proof ownership

Use the CLI's exact severity/disposition. Contained systemic repairs may use `fix`;
material systemic repairs need consult before edits. Proven rare/high P2 and
rare/critical P1 risks call for owner decisions about durable defense in depth.
Prefer existing primitives if authorized; a maze of custom cases fails the repair bar.
Unanswered consults remain open. Record owner rejection through `--owner-resolution`.
Deliberate deferral of accepted local harm becomes residual without severity
change. A real adjacent issue is nonblocking `follow-up`, with owner/next action,
reported as deferred work. Residual means proven and deliberately tolerated.

Record risk, contract evidence, root cause, and intervention justification for
runtime findings; evidence, present cost, root cause, and intervention justification
for maintenance. Patches, deferrals, and approved consults also record repair.
Unresolved/declined consults may omit repair only when their decision explains why.
After repair passes, load `test-audit` before test changes and let its portfolio
policy own keep/add/consolidate/move/rewrite/delete/no-test. Do not add tests merely
because the issue happened before; visual defects usually need rendered proof.

Merge duplicate root causes. Exclude taste/style/naming/formatting without
current harm, generic missing tests without a specific hidden failure, speculative
security without a current executable path, broad "consider" suggestions, and
stale non-diff findings. Do not keep unsupported possibilities as warning notes.
Validate changed-line references when accepting the finding; prefer no finding
over a weak one without narrowing discovery.

## Concise findings

Use imperative titles under 80 characters and tight file/line references.
Emit `::code-comment{...}` for Codex app review findings. These bodies retain the
necessary decision evidence without narrating every gate:

```text
[P0/P1/P2/P3] <Imperative title>
<Changed path/line> causes <bad behavior> on <trigger>, breaking <contract>
because <evidence>. Use <durable repair at owner>; <benefit versus doing nothing
and full repair cost> justifies intervention.

[P0/P1/P2] <Imperative consultation title>
<Changed path/line> causes <proven behavior> on <trigger> for <party/consequence>.
The cause belongs to <boundary>. <Checked options and why unsupported> leave
repair unresolved. Ask the owner <exact question> before editing.

[maintenance] <Imperative title>
<Changed path/line> adds <defense/duplication/indirection>; <repo evidence> proves
<present reading/change/test cost> without improving <behavior/boundary>.
Use <owner-level simplification>, justified by <benefit versus no change and full cost>.
```

Consult severity represents stakes, not patch authority. Unknown/theoretical and
rejected low-combined-risk cases have no severity; the CLI overrides prose or memory.
