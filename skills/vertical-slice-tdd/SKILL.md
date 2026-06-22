---
name: vertical-slice-tdd
description: 'Implement behavior changes with one narrow failing vertical-slice test at a time for features, bugfixes, refactors, flows, and APIs.'
---

# Vertical Slice TDD

Drive the work through thin end-to-end behavior slices. Avoid writing
all tests first or building layers that do not yet connect.

## Loop

1. Pick the smallest externally meaningful behavior.
2. Write one failing test for that behavior. Prefer the highest level
   that still gives fast, stable feedback.
3. Run the test and show that it fails for the expected reason.
4. Implement only enough production code to pass that test.
5. Run the focused test.
6. Refactor only after green, keeping behavior unchanged.
7. Repeat for the next slice.
8. Finish with the package's relevant typecheck/lint/test commands.

## Slice Shape

A good first slice crosses the real boundary of the feature:

- UI to API to persistence
- command to filesystem effect
- parser input to normalized output
- webhook/event to stored state

It may be narrow, but it should prove the route through the system.

## Avoid

- Layer-only tasks such as "add schema", "add endpoint", or "add UI"
  unless they are part of the current passing slice.
- Broad test inventories before implementation.
- Mocking the behavior that the slice is supposed to prove.
- Refactors before a failing test makes the need concrete.

## When TDD Is Not Appropriate

For docs-only, config-only, generated-code, or mechanical formatting
changes, state the exception and use the smallest available validation
instead.
