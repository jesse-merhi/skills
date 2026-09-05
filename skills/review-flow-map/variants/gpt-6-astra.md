---
name: review-flow-map
description: 'Establish intended behavior and map changed runtime flows to contracts, risks, and proving validation, with or without a written spec.'
---

# Review flow map

Establish what the change should accomplish, what it does, and how a reviewer
can prove it. This map precedes findings; it is not itself a list of bugs or a
clean verdict. A missing written spec is not a reason to stop.

Resolve the review scope from the user's request and Git evidence with
[target-resolution.md](references/target-resolution.md). Ask only if remaining
ambiguity changes the target.

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

Resolve routine uncertainty from relevant, current evidence. Preserve unresolved
alternatives; ask the smallest question only when it changes correctness or
authorized scope, not for confirmation already supplied. Complete unaffected
flows without promoting uncertainty into a finding or choosing product policy.
Explicit user instructions outrank this skill's guidelines, subject to
higher-priority instructions.

## Map and proof

Classify changed behavior with [categories.md](references/categories.md). Trace
each relevant flow from entrypoint through exchanged contracts and side effects,
including safe operation and current codebase costs. Select context with
[context-reading.md](references/context-reading.md). Prioritize consequential
boundaries even when their diff is small; avoid equal attention to every file or
broad unrelated exploration.

Complete one concise map using [output.md](references/output.md). Every listed
risk must point to its affected flow and a relevant proof target. Name the check's
input/state and expected observable result; distinguish performed checks from
missing, stale, or unexecuted proof. Green tests prove only covered behavior;
missing validation alone is not a proven bug. Keep checks within the changed
flows and the owning workflow's requirements.

Done when each meaningful flow has a supported expectation or explicit question
and every risk has its flow and proof target. Preserve suspected versus confirmed
defects. The owning review's finding and test gates apply; mapping does not
authorize fixes, new tests, or additional review rounds.
