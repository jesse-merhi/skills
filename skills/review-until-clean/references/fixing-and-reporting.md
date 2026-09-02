# Fixing and reporting

## Fixing findings

- Fix only what maps to actionable review findings.
- Apply `review-guardrails`' autonomous fix bar before editing. Reject
  unsupported cases; record residual risk only when reachability and impact are
  proven.
- Prefer the smallest durable repair at the boundary that owns the problem.
  Reject a local patch that merely quiets the reported symptom.
- Do not bundle unrelated cleanup into the fix step.
- Run the relevant tests, typechecks, linters, or UI validation for the changed
  flows before the next review.
- Add or change a test only after the repair passes the actionability gate.
  Record why it catches a reachable, stable product, API,
  workflow, security, or data regression in the related finding record.
- Inspect the diff after fixing so you can confirm the next review sees the
  intended tree.
- Commit all accepted fixes from one pass together before the next review. Do
  not create one commit per finding or rewrite earlier commits unless the user
  asks.
- If a finding is invalid, document why and run another review. Do not count
  your rejection as a clean pass by itself.

## Reporting

Narrate one short line per iteration:

```text
iter 1: codex review --base main -> 2 findings -> fixed and committed together
iter 2: codex review --base main -> clean (1/2)
iter 3: codex review --base main -> clean (2/2)
```

The claude engine narrates the same way:

```text
iter 1: code-review workflow high main...HEAD -> 1 finding -> fixed
iter 2: code-review workflow high main...HEAD -> clean (1/2)
iter 3: code-review workflow high main...HEAD -> clean (2/2)
```

On termination, report:

- Final iteration count
- Engine used and why (harness default or user override)
- Stop reason: `clean-pass-met`, `blocked-on-consult`, `budget-expired`, or
  `ambiguous-review`
- Target command or workflow args used
- Last review summary and verdict
- Findings fixed directly
- Findings intentionally rejected as invalid, with rationale
- Consult-queue findings awaiting the user, with their finding records
- Verification commands and results
- Review-state path and whether it was updated through the final stop reason
