---
name: test-audit
description: "Plan and audit test portfolios before creating, changing, or removing tests or test infrastructure; challenge missing, duplicate, brittle, wrongly placed, ownerless, and dangerous coverage."
---

# Test audit

Audit tests as a product-risk portfolio. Run this before creating tests, for
every PR that changes tests or test infrastructure, and for every PR that
changes production behavior. Test infrastructure includes fixtures, test-only
routes, helpers, configuration, and harnesses.

The goal is tests that catch verified reachable future bugs and document
behavior the product still promises. The default answer is not "add a test"; the
default answer is "identify the product risk, then decide whether a test would
catch a real future bug."

There are four gates:

1. **Coverage drift**: code changed, so related tests may need to change even if
   no test file changed.
2. **Test value**: tests changed, so each changed test must prove a real future
   failure worth catching.
3. **Portfolio ownership**: every retained risk has one executable owner at the
   narrowest useful level, without equivalent duplicate coverage.
4. **Execution cost**: code or tests changed, so discovered work, per-test
   duration, runner cost, or parallel makespan may move even when nobody asked
   for performance work.

## Workflow

1. Establish the behavior change.
   - Read the PR summary, issue, diff, route/schema/API contract, UI flow, or
     nearby docs.
   - Write one sentence for the new product contract.
   - If an API or UI contract is intentionally replaced, treat the old shape as
     obsolete unless the code still promises compatibility.
2. Inventory changed test files and related unmodified tests.
   - Use `git diff --name-status <base>...HEAD` for the committed range. When
     local changes belong to the target, also inspect `git diff --name-status`,
     `git diff --cached --name-status`, and
     `git ls-files --others --exclude-standard`; deduplicate the resulting
     paths before inspecting test hunks.
   - Search around each changed route, component, hook, service, schema, helper,
     package, or user flow.
   - Include deleted tests and changed test infrastructure even when no test
     file changed.
3. Check execution-cost impact for every audit.
   - When the audit explicitly aims to reduce test runtime, runner cost, or
     full-workflow makespan, read
     [expensive-suites.md](references/expensive-suites.md) and establish the
     applicable baseline even before a candidate change exists.
   - Otherwise inspect whether the change can alter test selection or count,
     setup, retries, caching, fixtures, testability, test duration, sharding,
     runner capacity, or scheduling.
   - Trace a concrete mechanism from the current change to one of those
     factors and judge whether the impact could be material. A suite already
     known to be slow, costly, or sharded lowers the investigation threshold;
     it is not sufficient by itself.
   - When the traced mechanism could materially change total work, runner
     cost, or full-workflow makespan, read
     [expensive-suites.md](references/expensive-suites.md) and establish the
     applicable comparable baseline. Otherwise record `no material
     execution-cost impact` and continue the portfolio audit.
4. Map test ownership with
   [portfolio.md](references/portfolio.md).
   - For each changed, deleted, or proposed test, and each nearby test used as
     a replacement or overlap comparison, determine whether it owns a reachable
     bug and at which boundary. For a retained or proposed owner, also name why
     adjacent coverage misses it and derive the expected result independently.
   - Inspect overlapping tests at other levels and any test infrastructure the
     changed tests own.
5. Classify each test or assertion using
   [classifications.md](references/classifications.md).
6. Apply the usefulness bar and signal lists in
   [usefulness-bar.md](references/usefulness-bar.md).
7. Defend proposed keepers and deletions adversarially.
   - A keeper must catch a distinct bug that adjacent coverage would miss.
   - A deletion of a test that owns a promised regression must name an
     inspected executable replacement owner. Otherwise, name why the test owns
     no current regression and needs no replacement.
8. Recommend focused changes:
   - Remove or rewrite tests that only prove old fields are gone, old callbacks
     are absent, mocks were called in a specific order, tautological expected
     values are recomputed from the same logic as the implementation, or
     impossible data is ignored.
   - Add tests only for verified reachable change-relevant risks.
   - Prefer one test that exercises the user/API contract over several tests
     that assert internals.
   - Before recommending a test or test-infrastructure change, repeat the
     execution-cost gate for the proposal. For a material proposal, read
     [expensive-suites.md](references/expensive-suites.md) and report the cost
     mechanism, expected effect, and available evidence or measurement
     limitation even when implementation is not authorized. When editing is
     authorized, capture the applicable baseline before editing.
9. Edit tests only when implementation is authorized. After edits:
   - Run the focused test file or package test script.
   - Run typecheck/lint when test helpers, fixtures, route contracts, or shared
     types changed.
   - Repeat the execution-cost gate against the final diff. For every material
     signal, compare the final candidate with its baseline and report the raw
     values or measurement limitation.
10. Report using the buckets in [output.md](references/output.md). Include each
    execution-cost decision: `no material execution-cost impact`, or the
    material mechanism with observed or modelled values and limitations. For
    an unimplemented proposal, report its expected cost direction and the
    evidence or limitation supporting it.

## Required judgment

- A real future bug means a failure path you can show from current code,
  contracts, data, permissions, or user flows.
- A risk is change-relevant when the current work introduces, exposes, fixes,
  or directly exercises it.
- Some feature work, cleanup, and intentional removals should leave no new tests
  behind.
- Do not assume a changed test is useful just because it passes.
- If related tests exist but did not change, decide whether the PR should
  update, add, delete, or leave them alone.
- If tests changed, audit every changed assertion.
- A tautological assertion gives no confidence: expected values must come from
  an independent source of truth, not from re-running the implementation logic.

## Context pointers

- Use [classifications.md](references/classifications.md) for labels such as
  `keeper`, `missing`, `no-test-needed`, and `dangerous-removal`.
- Use [usefulness-bar.md](references/usefulness-bar.md) for the five-question
  bar, good signals, and waste signals.
- Use [portfolio.md](references/portfolio.md) for ownership, consolidation,
  proof-level placement, replacement owners, and portfolio-audit measurement.
- Use [expensive-suites.md](references/expensive-suites.md) when the default
  execution-cost gate finds a material total-work, runner-cost, or makespan
  signal, or when the audit explicitly aims to reduce one of those costs. It
  defines comparable baselines, duration-aware planning, dual cost reporting,
  and fixed-point completion.
- Use [recommendations.md](references/recommendations.md) for common add,
  rewrite, and delete guidance.
- Use [output.md](references/output.md) for review output shape and the stale
  API assertion example.
