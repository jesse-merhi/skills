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

Prefer integration through existing interfaces with real first-party collaborators and relevant stores. Use E2E for complete journeys and UI/native binding. For backend boundaries, apply [Backend](#backend). Unit tests are exceptional: require the value case, an independently specified result and cases integration cannot reasonably exercise. Purity or a dense matrix alone is insufficient.

Use temporary scripts, scratch tests and manual checks for investigation. Keep results with the task; remove temporary checks before delivery. Useful development proof need not become a permanent test. Validate stable setup with its parser/linter and a smoke check. Follow repository policy for instruction exercises and linter validation; do not test skill prose or linter internals.

## Assert behavior

- Prove caller-visible values, persisted state, permissions or navigation. Status or render alone may miss the result. For denials, assert rejection and absence of forbidden effects.
- Substitute external/native/environment boundaries through existing interfaces with realistic results. Mocked first-party services or stores cannot prove their integration or persistence; report that limit.
- Keep expectations independent. Delete tautologies, subject-derived expected values, mock-supplied behavior, unreachable states, broad snapshots and branch-history assertions. Exact text, timing or geometry needs a real product, accessibility, safety or protocol contract and the value case.
- Investigate consequential denial, privacy, safety, accessibility, expiry, concurrency, offline, migration and external-failure gaps; categories do not mandate tests. Group equivalent cases only when setup and assertions remain clear.

Limit cleanup to affected behavior. Rewrite weak tests only where protection matters. Preserve a failing test's expected result unless authorized behavior changed or evidence disproves it; record why. Do not weaken assertions to match a bug.

A regression test must fail against unfixed code for the intended reason and pass after the fix. If detection is uncertain, temporarily restore the bug or mutate the line, confirm failure, then restore code before final validation. Add no tooling for this.

## Backend

Exercise the entry point the claim needs: a service test cannot prove route authentication, serialization or middleware. Reuse the project's integration harness.

- **Stores:** use isolated, disposable stores that match the production engine; an in-memory substitute cannot prove constraints or transactions. Use Testcontainers where the repository already does. Keep Redis or a broker real when its atomicity, persistence or delivery is the contract. Never use customer or production data. Assert stored state with an independent read after the action, not emitted SQL.
- **Isolation:** use real identities and scoped records through production authorization; response filtering does not prove row or tenant isolation.
- **Transactions:** induce a supported failure at the real boundary and inspect what committed or rolled back; test-setup rollback is not application rollback.
- **Concurrency and retries:** drive real overlapping callers and assert the final state, uniqueness or idempotency, not call counts or sleeps. Do not inject a failure the client absorbs before application code sees it.
- **Time:** find which process owns the clock, use its controllable clock, set timezones explicitly and separate calendar dates from instants. Never assume a date stays in the future.
- **Migrations:** carry representative prior data through the affected production path and check old and new readers and writers; an empty-database migration or schema snapshot cannot prove compatibility.
- **Providers:** a mock proves application handling, not the provider; use an authorized smoke check or report the gap.

## Execute and finish

Run prepared check batches through `Agent` with `subagent_type: "test-executor"`; keep small checks local. If it is unavailable, run suitable checks locally and report the limit. The executor checks its inputs, stops at the first failure, timeout, changed input or ambiguity, and returns the command, status, relevant output and unrun checks. It does not retry, diagnose, repair, install or start external or paid jobs; the coordinator diagnoses. Record the command, revision including dirty changes, environment, outcome and log path; reused evidence keeps its original record.

Report keeper value, last-owner retirement versus inspected replacement, checks and limits. For material cost work, read [Expensive suites](references/expensive-suites.md) before editing and establish a comparable baseline; otherwise state no material execution-cost impact. Speed alone does not justify losing valuable proof.
