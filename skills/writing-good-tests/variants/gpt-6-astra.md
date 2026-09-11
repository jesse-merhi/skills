---
name: writing-good-tests
description: 'Write effective regression tests, assess existing coverage, and verify implemented behavior before pushing.'
metadata:
  sources: |
    - adapted from [skills/engineering/tdd](https://github.com/mattpocock/skills/tree/6654f6b60cd9d5be8b54c6fafe44346dabeb3b76/skills/engineering/tdd) — recorded upstream review.
---

# Writing Good Tests

Establish the intended behavior and find existing coverage. Implement the authorized behavior, then add or adapt useful regression tests before pushing. In review-only work, inspect and report; do not edit code or run an implementation workflow.

## Choose the proof

Read the changed contract and nearby tests, fixtures, routes and helpers, including staged, unstaged, untracked and deleted work. Before writing a test—including a rejection test—prove the situation can happen in the code you’re testing. Trace where the input comes from and how it gets there. Inventing a fixture is not proof.

Identify the failure a caller would see, the required result, and the nearest overlapping test. Establish expectations independently of the implementation; specifications and worked examples can supply them. Merely proving that a schema validator rejects an invented object adds no useful coverage.

Use the application’s own data definitions for successful fakes and fixtures. Don’t redefine application data just for tests or change application behavior to make a fixture fit.

**Example:** Test retries for HTTP `429` only if that response can reach the retry handler and should trigger a retry. If the client handles it internally, injecting it into the handler invents an unreachable scenario.

Choose the lowest practical boundary that proves the failure: unit tests for policy or parsing, integration tests for real bindings/persistence/isolation, and a useful end-to-end journey for visible cross-boundary behavior. Use parser/linter plus execution for declarative configuration. Do not test skill prose or linter implementation; apply the repository's instruction-exercise and linter validation policy.

Keep one test responsible for proving each promised regression. A broader test replaces a smaller one only when it exercises the same branch with equivalent inputs, asserts the same outcome and runs at an equivalent required cadence. Inspect that replacement before deleting the old owner. Passing through code, manual coverage, planned tests and types alone are not replacements.

Keep distinct denial, forbidden-effect, privacy, accessibility, safety, expiry, concurrency, offline, migration and external-failure checks when the complete journey does not prove them. Retired behavior needs no test unless its absence still protects a promised compatibility, security or migration property.

## Write tests worth keeping

Keep test changes within the requested behavior. Broader test cleanup needs its own scope; discovering an unrelated weak test does not authorize rewriting it.

- Assert the result a caller observes: values, stored state, permissions, navigation or a stable accessibility contract. A status code or successful render alone may not prove the behavior.
- For denied actions, assert both rejection and absence of forbidden effects.
- Keep fixtures small and expectations independent. Several assertions may prove one behavior.
- Use real internal collaborators. Substitute an external API, clock, filesystem or database only when the real boundary is unreliable or disproportionately expensive, using the existing interface and realistic results.
- Consolidate repeated shapes into named, object-shaped cases only when each row proves a distinct regression.
- Remove tautologies, incidental mock-call/order assertions, inputs or states that cannot reach the code being tested, broad snapshots and branch-history assertions. Keep exact text, timing or geometry only when a real product, accessibility, safety or protocol contract needs it.
- Remove unused test routes, fixtures and helpers with their retired tests. Old age, past success or having once caught a bug does not establish current value.

## Implement, then prove the behavior

Test-first development is optional unless requested.

Implement a complete behavior and confirm its observable result against the agreed contract. Then write or adapt the smallest useful regression test, using expectations established independently of the implementation. If existing coverage already proves the behavior, reuse it; an already-covered refactor needs no new test.

Use focused checks during implementation when they answer a current uncertainty, diagnose a failure, or verify a repair. Review-discovered bugs still need reachable-flow evidence and repair authority before editing; a newly written failing test is not the only valid evidence, and an isolated synthetic test does not establish reachability or authority.

Before pushing, run the relevant regression tests and required repository checks on the completed implementation. After review repairs, rerun affected proof and complete the required final checks. Broaden or repeat testing only for relevant changes, failures, or unresolved concerns. Stop on the first test error and diagnose it before rerunning.

## Check cost and finish

Consider selection, expanded cases, setup, retries, fixtures, caching, sharding, capacity and scheduling. For a material cost change or explicit optimization work, establish a comparable baseline before editing. Otherwise state no material execution-cost impact. Do not trade unique coverage for a speed or deletion target.

Report only useful decisions: keep, consolidate, move, rewrite, delete, missing, no-test-needed or dangerous-removal. Identify last-owner removals, the inspected replacement and why adjacent coverage is insufficient. Give validation results and honest measurement limits, not a quota of added tests.

## References

- [Expensive suites](references/expensive-suites.md): For a material cost change or explicit optimization work, use before editing and establish a comparable baseline.
