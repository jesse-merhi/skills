---
name: finding-discipline
description: 'Confirm actionable review findings, deduplicate root causes, and exclude nits, vague risks, and style notes.'
---

# Finding discipline

Decide which candidate observations meet the review's actionability contract.
This is an internal review lens: return accepted findings and audit-only
rejections to the caller without user-facing progress or a separate final
verdict.

Write only the finding records and rejection evidence required by the referenced
formats; do not create a duplicate review report. The risk, three-gate,
confirmation, and severity checks below are the complete decision path. Perform
this judgment in the current context and do not delegate it.

Use this skill after you have inspected enough code to know a concrete runtime
failure or present maintenance cost. The goal is fewer, sharper findings that a
PR author can fix.

## Workflow

1. Treat reviewer output as candidate observations. For each runtime candidate,
   apply the likelihood-impact framework in
   [risk-rating.md](references/risk-rating.md), then apply the finding bar in
   [finding-bar.md](references/finding-bar.md).
2. Apply the three-gate actionability contract in
   [actionability.md](references/actionability.md). Treat this as the required
   decision point for whether a candidate may produce a finding, code, or a
   test.
3. Drop excluded observations using [exclusions.md](references/exclusions.md).
4. Run the confirmation pass in [confirmation.md](references/confirmation.md).
5. Write each finding with the format and severity rules in
   [output.md](references/output.md).
6. Perform the final review pass before presenting findings.

## Required discipline

- Optimize candidate generation for recall and finding acceptance for precision.
- Prefer no finding over a weak finding.
- Require reality, importance, and repair quality to pass independently.
  Repair quality may authorize either a supported repair or an owner
  consultation when the problem is proven but the repair is not. Neither path
  automatically authorizes a patch or test.
- Put only proven, deliberately tolerated risk in residual risk. Reject
  theoretical possibilities instead of preserving them as warnings.
- Merge duplicates under one root cause.
- Remove findings that depend on unproven assumptions.
- Check each line reference still overlaps the reviewed change when possible.
- Make titles action-oriented, not diagnostic labels.

## Context pointers

- Use [risk-rating.md](references/risk-rating.md) for the required risk reality
  check and CLI-derived likelihood-impact outcome.
- Use [finding-bar.md](references/finding-bar.md) for the must-pass criteria.
- Use [actionability.md](references/actionability.md) for the required reality,
  importance, repair-quality, and verification gates.
- Use [exclusions.md](references/exclusions.md) for observations to drop.
- Use [confirmation.md](references/confirmation.md) before finalizing each
  finding.
- Use [output.md](references/output.md) for finding shape and severity.
