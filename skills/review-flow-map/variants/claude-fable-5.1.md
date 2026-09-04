---
name: review-flow-map
description: 'Map changed runtime flows through contracts and side effects to risks and proving validation.'
---

# Review flow map

Map the changed runtime behavior before reporting defects.

1. Resolve the requested PR or Git range using
   [target-resolution.md](references/target-resolution.md).
2. Classify the changed files with [categories.md](references/categories.md).
   Use behavior and contract changes to decide where to spend attention; file
   count and diff size alone do not establish importance.
3. Trace each changed path from entrypoint through contracts, consumers, and
   side effects. Batch independent searches. Follow
   [context-reading.md](references/context-reading.md) for targeted reads.
4. Name the risks and the checks that would demonstrate each changed behavior.
   Keep an unconfirmed suspicion separate from a proven defect.
5. Return the map using [output.md](references/output.md), then let the review
   proceed to findings.

A small contract file can outweigh a large generated diff. Do not call a path
broken before tracing enough of it to establish the intended behavior. During
large investigations, report useful discoveries or blockers in plain language.
