# Fixing And Reporting

## Fixing Findings

- Fix only what maps to actionable review findings.
- Prefer the smallest change that addresses the review concern.
- Do not bundle unrelated cleanup into the fix step.
- Run the relevant tests, typechecks, linters, or UI validation for the changed
  surface before the next review.
- Record why each added or changed test catches a reachable product, API,
  workflow, security, or data regression in the related finding record.
- Inspect the diff after fixing so you can confirm the next review sees the
  intended tree.
- If a finding is invalid, document why and run another review. Do not count
  your rejection as a clean pass by itself.

## Reporting

Narrate one short line per iteration:

```text
iter 1: codex review --uncommitted -> 2 findings -> fixed
iter 2: codex review --uncommitted -> clean (1/2)
iter 3: codex review --uncommitted -> clean (2/2)
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
