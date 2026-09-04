---
name: review-flow-map
description: 'Establish intended behavior and map changed runtime flows to contracts, risks, and proving validation, with or without a written spec.'
---

# Review flow map

Before writing findings, establish what the change should achieve and map the
affected flows to evidence that can check it. Do this with the available context;
a written specification is optional. Return a review map, not a clean verdict.

## Workflow

1. Resolve the target with [target-resolution.md](references/target-resolution.md).
2. Establish the review basis below. Record the requested outcome, preserved
   obligations, supporting sources, and material uncertainty.
3. Classify changed files using [categories.md](references/categories.md).
4. Trace each meaningful changed flow end to end. Use the targeted reads in
   [context-reading.md](references/context-reading.md). Batch independent reads
   when possible; keep a long user-facing investigation understandable with brief
   progress updates.
5. Return the complete map using [output.md](references/output.md). Separate checks
   already performed from checks still needed. Continue through unaffected flows
   even when another flow has an unresolved question.

Done when every meaningful changed flow has a supported expected outcome or an
explicit unresolved question, its affected contracts and risks, and a concrete
way to check it. Complete the map without asking again for work already authorized.

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

If sources disagree, check their relevance and currency. Keep unresolved
alternatives visible. Ask the smallest question only when its answer would
materially change correctness or authorized scope. Review the unaffected flows
in the meantime. Do not turn an uncertain expectation into a finding or choose
an unstated product policy.

Trace intended behavior, safe operation, current codebase costs, and proof.
These are investigation questions, not a requirement to produce findings,
refactors, or new tests. For a proposed check, state its input or state, expected
observable result, and why it exercises the contract. Passing tests establish
only the behavior they cover. Missing validation is a gap, not a proven bug.

## Required discipline

- Start from behavior and contracts, not file count.
- Prioritize consequential contracts over large generated diffs.
- Keep suspected issues separate from confirmed findings.
- Hand leads to the owning review's actionability and test-portfolio gates.
  Mapping does not authorize fixes or new tests.

## Context pointers

- [target-resolution.md](references/target-resolution.md): PR and git range commands.
- [categories.md](references/categories.md): changed-file classification.
- [context-reading.md](references/context-reading.md): targeted context and flow tracing.
- [output.md](references/output.md): review-map shape and evidence status.
