---
name: review-flow-map
description: 'Establish intended behavior and map changed runtime flows to contracts, risks, and proving validation, with or without a written spec.'
---

# Review flow map

Produce the evidence map that a review needs before it can make findings:
intended and changed behavior, runtime entrypoints, contracts, side effects,
risks, and checks that can prove the behavior. A written specification is optional.

Resolve the target with [target-resolution.md](references/target-resolution.md).

## Review basis

Record the requested outcome and preserved obligations. Source each material
expectation from the current task, relevant issues or PR description, repository
instructions, docs, callers, tests, or base behavior as available. Do not require
every source or ask for a spec merely because none exists.

Distinguish explicit requirements, evidence-backed inferences, and unresolved
questions. The changed implementation shows what it does, not independently what
it should do. A PR description states intent but does not expand the user's
authorization. Base behavior and tests may be obsolete when a current explicit
requirement intentionally changes them; identify that change instead of reporting
every difference as a regression.

Check conflicting sources for relevance and currency. Preserve unresolved
alternatives; ask the smallest question only when it changes correctness or
authorized scope. Continue unaffected flows without turning uncertainty into a
finding or selecting unstated product policy.

## Map and proof

Classify files by behavior using [categories.md](references/categories.md), then
trace each changed flow across its callers and consumers. Use
[context-reading.md](references/context-reading.md) to read the necessary context,
including safe operation and current codebase costs.

Judge significance by contracts and behavior. A small boundary file may matter
more than a large generated diff. Keep suspected defects separate from confirmed
findings until the relevant flow and intended contract are understood.

Return the map in [output.md](references/output.md) before writing findings.
Every listed risk should point to the flow it affects and a relevant proof target.
Name the check's input/state and expected observable result, distinguishing what
was checked from missing, stale, or unexecuted proof. Green tests prove only
covered behavior; missing validation is not by itself a proven bug.

Done when each meaningful flow has a supported expectation or explicit question
and each risk has its flow and proof target. The map is not a clean verdict or
authority to fix code or add tests; the owning review's finding and test gates apply.
