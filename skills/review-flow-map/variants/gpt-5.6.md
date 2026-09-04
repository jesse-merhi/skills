---
name: review-flow-map
description: 'Establish intended behavior and map changed runtime flows to contracts, risks, and proving validation, with or without a written spec.'
---

# Review flow map

Build the evidence-backed basis for a review before writing findings: what the
change is meant to achieve, what must remain true, and which flows and observations
would show whether it succeeds. A written specification is optional.

## Workflow

1. Resolve the review target with [target-resolution.md](references/target-resolution.md).
2. Establish the review basis below from the available task and repository
   evidence. Keep material uncertainty visible instead of turning it into a
   requirement.
3. Classify changed files by behavior category using
   [categories.md](references/categories.md).
4. Trace each changed flow end to end. Read context selectively with
   [context-reading.md](references/context-reading.md).
5. Return the map using [output.md](references/output.md). Distinguish evidence
   already checked from validation still needed.

Done when each meaningful changed flow has a supported expected outcome or an
explicit unresolved question, its affected contracts and risks, and a concrete
way to check it. The map guides the owning review; it is not a clean verdict.

## Review basis

Record the requested outcome and preserved obligations, with the source of each
material expectation. Use the current task, relevant issues or PR description,
repository instructions, docs, callers, tests, and base behavior as available;
do not require every source or ask for a spec merely because none exists.

Distinguish explicit requirements, evidence-backed inferences, and unresolved
questions. The changed implementation shows what it does, not independently what
it should do. A PR description states intent but does not expand the user's
authorization. Base behavior and tests may be obsolete when a current explicit
requirement intentionally changes them; identify that change instead of reporting
every difference as a regression.

When sources conflict, check their relevance and currency and keep any unresolved
alternatives visible. Ask the smallest question only when the answer would
materially change whether behavior is correct or what work is authorized.
Continue reviewing unaffected flows; do not promote the uncertain expectation
into a finding or silently choose a product policy.

Use the basis to trace intended behavior, safe operation, current codebase costs,
and proof. These are questions to investigate, not quotas for findings, refactors,
or new tests. Describe the input or state, expected observable result, and why the
available check exercises it. A green suite is evidence only for the behavior it
actually covers; a missing check is a validation gap, not by itself a proven bug.

## Required discipline

- Start from behavior and contracts, not file count.
- Do not review all files equally; small contract files can matter more than
  large generated diffs.
- Keep suspected issues separate from confirmed findings.
- Hand finding leads to the owning review's actionability and test-portfolio
  gates; this map does not authorize fixes or new tests.

## Context pointers

- Use [target-resolution.md](references/target-resolution.md) for PR and git
  range commands.
- Use [categories.md](references/categories.md) for changed-file classification.
- Use [context-reading.md](references/context-reading.md) for targeted context
  commands and flow-tracing fields.
- Use [output.md](references/output.md) for the review map shape and discipline.
