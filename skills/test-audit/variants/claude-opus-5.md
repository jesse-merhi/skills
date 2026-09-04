---
name: test-audit
description: "Plan and audit test portfolios before creating, changing, or removing tests or test infrastructure; challenge missing, duplicate, brittle, wrongly placed, ownerless, and dangerous coverage."
---

# Test audit

Deliver a complete change-relevant portfolio assessment with one executable
owner per distinct promised regression and an execution-cost conclusion. Discover
all genuine missing, duplicate, brittle, or unsafe-ownership candidates before
filtering recommendations; do not impose a severity or top-N discovery limit.
A concise report does not imply fewer investigated risks or more tests.

Use before test changes and when reviewing production behavior, tests, or test
infrastructure: fixtures, test-only routes, helpers, config, and harnesses.
State the current product contract from the request/diff/API/UI/docs. An intentionally
replaced contract is obsolete unless compatibility remains promised. Inventory
committed `git diff --name-status <base>...HEAD` and in-scope local
`git diff --name-status`, `git diff --cached --name-status`, and
`git ls-files --others --exclude-standard`, deduplicating paths. Include deletions,
infrastructure, and nearby unchanged tests around affected routes/components/hooks/
services/schemas/helpers/packages/flows. Audit every changed assertion and related
unchanged coverage for drift.

## Ownership and acceptance evidence

Apply four gates: coverage drift, test value, distinct ownership, and execution
cost. A real future bug has a current code/contract/data/permission/user-flow path;
it is change-relevant when introduced, exposed, fixed, or directly exercised here.
For keepers/proposals and replacement/overlap comparisons, record bug, boundary,
nearest broader/narrower/peer test and why it misses the bug, plus an independent
expectation. Known literals, worked examples, specs, and fixtures qualify;
recomputed production logic does not.

Keep one owner per distinct regression. Multiple levels may protect a feature
only for different bugs. A broader replacement must drive equivalent inputs through
the same branch, fail on the same bug, assert the same public outcome, and run
at equivalent required cadence. Inspect, land, and verify it before/with deletion.
Incidental traversal, future tests/refactors, manual checks, dev assertions,
types, and schemas are not executable replacements; manual/opt-in coverage alone
cannot replace routine automation. Retired/unreachable behavior needs no owner
unless absence still protects compatibility/privacy/migration/security/safety.

Preserve distinct security/privacy/permission/accessibility/safety, time/expiry,
race/concurrency, offline, migration, transaction, isolation, and external-failure
branches. Drive and assert them; happy paths do not cover them incidentally.
Authorization denial also asserts no possible forbidden effects.

Match proof to the narrowest useful boundary: unit for pure policy/state/parser/
calculation/matrices; integration for real binding/persistence/authorization/
transaction/isolation; E2E for visible workflows/native interaction/cross-role
handoff; focused tests for executable test helpers; parser/linter plus actual
execution for declarative test/build config. Do not render/start an app for pure
policy or claim binding proof from policy-only units. Keep one complete valuable
golden journey plus focused owners of distinct risks it cannot isolate.

Consolidate repeated setup/assertion shape with named object tables while keeping
one row per distinct failure or required side effect. Remove equivalent role/
status/input/filter/wording cases that drive the same branch/outcome.

## Decide each candidate without extra test generation

A keeper must show the future change it catches, real product/API/data/security/
workflow consequence, lowest practical proof level, stable behavioral assertion,
and independent expected value. Challenge it against adjacent tests. Challenge
deletions against inspected replacement equivalence, then recheck affected high-
risk boundaries. These checks are part of the portfolio decision, not a separate
optional verifier workflow.

Remove/rewrite branch-history and obsolete-absence tests without current promises,
validated-away impossible states, incidental words/waits/mock counts/order/wiring,
broad snapshots, tautologies, source/config mirrors, and orphaned test-only routes,
fixtures, env switches, helpers, harnesses, or duration metadata. Status-only,
render-only, and key-presence-only success can miss incorrect values/state/persistence.
Passing tests and historical regressions alone do not establish value.

Frontend tests prove navigation, submitted/loaded/persisted data, permissions,
validation, controls, or stable accessibility. Text selectors may locate controls;
arbitrary headings/buttons/placeholders/marketing copy are not the outcome.
Keep exact text/timing/geometry/lifecycle/appearance/layout when explicitly promised
by stable product/design/legal/accessibility/safety/domain/protocol contracts.
Some new features, cleanup, and removals require no additional tests. A removed
`systemAlerts` field usually calls for the new alert-contract assertion, not
`.not.toHaveProperty("systemAlerts")` unless absence itself remains promised.

## Execution-cost decision

For every audit trace changes to selection/count, setup, retries, caching,
fixtures, testability, duration, sharding, runner capacity, and scheduling.
Known slow/costly/sharded suites lower the investigation threshold but do not
replace a concrete mechanism. Explicit runtime/cost/makespan optimization or
material effect on total work, runner cost, or parallel makespan triggers
[expensive-suites.md](references/expensive-suites.md) and comparable baseline
capture. Otherwise record `no material execution-cost impact`.

Repeat the gate before proposing test/infrastructure changes, including read-only
recommendations. Report mechanism, expected direction, evidence, or measurement
limits. Capture baseline before authorized edits and compare final raw values
for each material signal, or disclose unavailable measurement. Do not invent
runtime estimates.

## Result and authorized action

Classify as `keeper` (distinct promised owner), `consolidate` (retain distinct
cases with shared setup), `move` (same outcome, better boundary), `rewrite`
(right risk, brittle/stale/tautological proof), `delete` (no current risk, equivalent
replacement, or orphan), `changed-but-useless` (no verified future bug), `missing`
(verified change-relevant risk unowned), `no-test-needed` (inspected low-value
addition), `no-change-needed` (existing coverage fits), or `dangerous-removal`
(last promised owner lost without an inspected equivalent at required cadence).

Edit only with implementation authority. After authorized edits, run focused file/package tests and
helper/fixture/route/shared-type typecheck/lint, then the final cost assessment.
Report populated decision buckets plus Ownership and Validation. Include small
path-specific reasons, replacement owners or why none is needed, adjacent-coverage
gaps for keepers/consolidated cases, and the cost conclusion. Portfolio reductions
need before/after file counts, expanded test counts, and reliable measured runtime
or explicit limits. Keep the report focused without hiding any real decision.
