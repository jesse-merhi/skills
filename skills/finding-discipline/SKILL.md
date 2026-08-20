---
name: finding-discipline
description: 'Confirm actionable review findings, deduplicate root causes, and exclude nits, vague risks, and style notes.'
---

# Finding discipline

Use this skill after you have inspected enough code to know a concrete runtime
failure or present maintenance cost. The goal is fewer, sharper findings that a
PR author can fix.

## Workflow

1. Check every candidate observation against the finding bar in
   [finding-bar.md](references/finding-bar.md).
2. Drop excluded observations using [exclusions.md](references/exclusions.md).
3. Run the confirmation pass in [confirmation.md](references/confirmation.md).
4. Write each finding with the format and severity rules in
   [output.md](references/output.md).
5. Perform the final review pass before presenting findings.

## Required discipline

- Prefer no finding over a weak finding.
- Put non-actionable but useful context in residual risk or notes, not findings.
- Merge duplicates under one root cause.
- Remove findings that depend on unproven assumptions.
- Check each line reference still overlaps the reviewed change when possible.
- Make titles action-oriented, not diagnostic labels.

## Context pointers

- Use [finding-bar.md](references/finding-bar.md) for the must-pass criteria.
- Use [exclusions.md](references/exclusions.md) for observations to drop.
- Use [confirmation.md](references/confirmation.md) before finalizing each
  finding.
- Use [output.md](references/output.md) for finding shape and severity.
