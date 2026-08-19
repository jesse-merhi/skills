# Risk Rating

Treat reviewer output as a hypothesis. Rate severity only after proving a
current production path and a meaningful consequence.

## Risk Reality Check

Record this case before assigning severity or proposing code:

```text
Production path: <current producer -> transformations -> failing sink>
Reachability evidence: <observed payload, current contract, or repository invariant>
Likelihood: likely | possible | rare | unknown | theoretical
Impact: critical | high | medium | low
Actual consequence: <verified behavior and meaningful user/system impact>
Disposition: accept | investigate | consult | residual | reject
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

## Default Rating

Use this table as the default, then explain any exception:

| Likelihood | Low impact | Medium impact | High impact | Critical impact |
| --- | --- | --- | --- | --- |
| likely | P3 only when repeated friction merits code | P2 | P1/P2 | P0/P1 |
| possible | no fix or P3 | P2/P3 | P1/P2 | P1 |
| rare | no fix | no fix or P3 | consult or P2 | consult or P1 |
| unknown | investigate; no severity or patch | investigate; no severity or patch | investigate; no severity or patch | investigate or consult; no patch |
| theoretical | reject | reject | reject | reject |

Low-probability, low-impact risk defaults to no finding and no code. Severity
reflects likelihood and impact together; worst-case impact alone cannot raise a
finding.

## Disposition

- `accept`: non-synthetic evidence proves the path and consequence, the table
  makes action worthwhile, and the behavior violates a current contract.
- `investigate`: reachability, likelihood, or sink behavior is still unproven.
  Gather evidence; do not patch.
- `consult`: the risk is proven, but tolerance or scope is a product, security,
  compatibility, operational, or architectural choice. Ask before patching.
- `residual`: the risk is proven and the current change deliberately leaves it
  unresolved. Record it without patching.
- `reject`: the path is theoretical or the combined risk does not justify code.

The burden of proof belongs to the finding. A test created from the reviewer's
example can verify a fix after acceptance; it cannot supply missing production
evidence.

## Defence In Depth

Rare does not mean harmless. Accept or consult on a defence-in-depth fix when
reachability is proven, impact is high or critical, the failure crosses a
security, data-integrity, or irreversible boundary, and the defence belongs at
the boundary that owns the invariant. Prefer an existing repository, framework,
or dependency primitive. A custom maze of special cases fails the fix bar even
when the underlying risk is serious.
