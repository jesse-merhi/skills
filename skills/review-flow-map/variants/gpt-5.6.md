---
name: review-flow-map
description: 'Map changed runtime flows through contracts and side effects to risks and proving validation.'
---

# Review flow map

Produce the evidence map that a review needs before it can make findings:
changed behavior, runtime entrypoints, contracts, side effects, risks, and checks
that can prove the behavior.

Resolve the target with [target-resolution.md](references/target-resolution.md).
Classify files by behavior using [categories.md](references/categories.md), then
trace each changed flow across its callers and consumers. Use
[context-reading.md](references/context-reading.md) to read the necessary context
without treating every file as equally important.

Judge significance by contracts and behavior. A small boundary file may matter
more than a large generated diff. Keep suspected defects separate from confirmed
findings until the relevant flow and intended contract are understood.

Return the map in [output.md](references/output.md) before writing findings.
Every listed risk should point to the flow it affects and a relevant proof target.
