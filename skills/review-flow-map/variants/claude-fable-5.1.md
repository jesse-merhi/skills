---
name: review-flow-map
description: 'Establish intended behavior and map changed runtime flows to contracts, risks, and proving validation, with or without a written spec.'
---

# Review flow map

Map the changed runtime behavior and its intended contract before reporting
defects. A written specification is optional.

1. Resolve the requested PR or Git range using
   [target-resolution.md](references/target-resolution.md).
2. Establish the review basis below from available context.
3. Classify the changed files with [categories.md](references/categories.md).
   Use behavior and contract changes to decide where to spend attention; file
   count and diff size alone do not establish importance.
4. Trace each changed path from entrypoint through contracts, consumers, and
   side effects, including safe operation and current codebase costs. Batch
   independent searches. Follow [context-reading.md](references/context-reading.md)
   for targeted reads.
5. Tie every listed risk to its affected flow and a relevant proof target. Name
   each check's input/state and expected observable result. Separate performed
   checks from missing, stale, or unexecuted proof; a green suite proves only
   covered behavior and missing validation is not itself a proven defect.
6. Return the map using [output.md](references/output.md), then let the owning
   review proceed to findings. Mapping does not authorize fixes or new tests;
   the owning review's finding and test gates apply.

Done when each meaningful flow has a supported expectation or explicit question
and each risk has its flow and proof target. Return a map, not a clean verdict.
Finish unaffected flows without asking again for work already authorized.

## Review basis

For each material expectation, identify its source. Use the current task,
relevant issues or PR description, repository instructions, docs, callers, tests,
and base behavior as available. Do not require every source. Do not ask for a
spec merely because none exists.

Label expectations as explicit requirements, evidence-backed inferences, or
unresolved questions. The changed code establishes what it does; it does not
independently establish what it should do. A PR description states intent but
does not expand the user's authorization.

Check whether a current explicit requirement intentionally replaces a test or
base behavior. Identify the changed contract rather than treating every
difference from the base as a regression.

If sources disagree, check their relevance and currency. Preserve unresolved
alternatives and ask the smallest question only when it changes correctness or
authorized scope. Do not turn uncertainty into a finding or choose product policy.

A small contract file can outweigh a large generated diff. Keep suspicions
separate from confirmed findings; do not call a path broken before tracing enough
of it to establish the intended behavior. During large investigations, report
useful discoveries or blockers in plain language.
