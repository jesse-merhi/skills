---
name: writing-good-tests
description: 'Write tests that catch distinct, credible failures in changed behavior and regressions, keep the coverage each one protects, and verify behavior before pushing.'
metadata:
  sources: |
    - adapted from [skills/engineering/tdd](https://github.com/mattpocock/skills/tree/6654f6b60cd9d5be8b54c6fafe44346dabeb3b76/skills/engineering/tdd) — recorded upstream review.
---

# Writing Good Tests

## Choose the proof

Read the changed contract and nearby tests, fixtures, routes and helpers, including staged, unstaged, untracked and deleted work. Before writing a test, including rejection tests, trace input to the tested code and establish that the situation can occur; an invented fixture is not proof.

Identify the caller-visible failure, required result, nearest overlapping test, and why that existing coverage misses this failure. Derive expectations independently from the implementation, using specifications or worked examples when available. Prefer a contract you can prove through existing interfaces over adding a production seam that exists only for the test. Rejecting an invented schema input adds no useful coverage.

Use application data definitions for successful fakes and fixtures. Do not redefine data or change application behavior to fit a fixture.

**Example:** Test retries for HTTP `429` only if that response can reach the retry handler and should trigger a retry. If the client handles it internally, injecting it into the handler invents an unreachable scenario.

Choose the lowest boundary that proves the failure: unit tests for policy or parsing; integration for real bindings, persistence or isolation; end-to-end journeys for visible cross-boundary behavior. Use parser/linter plus execution for declarative configuration. Follow repository instruction-exercise and linter validation policy, not deterministic tests of skill prose or linter implementation.

Keep required behavior covered. Before deleting a smaller test, inspect the broader replacement: it must exercise the same branch with equivalent input and outcome at the required cadence. Code paths, manual checks, planned tests and types are not replacements.

Keep separate denial, forbidden-effect, privacy, accessibility, safety, expiry, concurrency, offline, migration and external-failure checks when the journey does not prove them. Test absence of retired behavior only when it protects promised compatibility, security or migration.

## Write tests worth keeping

Limit cleanup to affected behavior and necessary coverage. Rewrite weak tests when their coverage matters; reorganize only if a file obscures affected scenarios. Remove useless in-scope tests without losing required coverage.

When an existing test fails, preserve its expected result unless the authorized behavior changed or evidence shows the expectation was wrong. Record the reason for changing a promised result in the existing task or PR explanation; do not weaken an assertion merely to match the current implementation.

- Assert the result a caller observes: values, stored state, permissions, navigation or a stable accessibility contract. A status code or successful render alone may not prove the behavior.
- For denied actions, assert both rejection and absence of forbidden effects.
- Keep fixtures small and expectations independent. Several assertions may prove one behavior.
- Use real internal collaborators. Substitute external APIs, clocks, filesystems or databases only when unreliable or disproportionately expensive, through existing interfaces with realistic results.
- Use named, parameterized cases when they make related behaviors easier to read and extend. Give each case a clear purpose and keep scenarios separate when their setup or assertions differ.
- Remove tests that cannot fail for the intended reason: tautologies, assertions whose expected value the subject itself produced, source-structure or grep checks without an independent contract, mocks that supply the behavior being asserted, and negative controls that would pass for the wrong reason. Remove incidental mock-call/order assertions, unreachable states, broad snapshots and branch-history assertions. Keep exact text, timing or geometry only for a real product, accessibility, safety or protocol contract.
- Remove unused test routes, fixtures and helpers with their retired tests. Old age, past success or having once caught a bug does not establish current value.

## Implement and prove the behavior

Write tests before or after implementation as useful. Add a test only where a distinct, credible failure or regression is not already proven. A change does not by itself require a new test; reuse existing proof, including for covered refactors.

A regression test must fail against the unfixed code for the intended reason and pass after the fix. Passing tests and coverage numbers do not prove a test detects the fault; when that is in doubt, temporarily reintroduce the known bug or mutate the covered line locally to confirm the test fails, then restore the code before final validation or commit, without adding new tooling.

Use the [global test policy](https://github.com/jesse-merhi/skills/blob/main/AGENTS.md#test-and-review-design) to select checks and decide when results need refreshing. Before fixing a review finding, confirm the bug can happen and the repair is authorized.

The coordinator chooses coverage and accepts results. Assign one owner to run shared validation after integration; implementation workers return their changes and focused evidence.

## Run established checks

Batch established tests, lint, typechecks or prepared acceptance flows for Luna/max when delegation helps; keep small checks local. Supply checkout, revision and dirty changes, ordered commands, expected results, environment, time limits and log location. Assign one batch, not one worker per command.

Use the configured `test_executor` role at GPT-6 Luna, max effort. If it is unavailable, use a fresh unnamed worker with explicit model and effort settings and point it to this skill. Check the actual launch settings. If neither route is available, report the limitation and keep suitable execution local; do not change live configuration.

Check checkout and inputs before execution under repository permissions, including manual E2E/Maestro triggers. Stop at the first failure, timeout, input change or ambiguity. Return command, status, relevant output and checks not run. Do not retry, debug, repair, install or start external/paid jobs. The coordinator assigns substantive diagnosis, new test design and authorized repair to Sol/high before further execution.

Use `wait-efficiently` for prolonged runs. Return completion, failure or a decision needed, with useful progress updates.

## Record the results

Save each check's command, selection and coverage, checkout, revision and dirty-content identity, relevant source/callers, tests/fixtures, dependencies, configuration, runtime/environment, outcome, exit status and log path. Compare input identity before and after; changed inputs invalidate proof for the final checkout. Use existing check-result storage or task evidence directory. Review coverage is not test evidence.

For reuse on a later revision, retain the original receipt and input-flow evidence. A filename alone does not prove independence; never call old execution fresh.

Before pushing, verify required behavior and satisfy applicable checks under the global test policy.

## Check cost and finish

Consider selection, cases, setup, retries, fixtures, caching, sharding, capacity and scheduling. For material cost change or explicit optimization, establish a comparable baseline before editing; otherwise state no material execution-cost impact. Never trade unique coverage for speed or deletion targets.

Report only useful decisions: keep, consolidate, move, rewrite, delete, missing, no-test-needed or dangerous-removal. Identify last-owner removals, the inspected replacement and why adjacent coverage is insufficient. Give validation results and honest measurement limits, not a quota of added tests.

## References

- [Expensive suites](references/expensive-suites.md): For a material cost change or explicit optimization work, use before editing and establish a comparable baseline.
