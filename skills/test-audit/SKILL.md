---
name: test-audit
description: "Audit or design tests: related coverage, changed tests, missing tests, no-test-needed decisions, useless tests, stale API assertions, brittle mocks, impossible states, and tests to remove."
---

# Test Audit

Audit tests as product-risk coverage. Run this for any PR that touches code with
nearby or related tests, and for every PR that changes tests. The goal is tests
that catch verified reachable future bugs and document behavior the product
still promises.

Also use this before writing tests. The default answer is not "add a test"; the
default answer is "identify the product risk, then decide whether a test would
catch a real future bug." A real future bug means a failure path you can show
from current code, contracts, data, permissions, or user flows. Some feature
work, cleanup, and intentional removals should leave no new tests behind.

There are two separate gates:

1. Coverage drift: code changed, so related tests may need to change even if no
   test file changed.
2. Test value: tests changed, so each changed test must prove a real future
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
   - Search for tests around each changed route, component, hook, service,
     schema, helper, package, or user flow.
   - If related tests exist but did not change, decide whether the PR should
     update, add, delete, or leave them alone.
   - If tests changed, audit every changed assertion. Do not assume a changed
     test is useful just because it passes.
   - Include deleted tests. A deleted test may be good cleanup or a dangerous
     removal.

3. Classify each test or assertion.
   Use these labels:
   - `keeper`: catches a verified reachable regression in promised behavior.
   - `rewrite`: points at the right risk but asserts the wrong level, stale API
     shape, brittle text, timing, fixture internals, or implementation detail.
   - `delete`: covers removed behavior, impossible state, branch-local history,
     or "absence of old thing" with no compatibility promise.
   - `changed-but-useless`: a changed or added test passes but would not catch a
     verified reachable future bug.
   - `missing`: a verified reachable regression risk introduced by the change
     has no test.
   - `no-test-needed`: changed behavior was inspected, and adding coverage would
     only test branch-local history, removed behavior, duplicate coverage, or a
     low-risk addition with no verified reachable future failure to catch.
   - `no-change-needed`: related tests exist, but they already cover the changed
     contract and do not need edits.
   - `dangerous-removal`: deleted coverage for behavior that still exists.

4. Apply the usefulness bar.
   A test earns its keep only when you can answer all four:
   - What future code change could make this fail?
   - Would that failure be a real product, API, data, security, or workflow bug?
   - Is this the lowest practical level that proves the behavior?
   - Does it assert stable behavior instead of private implementation details?

   Treat "regression risk" as something demonstrated, not imagined. Good
   evidence includes an existing caller, route, screen, permission path, data
   migration, parser input, security boundary, or a real bug class already seen
   in the code. Security vulnerabilities, auth bypasses, data loss, and
   migration corruption are strong reasons to add regression tests when the
   failing path is real.
   For frontend tests, prove behavior or state: navigation, submitted data,
   enabled/disabled controls, permissions, validation, persisted state, loaded
   records, or stable accessibility contracts. Do not add tests that only lock
   incidental UI copy unless that exact copy is the current product contract,
   such as a legal notice, required error message, or accessibility label.

5. Recommend focused changes.
   - Remove or rewrite tests that only prove old fields are gone, old callbacks
     are absent, mocks were called in a specific order, or impossible data is
     ignored.
   - Do not keep a test just because it guards against "the old design coming
     back" when the old design is no longer reachable through current product
     contracts.
   - Add tests only for verified reachable risks introduced by the PR.
   - Do not add tests for intentionally removed features, fields, callbacks,
     routes, screens, or modes unless the current product contract promises that
     absence for compatibility, privacy, migration, or security reasons.
   - Do not add tests for a new feature or addition when the test would only
     prove wiring, rendering, status codes, or mock calls without catching a
     verified reachable product, API, data, security, or workflow regression.
   - Do not add frontend tests that only assert arbitrary UI copy, button text,
     headings, placeholder text, or marketing text. Use text selectors when
     they are the best stable way to find an element, but assert the behavior or
     state that matters after finding it.
   - Prefer one test that exercises the user/API contract over several tests
     that assert internals.

6. Verify after edits.
   - Run the focused test file or package test script.
   - Run typecheck/lint when test helpers, fixtures, route contracts, or shared
     types changed.

## Good Test Signals

- It would fail if a future refactor broke the new contract.
- It checks a real caller, route, screen, permission, state transition, data
  conversion, validation rule, migration, or boundary.
- For frontend tests, it proves a user-visible behavior or stable app state,
  such as a saved value appearing, an action becoming available, validation
  blocking submission, navigation changing, or protected UI staying unavailable.
- It covers both sides of a meaningful branch when both are product behavior.
- It uses public API/UI output or a stable domain boundary.
- It prevents a regression that has happened before or is demonstrably reachable
  from the changed code.

## Waste Signals

- It asserts a removed field is absent after the API was intentionally replaced.
- It tests branch-local history, such as "old behavior no longer happens."
- It proves an impossible internal state is handled after upstream validation
  already rules it out.
- It checks mock call counts, exact call order, intermediate state, or private
  helper output when the public result would catch the bug.
- It snapshots large payloads where only one field matters.
- It duplicates nearby coverage without protecting a different risk.
- It adds status-code-only or render-only tests that would pass while the real
  contract is broken.
- It asserts random UI copy, headings, button text, placeholders, or marketing
  text without proving the user flow, state change, permission, data rendering,
  or accessibility contract that copy belongs to.
- It leaves nearby tests untouched even though their asserted contract changed.
- It changes a test only to prove that removed behavior is gone, without a
  compatibility, privacy, migration, or security reason.
- It adds coverage for an intentional removal just to prevent the old feature
  from returning, with no current contract that the old feature must stay absent.
- It adds coverage for a new feature where the only possible failure is a
  harmless implementation detail, duplicated nearby coverage, or branch-local
  history.
- It says "this could regress" without showing a reachable path through current
  code, contracts, data, permissions, or user flows.

## Example

If a PR replaces:

```ts
expect(json.data.alerts.systemAlerts.length).toBe(2);
```

with:

```ts
expect(json.data.alerts).not.toHaveProperty("systemAlerts");
```

flag the new assertion for deletion unless the API explicitly promises that
`systemAlerts` must never appear for compatibility or privacy reasons. A better
test would assert the new alert contract that callers now consume.

## Output

For a review, report:

- `Keep`: tests that protect real behavior.
- `Rewrite`: tests that target a real risk but assert it poorly.
- `Delete`: tests/assertions that do not earn their keep.
- `Changed but useless`: changed tests that pass but should not exist.
- `Missing`: specific verified reachable behavior risks that need coverage.
- `No test needed`: changed behavior inspected where new coverage would not
  catch a verified reachable future bug.
- `No change needed`: related tests inspected and why they still fit.
- `Dangerous removals`: deleted tests that still protect promised behavior.
- `Validation`: commands run and result.

For each `Rewrite`, `Delete`, `Missing`, or `Dangerous removal`, include the
smallest useful reason:

```md
`path/to/test.ts`: delete the `systemAlerts` absence assertion. The API no
longer exposes that field, and no compatibility/privacy contract requires
testing its absence. Assert the new alert list shape instead.
```
