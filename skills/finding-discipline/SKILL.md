---
name: finding-discipline
description: 'Filter review observations into confirmed, actionable, root-cause-deduplicated findings; exclude style nits and vague risks.'
---

# Finding Discipline

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

## Required Discipline

- Prefer no finding over a weak finding.
- Put non-actionable but useful context in residual risk or notes, not findings.
- Merge duplicates under one root cause.
- Remove findings that depend on unproven assumptions.
- Allow maintainability findings only when repository evidence proves a current
  cost such as unsupported defensive logic or needless indirection; do not use
  this exception for taste or hypothetical cleanup.
- Check each line reference still overlaps the reviewed change when possible.
- Make titles action-oriented, not diagnostic labels.

## Context Pointers

- Use [finding-bar.md](references/finding-bar.md) for the must-pass criteria.
- Use [exclusions.md](references/exclusions.md) for observations to drop.
- Use [confirmation.md](references/confirmation.md) before finalizing each
  finding.
- Use [output.md](references/output.md) for finding shape and severity.
