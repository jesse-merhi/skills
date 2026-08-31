# Fixing and reporting

## Fixing findings

- Fix only what maps to actionable cold-review findings.
- Apply `review-guardrails`' autonomous fix bar before editing. Reject
  unsupported cases; record residual risk only when reachability and impact are
  proven.
- Prefer the smallest durable repair at the boundary that owns the problem.
  Reject a local patch that merely quiets the reported symptom.
- Do not bundle unrelated cleanup into the fix step.
- Run the relevant tests, typechecks, linters, or UI validation for the changed
  flows before the next cold review.
- Add or change a test only after the repair passes the actionability gate.
  Record why it catches a reachable, stable product, API,
  workflow, security, or data regression in the related finding record.
- Inspect the diff after fixing so you can confirm the next reviewer is seeing
  the intended tree.
- If a finding is invalid, document why and run another cold review. Do not
  count your rejection as a clean pass by itself.

## Reporting

Narrate one short line per iteration:

```text
iter 1: cold review -> 3 findings -> fixed
iter 2: cold review -> 1 finding  -> fixed
iter 3: cold review -> clean (1/1)
```

On termination, report:

- Final iteration count
- Stop reason: `clean-pass-met`, `blocked-on-consult`, or
  `budget-expired`
- Last cold-review summary and merge verdict
- Findings fixed directly
- Findings intentionally rejected as invalid, with rationale
- Consult-queue findings awaiting the user, with their finding records
- Verification commands and results
