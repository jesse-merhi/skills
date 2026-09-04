---
name: review-flow-map
description: 'Map changed runtime flows through contracts and side effects to risks and proving validation.'
---

# Review flow map

Establish what the change does and how a reviewer can prove it. This map precedes
findings; it is not itself a list of bugs.

Resolve the review scope from the user's request and Git evidence with
[target-resolution.md](references/target-resolution.md). Ask only if remaining
ambiguity changes the target. Then classify the changed behavior with
[categories.md](references/categories.md).

Trace each relevant flow from entrypoint through exchanged contracts and side
effects. Select context with [context-reading.md](references/context-reading.md).
Prioritize consequential boundaries even when their diff is small; avoid equal
attention to every file or broad unrelated exploration.

Complete one map using [output.md](references/output.md): changed paths, known
contracts, risks, and validation that would prove them. Preserve the distinction
between a suspect and a confirmed defect. Finish the map before findings, with
unresolved contract questions explicit rather than guessed.
