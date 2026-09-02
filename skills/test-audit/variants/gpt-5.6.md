---
name: test-audit
description: "Plan and audit test portfolios before creating, changing, or removing tests or test infrastructure; challenge missing, duplicate, brittle, wrongly placed, ownerless, and dangerous coverage."
---

# Test audit

Outcome: leave the smallest test portfolio that owns every verified reachable
regression the product still promises. Run this before creating tests, for
every PR that changes tests or test infrastructure, and for every PR that
changes production behavior. Test infrastructure includes fixtures, test-only
routes, helpers, configuration, and harnesses.

Identify the product risk before deciding whether a test would catch a real
future bug; adding a test is not the default.

There are three gates:

1. **Coverage drift**: code changed, so related tests may need to change even if
   no test file changed.
2. **Test value**: tests changed, so each changed test must prove a real future
   failure worth catching.
3. **Portfolio ownership**: every retained risk has one executable owner at the
   narrowest useful level, without equivalent duplicate coverage.

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
3. Map test ownership with
   [portfolio.md](references/portfolio.md).
   - For each changed, deleted, or proposed test, and each nearby test used as
     a replacement or overlap comparison, determine whether it owns a reachable
     bug and at which boundary. For a retained or proposed owner, also name why
     adjacent coverage misses it and derive the expected result independently.
   - Inspect overlapping tests at other levels and any test infrastructure the
     changed tests own.
4. Classify each test or assertion using
   [classifications.md](references/classifications.md).
5. Apply the usefulness bar and signal lists in
   [usefulness-bar.md](references/usefulness-bar.md).
6. Defend proposed keepers and deletions adversarially.
   - A keeper must catch a distinct bug that adjacent coverage would miss.
   - A deletion of a test that owns a promised regression must name an
     inspected executable replacement owner. Otherwise, name why the test owns
     no current regression and needs no replacement.
7. Recommend focused changes:
   - Remove or rewrite tests that only prove old fields are gone, old callbacks
     are absent, mocks were called in a specific order, tautological expected
     values are recomputed from the same logic as the implementation, or
     impossible data is ignored.
   - Add tests only for verified reachable change-relevant risks.
   - Prefer one test that exercises the user/API contract over several tests
     that assert internals.
8. Edit tests only when implementation is authorized. After edits:
   - Run the focused test file or package test script.
   - Run typecheck/lint when test helpers, fixtures, route contracts, or shared
     types changed.
9. Report using the buckets in [output.md](references/output.md).

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
- Use [recommendations.md](references/recommendations.md) for common add,
  rewrite, and delete guidance.
- Use [output.md](references/output.md) for review output shape and the stale
  API assertion example.
