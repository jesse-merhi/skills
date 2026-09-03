---
name: test-audit
description: "Plan and audit test portfolios before creating, changing, or removing tests or test infrastructure; challenge missing, duplicate, brittle, wrongly placed, ownerless, and dangerous coverage."
---

# Test audit

Audit the complete change-relevant test portfolio. Batch independent production,
test, and ownership reads. During a long audit, report only a change in evidence
or direction. Verify current framework behavior from source. Recommend only
tests that own a reachable future bug; edit tests only when implementation is
authorized.

Audit tests as a product-risk portfolio. Run this before creating tests, for
every PR that changes tests or test infrastructure, and for every PR that
changes production behavior. Test infrastructure includes fixtures, test-only
routes, helpers, configuration, and harnesses.

The goal is tests that catch verified reachable future bugs and document
behavior the product still promises. The default answer is not "add a test"; the
default answer is "identify the product risk, then decide whether a test would
catch a real future bug."

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
3. Map test ownership with [Test portfolio](#test-portfolio).
   - For each changed, deleted, or proposed test, and each nearby test used as
     a replacement or overlap comparison, determine whether it owns a reachable
     bug and at which boundary. For a retained or proposed owner, also name why
     adjacent coverage misses it and derive the expected result independently.
   - Inspect overlapping tests at other levels and any test infrastructure the
     changed tests own.
4. Classify each test or assertion using [Classifications](#classifications).
5. Apply the usefulness bar and signal lists in
   [Usefulness bar](#usefulness-bar).
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
   - Do not keep a test just because it guards against "the old design coming
     back" when the old design is no longer reachable through current product
     contracts.
   - Add tests only for verified reachable change-relevant risks.
   - Do not add tests for intentionally removed features, fields, callbacks,
     routes, screens, or modes unless the current product contract promises
     that absence for compatibility, privacy, migration, or security reasons.
   - Do not add tests for a new feature or addition when the test would only
     prove wiring, rendering, status codes, or mock calls without catching a
     verified reachable product, API, data, security, or workflow regression.
   - Do not add frontend tests that only assert arbitrary UI copy, button text,
     headings, placeholder text, or marketing text. Use text selectors when
     they are the best stable way to find an element, but assert the behavior
     or state that matters after finding it.
   - Prefer one test that exercises the user/API contract over several tests
     that assert internals.
   - Prefer known-good literals, worked examples, specs, or fixtures for
     expected values. Do not compute the expected value the same way production
     code does.
8. Edit tests only when implementation is authorized. After edits:
   - Run the focused test file or package test script.
   - Run typecheck/lint when test helpers, fixtures, route contracts, or shared
     types changed.
9. Report using the buckets in [Output](#output).

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

## Test portfolio

Treat the suite as a portfolio of distinct reachable regressions, not a record
of every implementation change. Keep the smallest set of executable tests that
protects every behavior the product still promises.

### Defend each owner

Assign one executable owner to each distinct regression. For every retained
test, record:

- the realistic future bug it catches;
- the public, integration, or domain boundary it proves;
- the nearest broader, narrower, or peer test and why that test would miss the
  bug; and
- an expected result derived independently from the implementation under test.

Tests may cover the same feature at different levels only when they fail for
different bugs. A broader test replaces a smaller test only when both drive the
same branch with equivalent inputs, fail for the same regression, and assert
the same public outcome at an equivalent required cadence. Incidental traversal
is not coverage.

### Require a replacement owner

Before deleting a test that owns a still-promised regression, name and inspect
the executable test that will fail for the same bug. Land and verify a required
replacement before or in the same change, and confirm it runs at an equivalent
required cadence. Manually
triggered or opt-in coverage does not replace routine automated coverage by
itself. A planned refactor, future test, manual check, development-only
assertion, type, or schema is not an executable owner.

A test for unreachable or retired behavior needs no replacement when the
current product promises no compatibility, privacy, migration, security, or
safety property that depends on its absence.

Preserve distinct owners for high-risk boundaries such as security, privacy,
permissions, accessibility, safety, time and expiry, races and concurrency,
offline behavior, migrations, transactions, data isolation, and external-call
failures. Do not infer that a happy path owns one of these branches without
driving the branch and asserting its outcome.

### Choose the proof level

Place each owner at the narrowest level that proves the real contract:

| Risk | Owning proof |
| --- | --- |
| Pure policy, state transition, parser, calculation, or boundary matrix | Unit test |
| Real binding, persistence, authorization outcome, transaction, or data isolation | Integration test |
| Visible workflow, native interaction, or cross-role handoff | End-to-end test |
| Test parser, validator, selector, fixture helper, or serializer | Focused test of that executable helper |
| Declarative test or build configuration | Parser or linter plus real execution |

Do not start an application or render a component merely to test pure policy,
state, or calculation. Do not use a unit test of policy to claim that a route,
UI, serializer, or native adapter binds it correctly. Keep one complete golden
journey for a valuable workflow, then retain focused owners only for distinct
risks that journey cannot isolate.

### Consolidate or remove

Consolidate distinct regression owners that repeat workflow setup or assertion
shape. Use a named object-shaped table while keeping one row for each distinct
failure mode or required side effect. Remove cases that differ only by
equivalent roles, statuses, invalid inputs, filters, or wording and drive the
same branch and public outcome.

Remove tests or assertions that own no current regression, including:

- branch history and retired or unreachable behavior;
- incidental or unpromised presentation, styling, geometry, token, or broad
  snapshot assertions;
- incidental wording, waits, callbacks, mock counts, mock order, or helper
  wiring;
- source or configuration mirrors that re-assert declarative files line by
  line;
- success tests that assert only status, rendering, or response-key presence
  while missing the returned values, state change, or persisted outcome;
- duplicate coverage that meets the replacement-equivalence test; and
- orphaned test-only routes, fixtures, environment switches, helpers, harnesses,
  or duration metadata with no executable caller.

Keep appearance or layout coverage when it is an explicit stable product or
design contract. Keep exact wording, timing, geometry, lifecycle calls, or
presentation when it is itself a promised legal, accessibility, safety, domain,
or protocol contract. For authorization rejection, assert the denial and
absence of any forbidden side effect when one is possible.

### Audit adversarially

Apply the five-question [usefulness bar](#usefulness-bar) to each proposed
keeper. For each deletion, challenge whether the named replacement really
drives the same branch and outcome. Recheck every affected high-risk boundary
after the challenge.

For a portfolio-reduction audit, report before-and-after test file counts,
expanded test counts, and measured runtime when the environment can measure it
reliably. State limitations rather than estimating.

## Classifications

Use these labels when auditing tests or assertions:

- `keeper`: is the executable owner of a distinct reachable regression in
  promised behavior.
- `consolidate`: owns a distinct reachable regression but repeats the setup or
  assertion shape of other distinct owners; retain the cases while sharing one
  table or setup.
- `move`: owns a real risk, but the same intended outcome should be proved at a
  different boundary; relocate the test without changing that outcome.
- `rewrite`: points at the right risk and boundary but uses a stale API shape,
  brittle text, timing, fixture internals, implementation detail, or a
  tautological expected value.
- `delete`: covers removed behavior, impossible state, branch-local history,
  equivalent duplicate coverage with another retained owner and no distinct
  regression, orphaned test infrastructure, or "absence of old thing" with no
  compatibility promise.
- `changed-but-useless`: a changed or added test passes but would not catch a
  verified reachable future bug.
- `missing`: a verified reachable change-relevant regression risk has no test.
- `no-test-needed`: changed behavior was inspected, and adding coverage would
  only test branch-local history, removed behavior, duplicate coverage, or a
  low-risk addition with no verified reachable future failure to catch.
- `no-change-needed`: related tests exist, but they already cover the changed
  contract and do not need edits.
- `dangerous-removal`: deletes the last executable owner of a promised
  regression without an equivalent, inspected replacement at the required
  cadence.

## Usefulness bar

A test earns its keep only when you can answer all five:

1. What future code change could make this fail?
2. Would that failure be a real product, API, data, security, or workflow bug?
3. Is this the lowest practical level that proves the behavior?
4. Does it assert stable behavior instead of private implementation details?
5. Does the expected value come from an independent source of truth rather than
   the same logic the implementation uses?

Treat "regression risk" as something demonstrated, not imagined. Good evidence
includes an existing caller, route, screen, permission path, data migration,
parser input, security boundary, or a real bug class already seen in the code.
Security vulnerabilities, auth bypasses, data loss, and migration corruption are
strong reasons to add regression tests when the failing path is real.

For frontend tests, prove behavior or state: navigation, submitted data,
enabled/disabled controls, permissions, validation, persisted state, loaded
records, or stable accessibility contracts. Do not add tests that only lock
incidental UI copy unless that exact copy is the current product contract, such
as a legal notice, required error message, or accessibility label.

### Good test signals

- It would fail if a future refactor broke the new contract.
- It checks a real caller, route, screen, permission, state transition, data
  conversion, validation rule, migration, or boundary.
- For frontend tests, it proves a user-visible behavior or stable app state,
  such as a saved value appearing, an action becoming available, validation
  blocking submission, navigation changing, or protected UI staying unavailable.
- It covers both sides of a meaningful branch when both are product behavior.
- It uses public API/UI output or a stable domain boundary.
- It asserts a known-good literal, worked example, fixture, or spec-derived
  expected value.
- It prevents a regression that has happened before or is demonstrably reachable
  from the changed code.

### Waste signals

- It asserts a removed field is absent after the API was intentionally replaced.
- It tests branch-local history, such as "old behavior no longer happens."
- It proves an impossible internal state is handled after upstream validation
  already rules it out.
- It checks mock call counts, exact call order, intermediate state, or private
  helper output when the public result would catch the bug.
- It recomputes the expected value the same way the implementation does, so the
  test passes by construction.
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
  from returning, with no current contract that the old feature must stay
  absent.
- It adds coverage for a new feature where the only possible failure is a
  harmless implementation detail, duplicated nearby coverage, or branch-local
  history.
- It says "this could regress" without showing a reachable path through current
  code, contracts, data, permissions, or user flows.

## Output

For a review, report:

- `Keep`: tests that protect real behavior.
- `Consolidate`: distinct regression owners that should retain separate cases
  while sharing one table or setup.
- `Move`: real risks proved at the wrong level.
- `Rewrite`: tests that target a real risk but assert it poorly.
- `Delete`: tests/assertions that do not earn their keep.
- `Changed but useless`: changed tests that pass but should not exist.
- `Missing`: specific verified reachable behavior risks that need coverage.
- `No test needed`: changed behavior inspected where new coverage would not
  catch a verified reachable future bug.
- `No change needed`: related tests inspected and why they still fit.
- `Dangerous removals`: removed tests or assertions that were the last
  executable owner of promised behavior and have no equivalent, inspected
  replacement at the required cadence.
- `Ownership`: the named executable replacement for each removed test or
  assertion that owned a still-promised regression, or why the removed coverage
  owned no current regression and needs no replacement; also state why adjacent
  coverage misses each keeper's or consolidated case's distinct regression.
- `Validation`: commands run and result. For a portfolio-reduction audit, add
  before-and-after file counts, expanded test counts, and measured runtime when
  reliable.

For each `Consolidate`, `Move`, `Rewrite`, `Delete`, `Missing`, or `Dangerous
removal`, include the smallest useful reason:

```md
`path/to/test.ts`: delete the `systemAlerts` absence assertion. The API no
longer exposes that field, and no compatibility/privacy contract requires
testing its absence. Assert the new alert list shape instead.
```

### Stale API assertion example

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
