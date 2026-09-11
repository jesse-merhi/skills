---
name: review-flow-map
description: 'Map changed runtime flows through contracts and side effects to risks and proving validation.'
---

# Review flow map

Use this skill before writing findings. Build a review map: what changed, where
execution starts, what contracts move between files, and which checks would
actually prove the change.

## Workflow

1. Resolve the review target with [target-resolution.md](references/target-resolution.md).
2. Classify changed files by behavior category using
   [categories.md](references/categories.md).
3. Trace each changed flow end to end.
4. Read context selectively with the search patterns in
   [context-reading.md](references/context-reading.md).
5. Produce the map before findings, using [output.md](references/output.md).

## Required discipline

- Start from behavior and contracts, not file count.
- Do not review all files equally; small contract files can matter more than
  large generated diffs.
- Keep suspected issues separate from confirmed findings.
- Do not call something a bug until the relevant flow has been traced enough
  to know the intended contract.

## Context pointers

- Use [target-resolution.md](references/target-resolution.md) for PR and git
  range commands.
- Use [categories.md](references/categories.md) for changed-file classification.
- Use [context-reading.md](references/context-reading.md) for targeted context
  commands and flow-tracing fields.
- Use [output.md](references/output.md) for the review map shape and discipline.
