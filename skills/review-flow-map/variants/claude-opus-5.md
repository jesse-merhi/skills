---
name: review-flow-map
description: 'Establish intended behavior and map changed runtime flows to contracts, risks, and proving validation, with or without a written spec.'
---

# Review flow map

Deliver one compact map of the scoped change: intended outcome, preserved
obligations, runtime paths, contracts, effects, risks, and proving checks. A
written spec is optional. Complete flow coverage and collect scoped candidates
before applying the owning review's finding gates; concise reporting must not
suppress discovery. The map does not certify a clean result or authorize fixes
or tests.

## Scope and trace

Use [target-resolution.md](references/target-resolution.md) to establish the
review range. Establish the review basis below, then use
[categories.md](references/categories.md) to classify behavior. Trace each
changed path end to end, including safe operation and current codebase costs,
selecting context with [context-reading.md](references/context-reading.md).
Follow significant contract edges rather than reading every changed file equally.

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

## Map to return

Apply [output.md](references/output.md). Include each relevant flow and tie
every listed risk to its affected flow and a relevant proof target. Name the
check's input/state and expected observable result; distinguish performed checks
from missing, stale, or unexecuted proof. Green tests establish only covered
behavior; missing validation alone is not a proven bug.

Keep chat and saved reports compact without omitting a consequential boundary
because its diff is small. Distinguish confirmed behavior from suspected defects;
a bug claim needs enough evidence to establish the intended contract.

End when each meaningful flow has a supported expectation or explicit question
and every risk has its flow and proof target. Avoid unrelated architecture work,
additional reviewers or review rounds, or a separate generic verifier. The owning
review's actionability and test-portfolio gates decide whether leads justify action.
