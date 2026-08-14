---
name: test-audit
description: "Audit test coverage, gaps, useless tests, stale assertions, brittle mocks, impossible states, and removals."
---

# Test Audit

Audit tests as product-risk coverage. Run this for any PR that touches code with
nearby or related tests, and for every PR that changes tests. Also use this
before writing tests.

The goal is tests that catch verified reachable future bugs and document
behavior the product still promises. The default answer is not "add a test"; the
default answer is "identify the product risk, then decide whether a test would
catch a real future bug."

There are two gates:

1. **Coverage drift**: code changed, so related tests may need to change even if
   no test file changed.
2. **Test value**: tests changed, so each changed test must prove a real future
   failure worth catching.

## Workflow

1. Establish the behavior change.
   - Read the PR summary, issue, diff, route/schema/API contract, UI flow, or
     nearby docs.
   - Write one sentence for the new product contract.
   - If an API or UI contract is intentionally replaced, treat the old shape as
     obsolete unless the code still promises compatibility.
2. Inventory changed test files and related unmodified tests.
   - Use `git diff --name-status <base>...HEAD` and inspect test hunks.
   - Search around each changed route, component, hook, service, schema, helper,
     package, or user flow.
   - Include deleted tests.
3. Classify each test or assertion using
   [classifications.md](references/classifications.md).
4. Apply the usefulness bar and signal lists in
   [usefulness-bar.md](references/usefulness-bar.md).
5. Recommend focused changes:
   - Remove or rewrite tests that only prove old fields are gone, old callbacks
     are absent, mocks were called in a specific order, tautological expected
     values are recomputed from the same logic as the implementation, or
     impossible data is ignored.
   - Add tests only for verified reachable risks introduced by the PR.
   - Prefer one test that exercises the user/API contract over several tests
     that assert internals.
6. Edit tests only when implementation is authorized. After edits:
   - Run the focused test file or package test script.
   - Run typecheck/lint when test helpers, fixtures, route contracts, or shared
     types changed.
7. Report using the buckets in [output.md](references/output.md).

## Required Judgment

- A real future bug means a failure path you can show from current code,
  contracts, data, permissions, or user flows.
- Some feature work, cleanup, and intentional removals should leave no new tests
  behind.
- Do not assume a changed test is useful just because it passes.
- If related tests exist but did not change, decide whether the PR should
  update, add, delete, or leave them alone.
- If tests changed, audit every changed assertion.
- A tautological assertion gives no confidence: expected values must come from
  an independent source of truth, not from re-running the implementation logic.

## Context Pointers

- Use [classifications.md](references/classifications.md) for labels such as
  `keeper`, `missing`, `no-test-needed`, and `dangerous-removal`.
- Use [usefulness-bar.md](references/usefulness-bar.md) for the four-question
  bar, good signals, and waste signals.
- Use [recommendations.md](references/recommendations.md) for common add,
  rewrite, and delete guidance.
- Use [output.md](references/output.md) for review output shape and the stale
  API assertion example.
