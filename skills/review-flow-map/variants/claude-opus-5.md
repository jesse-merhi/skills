---
name: review-flow-map
description: 'Establish intended behavior and map changed runtime flows to contracts, risks, and proving validation, with or without a written spec.'
---

# Review flow map

Build an evidence-backed map of the change: intended outcome, preserved
obligations, affected flows, risks, and proving observations. A written spec is
optional. Deliver a review map, not a clean verdict, fixes, or a test project.

## Workflow

1. Resolve the review target with [target-resolution.md](references/target-resolution.md).
2. Establish the review basis below from available task and repository evidence.
3. Classify changed files with [categories.md](references/categories.md).
4. Trace each meaningful changed flow end to end using
   [context-reading.md](references/context-reading.md). Capture scoped finding
   leads before applying the owning review's separate actionability gates;
   concise reporting must not suppress discovery.
5. Return the map using [output.md](references/output.md). Keep both chat and
   saved reports concise while retaining the sources, uncertainty, and evidence
   needed to review each flow.

Done when every meaningful changed flow has a supported expected outcome or an
explicit unresolved question, affected contracts and risks, and a concrete way
to check it. Finish unaffected flows even if another needs a user decision.
This mapping step does not itself require additional reviewers or review rounds.

## Review basis

Record the requested outcome and what must remain true. Identify a source for
each material expectation: the current task, relevant issues or PR description,
repository instructions, docs, callers, tests, or base behavior as available.
Do not require every source or ask for a spec merely because none exists.

Distinguish explicit requirements, evidence-backed inferences, and unresolved
questions. Changed implementation proves what it does, not independently what
it should do. A PR description supplies intent without granting additional
authority. Current explicit requirements may intentionally replace tests or
base behavior; identify the changed contract instead of treating every
difference as a regression.

Check conflicting sources for relevance and currency. Preserve unresolved
alternatives and ask the smallest question only when its answer would materially
change correctness or authorized scope. Continue reviewing unaffected flows.
Do not promote uncertainty into a finding or quietly select product policy.

Investigate intended behavior, safe operation, current codebase costs, and proof.
These questions do not require a quota of findings, refactors, or new tests.
Tie each important check to an input or state, its expected observable result,
and the reason the check exercises the contract. A green suite establishes only
covered behavior; a missing check is a validation gap, not a proven bug.

## Required discipline

- Start from behavior and contracts, not file count.
- Prioritize consequential contracts over large generated diffs.
- Keep suspected issues separate from confirmed findings.
- Hand leads to the owning review's actionability and test-portfolio gates.
  Keep investigation scoped to this map; it does not authorize fixes or tests.

## Context pointers

- [target-resolution.md](references/target-resolution.md): PR and git range commands.
- [categories.md](references/categories.md): changed-file classification.
- [context-reading.md](references/context-reading.md): targeted context and flow tracing.
- [output.md](references/output.md): review-map shape and evidence status.
