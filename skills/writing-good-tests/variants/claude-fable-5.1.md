---
name: writing-good-tests
description: 'Use during coding and review to delete low-value tests, keep useful real journeys, and justify every permanent keeper.'
metadata:
  sources: |
    - adapted from [skills/engineering/tdd](https://github.com/mattpocock/skills/tree/6654f6b60cd9d5be8b54c6fafe44346dabeb3b76/skills/engineering/tdd) — recorded upstream review.
---

# Writing Good Tests

Delete first. Every permanent keeper, including E2E, must catch a credible, consequential, non-obvious accidental regression that effective existing proof misses and is worth maintaining. Otherwise delete it or record no-test-needed. Unique branches, prior bugs, sensitive categories and coverage percentages do not earn retention. No test or deletion quota.

Default to no dedicated tests for configuration, plumbing, routine helpers and obvious guards. Prefer clear code and useful executable workflows over testing each internal function. “A developer could break this line” or a failing mutant proves detection, not maintenance value. Keep complete golden journeys that prove useful actions and lasting results. Delete repeated permutations, incidental assertions, source/constant mirrors and test-only scaffolding. Low-value layers and last owners may retire without replacements; state what loses permanent coverage and why.

Retirement does not invite new tests for the same guards at another level. When claiming consolidation, inspect equivalent reachable input, relevant branch, asserted outcome and execution cadence. Types, manual checks and planned tests are not permanent replacements. Preserve explicitly required tests/checks and justified consequential proof; runner registration alone does not make a test required.

## Choose proof

Trace real callers and supported inputs through the changed contract. Inspect nearby tests and all working changes, including deletions. Name the failure, independent expected result and gap in existing proof. Invented rejection inputs prove nothing. Build small fixtures from application definitions; do not alter production behavior to fit them or add test-only seams.

Prefer integration through existing interfaces with real first-party collaborators and relevant stores. Use E2E for complete journeys and UI/native binding. For backend decisions, use [backend-testing](../backend-testing/SKILL.md). Unit tests are exceptional: require the value case, an independently specified result and cases integration cannot reasonably exercise. Purity or a dense matrix alone is insufficient.

Use temporary scripts, scratch tests and manual checks for investigation. Keep results with the task; remove temporary checks before delivery. Useful development proof need not become a permanent test. Validate stable setup with its parser/linter and a smoke check. Follow repository policy for instruction exercises and linter validation; do not test skill prose or linter internals.

## Assert behavior

- Prove caller-visible values, persisted state, permissions or navigation. Status or render alone may miss the result. For denials, assert rejection and absence of forbidden effects.
- Substitute external/native/environment boundaries through existing interfaces with realistic results. Mocked first-party services or stores cannot prove their integration or persistence; report that limit.
- Keep expectations independent. Delete tautologies, subject-derived expected values, mock-supplied behavior, unreachable states, broad snapshots and branch-history assertions. Exact text, timing or geometry needs a real product, accessibility, safety or protocol contract and the value case.
- Investigate consequential denial, privacy, safety, accessibility, expiry, concurrency, offline, migration and external-failure gaps; categories do not mandate tests. Group equivalent cases only when setup and assertions remain clear.

Limit cleanup to affected behavior. Rewrite weak tests only where protection matters. Preserve a failing test's expected result unless authorized behavior changed or evidence disproves it; record why. Do not weaken assertions to match a bug.

A regression test must fail against unfixed code for the intended reason and pass after the fix. If detection is uncertain, temporarily restore the bug or mutate the line, confirm failure, then restore code before final validation. Add no tooling for this.

## Execute and finish

The [global policy](https://github.com/jesse-merhi/skills/blob/main/AGENTS.md#test-and-review-design) owns roles, authority and evidence reuse. The coordinator chooses proof, accepts results and diagnoses failures; workers return focused evidence. Verify required behavior before pushing. Reuse valid results; broaden checks only for an unresolved question, invalidated evidence or an explicit requirement.

When delegation helps, batch established checks or prepared acceptance flows for Luna/max. Supply checkout/revision/dirty changes, ordered commands, expected results, environment, time limits and logs. Keep small checks local.

Claude's `Agent` tool cannot select GPT models and has no `test_executor`. Use an already-authorized launcher for GPT-6 Luna/max when available, with this skill; verify settings. Otherwise report the limit and run suitable checks locally. Do not change live configuration.

Check inputs before execution. E2E/Maestro remain manually triggered; external/paid jobs need existing authority. An executor stops at the first failure, timeout, changed input or ambiguity and returns command, status, relevant output and unrun checks. It does not retry, diagnose, repair, install or launch external/paid jobs. The coordinator handles diagnosis and authorized repair before more execution. Use `wait-efficiently` for prolonged runs and useful progress updates.

Record command, revision including dirty changes, environment, outcome and log path. Reused evidence keeps its original record; never call it fresh. Review is not test execution.

Report keep/consolidate/move/rewrite/delete/missing/no-test-needed/dangerous-removal decisions, keeper value, last-owner retirement versus inspected replacement, checks and limits. For material cost work, read [Expensive suites](references/expensive-suites.md) before editing and establish a comparable baseline; otherwise state no material execution-cost impact. Speed alone does not justify losing valuable proof.
