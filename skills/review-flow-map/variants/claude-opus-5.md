---
name: review-flow-map
description: 'Map changed runtime flows through contracts and side effects to risks and proving validation.'
---

# Review flow map

Deliver one compact map of the scoped change: runtime paths, contracts, effects,
risks, and proving checks. Complete the flow coverage before filtering potential
issues into findings.

## Scope and trace

Use [target-resolution.md](references/target-resolution.md) to establish the
review range and [categories.md](references/categories.md) to classify behavior.
Trace each changed path end to end, selecting context with
[context-reading.md](references/context-reading.md). Follow significant contract
edges rather than reading every changed file with equal weight.

## Map to return

Apply [output.md](references/output.md). Include each relevant flow and its proof
target, distinguishing confirmed behavior from suspected defects. A short map
must not omit a consequential boundary just because its diff is small.

End when changed-flow coverage and proof targets are recorded. Avoid extending
mapping into unrelated architecture work or adding a separate generic verifier.
A bug claim still requires enough evidence to establish the intended contract.
