---
name: writing-good-tests
description: 'Use during coding and review to delete low-value tests, keep useful real journeys, and justify every permanent keeper.'
metadata:
  sources: |
    - adapted from [skills/engineering/tdd](https://github.com/mattpocock/skills/tree/6654f6b60cd9d5be8b54c6fafe44346dabeb3b76/skills/engineering/tdd) — recorded upstream review.
---

# Writing Good Tests

Start audits from deletion: every permanent test must earn its place. Clear production code and complete E2E journeys through real collaborators can make most unit and infrastructure tests redundant. Verify the requested behavior without treating every function, branch or edge case as a reason for permanent coverage. Test counts, coverage percentages and deletion quotas are not goals.

## Decide what deserves permanent proof

For every proposed or existing keeper, identify a credible, consequential, non-obvious accidental regression, why effective existing proof misses it, and why repeated detection is worth the ongoing maintenance. If that case is absent, delete the test or record no-test-needed. Uniqueness, a prior bug, a sensitive category, ease of testing and a coverage decrease do not independently justify retention.

Apply this value gate to every layer, including E2E. Keep useful complete golden journeys that prove what a person can accomplish and the lasting result. Delete repeated permutations, incidental UI assertions, source or constant mirrors, and isolated tests that add no worthwhile protection beyond those journeys. A browser visit or successful render alone is not complete proof.

An audit may retire a whole unit or infrastructure layer, including its last coverage of low-value behavior. State honestly what is no longer permanently tested and why; do not manufacture replacement tests to preserve coverage. Distinguish that decision from consolidation: when claiming another test preserves coverage, inspect it for equivalent reachable input, the relevant branch, asserted outcome and required execution cadence. Planned tests, types and manual checks are not permanent replacements.

Preserve explicitly required tests and checks. A credible consequential failure still needs effective proof; types or an assertion that the code is good do not excuse a missing required check or an uncovered regression that passes this gate. Sensitive categories prompt investigation of real consequences, not blanket retention.

For example, delete URL/flag mirrors after parser validation and a setup smoke check; delete helper permutations already proved by a real save-and-reload journey. A unique placeholder-copy branch can retire with no replacement when its ongoing detection is not worth maintaining. Keep an integration test for a reachable cross-tenant write that the normal journey cannot expose, asserting both rejection and absence of the write.

## Separate investigation from regression coverage

Use temporary scripts, assertions, scratch tests and manual checks to answer development questions. A check that helped build the change does not automatically belong in the committed suite. Keep useful results with the task or PR and remove temporary checks and their test-only scaffolding before delivery.

Temporary verification can establish behavior without adding a permanent test. Retain a check only if it passes the value gate above. A deliberate requirement change that also changes the test is not evidence of its regression value.

For stable, isolated infrastructure setup, prefer parser/linter validation and a setup smoke check. Do not retain tests that repeat chosen flags, URLs, constants, configuration or file structure. Retain focused coverage only for a concrete ongoing interaction or failure, such as selecting the wrong resource during recovery; importance alone does not justify a test for every safeguard.

## Choose the proof

Read the changed contract and nearby tests, fixtures, routes and helpers, including staged, unstaged, untracked and deleted work. Before writing a test, including rejection tests, trace input to the tested code and establish that the situation can occur; an invented fixture is not proof.

Identify the caller-visible failure, required result, nearest overlapping test, and why that existing coverage misses this failure. Derive expectations independently of the implementation, using specifications or worked examples when available. Use existing interfaces; do not add a production seam solely for test convenience. Rejecting an invented schema input adds no useful coverage.

Use application data definitions for successful fakes and fixtures. Do not redefine data or change application behavior to fit a fixture.

**Example:** Test retries for HTTP `429` only if that response can reach the retry handler and should trigger a retry. If the client handles it internally, injecting it into the handler invents an unreachable scenario.

When dedicated permanent proof is justified, prefer integration tests that run production collaborators together through an existing interface and assert returned values, persisted state, permissions or failure outcomes. Keep first-party logic and the relevant data store real. Use E2E for complete user journeys and UI or native binding; do not repeat their examples in isolated tests without an uncovered regression that passes the value gate. Follow repository instruction-exercise and linter validation policy, not deterministic tests of skill prose or linter implementation.

Permanent unit tests are an exception. Before adding one, establish all three: an independently specified expected result; a credible consequential non-obvious accidental regression existing coverage misses; and why integration cannot reasonably exercise the necessary cases. Dense calculation or state-machine boundaries can qualify when real integration setup makes those cases impractical. Being pure, having branches, being easy to test or adding a dependency does not by itself qualify. Keep the justification brief in the task or PR; no new registry, approval or test quota.

Inspect denial, forbidden-effect, privacy, accessibility, safety, expiry, concurrency, offline, migration and external-failure outcomes for credible consequential gaps the journey does not prove. Keep dedicated proof only when the gap passes the value gate, preferably through integration. Test absence of retired behavior only when a promised compatibility, security or migration outcome justifies ongoing protection.

For backend proof after this value decision, use [backend-testing](../backend-testing/SKILL.md) for real production callers, data stores, external boundaries and migration state.

## Write tests worth keeping

Limit cleanup to affected behavior and necessary coverage. Rewrite weak tests when their coverage matters; reorganize only if a file obscures affected scenarios. Delete low-value in-scope tests under the value gate; preserve justified proof and explicit required checks.

When an existing test fails, preserve its expected result unless the authorized behavior changed or evidence shows the expectation was wrong. Record the reason for changing a promised result in the existing task or PR explanation; do not weaken an assertion merely to match the current implementation.

- Assert the result a caller observes: values, stored state, permissions, navigation or a stable accessibility contract. A status code or successful render alone may not prove the behavior.
- For denied actions, assert both rejection and absence of forbidden effects.
- Keep fixtures small and expectations independent. Several assertions may prove one behavior.
- Substitute external APIs, native modules and environment boundaries through existing interfaces with realistic results. A mocked database or first-party service does not prove persistence or integration with that collaborator; label the limit and do not use such mocks to supply the result being asserted.
- Use named, parameterized cases when they make related behaviors easier to read and extend. Give each case a clear purpose and keep scenarios separate when their setup or assertions differ.
- Remove tests that cannot fail for the intended reason: tautologies, assertions whose expected value the subject itself produced, source-structure or grep checks without an independent contract, mocks that supply the behavior being asserted, and negative controls that would pass for the wrong reason. Remove incidental mock-call/order assertions, unreachable states, broad snapshots and branch-history assertions. Keep exact text, timing or geometry only for a real product, accessibility, safety or protocol contract.
- Remove unused test routes, fixtures and helpers with their retired tests. Old age, past success or having once caught a bug does not establish current value.

## Implement and prove the behavior

Write checks before or after implementation as useful. Separately decide which deserve permanent coverage under the retention and integration-first rules above. A change does not by itself require a new test; reuse existing proof, including for covered refactors. Prefer extending an existing integration scenario over adding helper tests or a second journey for the same outcome.

A regression test must fail against the unfixed code for the intended reason and pass after the fix. Passing tests and coverage numbers do not prove a test detects the fault; when that is in doubt, temporarily reintroduce the known bug or mutate the covered line locally to confirm the test fails, then restore the code before final validation or commit, without adding new tooling.

Use the [global test policy](https://github.com/jesse-merhi/skills/blob/main/AGENTS.md#test-and-review-design) to select checks and decide when results need refreshing. Before fixing a review finding, confirm the bug can happen and the repair is authorized.

The coordinator chooses coverage and accepts results. Assign one owner to run shared validation after integration; implementation workers return their changes and focused evidence.

## Run established checks

Batch established tests, lint, typechecks or prepared acceptance flows for Luna/max when delegation helps; keep small checks local. Supply checkout, revision and dirty changes, ordered commands, expected results, environment, time limits and log location. Assign one batch, not one worker per command.

Use `spawn_agent` with `agent_type: "test_executor"`. If unavailable, launch a fresh `default` agent with `model: "gpt-6-luna"`, `reasoning_effort: "max"`, and `fork_turns: "none"`, pointing it to this skill. Check the actual launch settings. If explicit settings are also unavailable, report the limitation and keep suitable execution local; do not change live configuration.

Check checkout and inputs before execution under repository permissions, including manual E2E/Maestro triggers. Stop at the first failure, timeout, input change or ambiguity. Return command, status, relevant output and checks not run. Do not retry, debug, repair, install or start external/paid jobs. The coordinator handles substantive diagnosis, new test design and authorized repair before further execution, using the `implementer` role when it is available and useful.

Use `wait-efficiently` for prolonged runs. Return completion, failure or a decision needed, with useful progress updates.

## Record the results

Record each check's command, revision including uncommitted changes, runtime environment, outcome and log path with the task. When reusing a result on a later revision, keep the original record and never call old execution fresh. Review coverage is not test evidence.

Before pushing, verify required behavior and satisfy applicable checks under the global test policy.

## Check cost and finish

Consider selection, cases, setup, retries, fixtures, caching, sharding, capacity and scheduling. For material cost change or explicit optimization, establish a comparable baseline before editing; otherwise state no material execution-cost impact. Speed alone does not justify losing valuable proof; unique coverage alone does not justify keeping a test.

Report useful decisions: keep, consolidate, move, rewrite, delete, missing, no-test-needed or dangerous-removal. Justify keepers and identify last-owner removals. For consolidation or required consequential coverage, name the inspected replacement and its limits. For deliberate low-value retirement, explain why no permanent test is needed without claiming a replacement. Give validation results and honest measurement limits, not a test quota.

## References

- [Expensive suites](references/expensive-suites.md): For a material cost change or explicit optimization work, use before editing and establish a comparable baseline.
