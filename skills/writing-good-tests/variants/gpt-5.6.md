---
name: writing-good-tests
description: 'Plan useful test coverage, audit test quality, and implement behavior through test-first cycles.'
metadata:
  sources: |
    - adapted from [skills/engineering/tdd](https://github.com/mattpocock/skills/tree/6654f6b60cd9d5be8b54c6fafe44346dabeb3b76/skills/engineering/tdd) — recorded upstream review.
---

# Writing Good Tests

Decide what behavior needs proof, find the coverage that already exists, then implement only the authorized change. In review-only work, inspect and report; do not edit code or start red-green cycles.

## Choose the proof

Read the changed contract and nearby tests, fixtures, routes and helpers, including staged, unstaged, untracked and deleted work. For each proposed test, identify the realistic regression, the caller-visible failure, an independently known expected result and the nearest overlapping proof. Specifications and worked examples can supply expectations; copying the implementation into the assertion cannot.

Choose the lowest practical boundary that proves the failure: unit tests for policy or parsing, integration tests for real bindings/persistence/isolation, and a useful end-to-end journey for visible cross-boundary behavior. Use parser/linter plus execution for declarative configuration. Do not test skill prose or linter implementation; apply the repository's instruction-exercise and linter validation policy.

Keep one test responsible for proving each promised regression. A broader test replaces a smaller one only when it exercises the same branch with equivalent inputs, asserts the same outcome and runs at an equivalent required cadence. Inspect that replacement before deleting the old owner. Passing through code, manual coverage, planned tests and types alone are not replacements.

Keep distinct denial, forbidden-effect, privacy, accessibility, safety, expiry, concurrency, offline, migration and external-failure checks when the complete journey does not prove them. Retired behavior needs no test unless its absence still protects a promised compatibility, security or migration property.

## Write tests worth keeping

- Assert the result a caller observes: values, stored state, permissions, navigation or a stable accessibility contract. A status code or successful render alone may not prove the behavior.
- For denied actions, assert both rejection and absence of forbidden effects.
- Keep fixtures small and expectations independent. Several assertions may prove one behavior.
- Use real internal collaborators. Substitute an external API, clock, filesystem or database only when the real boundary is unreliable or disproportionately expensive, using the existing interface and realistic results.
- Consolidate repeated shapes into named, object-shaped cases only when each row proves a distinct regression.
- Remove tautologies, incidental mock-call/order assertions, impossible states, broad snapshots and branch-history assertions. Keep exact text, timing or geometry only when a real product, accessibility, safety or protocol contract needs it.
- Remove unused test routes, fixtures and helpers with their retired tests. Old age, past success or having once caught a bug does not establish current value.

## Implement one behavior at a time

When behavior is missing, write or adapt its useful test, run it and confirm it fails for the missing behavior rather than broken setup. Implement the smallest complete solution, then refactor while green.

If existing coverage already proves the behavior, reuse it. Do not invent a new test or break working code to manufacture a red phase. For already-covered refactors, preserve the contract and use the existing checks.

Run the affected test after each meaningful change, then broader relevant checks when the slice is stable. Stop on the first test error and diagnose it before rerunning. Review-discovered bugs still need reachable-flow evidence and repair authority; an isolated synthetic test does not establish either.

## Check cost and finish

Consider selection, expanded cases, setup, retries, fixtures, caching, sharding, capacity and scheduling. For a material cost change or explicit optimization work, establish a comparable baseline before editing. Otherwise state no material execution-cost impact. Do not trade unique coverage for a speed or deletion target.

Report only useful decisions: keep, consolidate, move, rewrite, delete, missing, no-test-needed or dangerous-removal. Identify last-owner removals, the inspected replacement and why adjacent coverage is insufficient. Give validation results and honest measurement limits, not a quota of added tests.

## References

- [Expensive suites](references/expensive-suites.md): For a material cost change or explicit optimization work, use before editing and establish a comparable baseline.
