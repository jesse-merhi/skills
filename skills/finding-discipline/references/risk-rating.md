# Risk Rating

Treat reviewer output as a hypothesis. Rate severity only after proving a
current production path and a meaningful consequence.

## Risk Reality Check

Record this case before the findings CLI assigns severity and disposition:

```text
Production path: <current producer -> transformations -> failing sink>
Reachability evidence: <observed payload, current contract, or repository invariant>
Likelihood: likely | possible | rare | unknown | theoretical
Impact: critical | high | medium | low
Actual consequence: <verified behavior and meaningful user/system impact>
```

Use these likelihood meanings:

- `likely`: observed or reached by normal, recurring supported inputs.
- `possible`: a supported current path reaches it without an exceptional
  combination of events.
- `rare`: a supported current path exists, but requires an unusual input or
  state combination.
- `unknown`: evidence is missing. Investigate; do not guess a probability.
- `theoretical`: only an arbitrary type value, synthetic test, dependency
  maximum, or imagined state reaches it. Reject it.

Use these impact meanings:

- `critical`: exploitable security boundary, irreversible data loss or
  corruption, or broad outage.
- `high`: blocked core workflow, serious data or permission error, or many
  affected users.
- `medium`: bounded correctness or workflow failure with meaningful recovery
  cost.
- `low`: presentation defect, minor inconvenience, or easy recovery without
  material loss.

## Deterministic Rating

Supply likelihood and impact. Do not choose severity or disposition; the
findings CLI derives the risk outcome from this table:

| Likelihood | Low impact | Medium impact | High impact | Critical impact |
| --- | --- | --- | --- | --- |
| likely | P3, accept | P2, accept | P1, accept | P0, accept |
| possible | no severity, reject | P2, accept | P1, accept | P1, accept |
| rare | no severity, reject | no severity, reject | P2, consult | P1, consult |
| unknown | no severity, investigate | no severity, investigate | no severity, investigate | no severity, investigate |
| theoretical | no severity, reject | no severity, reject | no severity, reject | no severity, reject |

Low-probability, low-impact risk defaults to no finding and no code. Severity
reflects likelihood and impact together; worst-case impact alone cannot raise a
finding. Supply `--handling fix|consult|follow-up` separately: it routes a
proven finding without changing severity or turning a rejected or unproven risk
into work. Systemic findings cannot use `fix`. When the owner deliberately
defers an accepted local finding, the CLI records it as residual risk without
changing its severity. The owner may reject a consulted finding without turning
it into an autonomous patch; the terminal update records that separate decision
with `--owner-resolution`. An unanswered consult stays open. A real adjacent
issue uses `follow-up`, is reported as deferred work, and does not block the
current review.

## Disposition

- `accept`: non-synthetic evidence proves the path and consequence, the table
  makes action worthwhile, and the behavior violates a current contract.
- `investigate`: reachability, likelihood, or sink behavior is still unproven.
  Gather evidence; do not patch.
- `consult`: the risk is proven, but tolerance or scope is a product, security,
  compatibility, operational, or architectural choice. Ask before patching.
- `follow-up`: the issue is real but belongs outside the current review. Record
  the owner or next action without blocking the current PR.
- `residual`: the risk is proven and the current change deliberately leaves it
  unresolved. Record it without patching.
- `reject`: the path is theoretical or the combined risk does not justify code.

The burden of proof belongs to the finding. A test created from the reviewer's
example can verify a fix after acceptance; it cannot supply missing production
evidence.

## Defence In Depth

Rare does not mean harmless. Proven rare/high and rare/critical risks become
consults with P2 and P1 severity respectively. Present the boundary and durable
options before editing. Prefer an existing repository, framework, or dependency
primitive when the user authorizes defence in depth. A custom maze of special
cases fails the fix bar even when the underlying risk is serious.
