---
name: review-flow-map
description: 'Establish intended behavior and map changed runtime flows to contracts, risks, and proving validation, with or without a written spec.'
---

# Review flow map

Establish what the change should accomplish, what must remain true, and which
observations would prove it. Use available evidence to complete the review map;
a missing written spec is not a reason to stop. The map guides the owning review
and does not certify a clean result.

## Workflow

1. Resolve the target with [target-resolution.md](references/target-resolution.md).
2. Establish the review basis below. Resolve ordinary uncertainty from relevant
   task and repository evidence; preserve decisions that need the user's input.
3. Classify changed files with [categories.md](references/categories.md).
4. Trace each meaningful changed flow using
   [context-reading.md](references/context-reading.md).
5. Return a concise map using [output.md](references/output.md), including
   sources, material uncertainty, and the status of available proof.

Done when each meaningful changed flow has a supported expected outcome or an
explicit unresolved question, affected contracts and risks, and a concrete check.
Complete unaffected flows before handing back a question. Keep the map and any
saved report focused on evidence needed for the review.

## Review basis

Record the requested outcome and preserved obligations. Source each material
expectation from the current task, relevant issues or PR description, repository
instructions, docs, callers, tests, or base behavior as available. Not every
source is required. Distinguish explicit requirements, supported inferences,
and unresolved questions.

Changed code shows what the implementation does, not independently what it
should do. A PR description states intent without expanding the user's
authorization. A current explicit requirement may intentionally replace a test
or base behavior: identify that contract change rather than assuming the old
behavior is still required.

For conflicting sources, check relevance and currency. Keep unresolved
alternatives visible. Ask the smallest question only when its answer would
materially change correctness or authorized scope; do not ask for a spec or
confirmation that available evidence already supplies. Continue unaffected work.
An uncertain expectation is not a finding, and choosing unstated product policy
is not part of mapping the change. Explicit user instructions take precedence
over this skill's guidelines without overriding higher-priority instructions.

Trace intended behavior, safe operation, current codebase costs, and proof.
These are investigation questions, not quotas for findings, refactors, or tests.
For each important check, identify the input or state, expected observable result,
and why it exercises the contract. A green suite proves only what it covers;
missing validation is a gap, not by itself a proven bug. Keep investigation and
checks within the changed flows and the owning workflow's requirements.

## Required discipline

- Start from behavior and contracts, not file count.
- Prioritize consequential contracts over large generated diffs.
- Keep suspected issues separate from confirmed findings.
- Pass leads through the owning review's actionability and test-portfolio gates.
  The map does not authorize fixes or new tests.

## Context pointers

- [target-resolution.md](references/target-resolution.md): PR and git range commands.
- [categories.md](references/categories.md): changed-file classification.
- [context-reading.md](references/context-reading.md): targeted context and flow tracing.
- [output.md](references/output.md): review-map shape and evidence status.
