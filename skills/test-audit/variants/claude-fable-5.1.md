---
name: test-audit
description: "Plan and audit test portfolios before creating, changing, or removing tests or test infrastructure; challenge missing, duplicate, brittle, wrongly placed, ownerless, and dangerous coverage."
---

# Test audit

Audit tests as owners of real product risks. Run this before creating, changing,
or removing tests and in every review of production behavior or test infrastructure,
including fixtures, test-only routes, helpers, config, and harnesses. Do not assume
that every change needs a new test.

1. State the new product contract from the request, diff, route/schema/API, UI,
   or docs. If an old contract was intentionally replaced, treat it as obsolete
   unless compatibility is still promised.
2. Inventory the committed range with `git diff --name-status <base>...HEAD`.
   If target-local work is included, also inspect `git diff --name-status`,
   `git diff --cached --name-status`, and `git ls-files --others --exclude-standard`.
   Deduplicate paths. Search nearby unchanged tests around changed routes,
   components, hooks, services, schemas, helpers, packages, and flows. Include
   deleted tests and infrastructure. Audit every changed assertion and decide
   whether unchanged related tests need updates.
3. Apply the execution-cost gate below. For explicit performance/cost/makespan
   audits, establish the baseline before considering changes. Batch independent
   production/test/ownership reads and verify unfamiliar framework behavior from source.
4. Map the owner of every changed, deleted, proposed, and nearby comparison test.
   Record the distinct reachable future bug, boundary, nearest adjacent test and
   why it misses that bug, and an independently derived expected result. Prefer
   known-good literals, worked examples, specs, or fixtures over production-shaped calculations.
5. Choose the narrowest useful proof and classify each assertion with the decision
   labels below. Challenge each keeper and deletion using the usefulness and
   replacement rules. Recheck affected high-risk boundaries afterward.
6. Recommend only verified change-relevant coverage. Repeat the cost gate for
   every test/infrastructure proposal, including read-only proposals. Before
   authorized edits, capture any required comparable baseline.
7. Edit only with implementation authority. After those edits, run focused file/package tests and
   typecheck/lint when helpers, fixtures, route contracts, or shared types change.
   Repeat the cost gate against the final diff and report material raw comparisons
   or measurement limits. Return the decision buckets and ownership evidence.

## Ownership and proof rules

A real future bug is reachable through current code, contracts, data, permissions,
or flows. Change-relevant means introduced, exposed, fixed, or directly exercised
by this work. Passing tests or a historical bug alone do not establish value.
Keep one executable owner per distinct regression. Different levels may coexist
only when they catch different bugs.

A broader replacement must drive the same branch with equivalent inputs, fail
for the same bug, assert the same public outcome, and run at an equivalent required
cadence. Inspect, land, and verify it before or with deletion. Incidental traversal,
planned refactors, future tests, manual checks, dev assertions, types, and schemas
are not replacement ownership. Opt-in/manual tests alone do not replace routine
coverage. Retired/unreachable behavior needs no replacement unless its absence
remains promised for compatibility, privacy, migration, security, or safety.

Preserve distinct owners for security/privacy/permissions/accessibility/safety,
time/expiry, races/concurrency, offline, migrations, transactions, isolation, and
external-call failure. A happy journey owns none of these without driving the
branch and asserting its outcome. Denial tests must prove both rejection and no
possible forbidden side effect.

Use unit tests for pure policy/state/parser/calculation/boundary matrices;
integration for real binding/persistence/authorization/transaction/isolation;
E2E for visible workflow/native interaction/cross-role handoff; focused tests
for executable test helpers; and parser/linter plus real execution for declarative
test/build config. Do not boot an app for pure policy or claim route/UI/adapter
binding from a policy unit test. Keep a complete valuable golden journey, with
focused tests only for distinct risks it cannot isolate.

Consolidate repeated setup or assertions with named object-shaped tables. Retain
one row per distinct failure mode or required side effect. Remove equivalent
role/status/input/filter/wording cases driving the same branch and outcome.

## Usefulness and waste

For each keeper answer all five: what future code change fails it; why that is a
real product/API/data/security/workflow bug; why this is the lowest practical
level; whether behavior is stable rather than private mechanics; and where the
independent expectation comes from. Challenge whether adjacent coverage really
misses it. For deletion challenge whether the replacement actually drives the
same branch/outcome at the required cadence.

Remove/rewrite tests of branch history, obsolete fields/callbacks being absent
without a current promise, impossible upstream-rejected states, incidental mock
counts/order/wiring/waits/wording, broad snapshots, tautologies, declarative source
mirrors, and orphaned routes/fixtures/env switches/helpers/harnesses/duration
metadata. Status-only, rendering-only, or response-key-only assertions can pass
while values/state/persistence are wrong. Do not add them just because a feature is new.

Frontend tests should prove navigation, submitted/loaded/persisted data, permission,
validation, enabled state, or stable accessibility. Text may be a stable selector;
arbitrary copy/headings/buttons/placeholders/marketing text is not the outcome.
Keep exact wording/timing/geometry/lifecycle/appearance/layout only for an explicit
stable product/design/legal/accessibility/safety/domain/protocol contract. Some
features, cleanup, and intentional removals properly add no tests.

Example: if `systemAlerts` is replaced, changing
`expect(json.data.alerts.systemAlerts.length).toBe(2)` to
`expect(json.data.alerts).not.toHaveProperty("systemAlerts")` usually tests retired
design history. Delete the absence assertion unless compatibility/privacy promises
it, and assert the new alert data that callers consume.

## Execution-cost gate

Trace selection/count, setup, retry, cache, fixture, testability, duration,
sharding, runner-capacity, and scheduling changes. Known slow/costly/sharded suites
lower the investigation threshold but are not enough without a mechanism. For
explicit runtime/cost/makespan work or a material effect on total work, runner
cost, or parallel makespan, read [expensive-suites.md](references/expensive-suites.md)
and establish comparable baselines. Otherwise record `no material execution-cost impact`.
For proposals report mechanism, expected effect, evidence, and limits even if
not implementing. For edits capture baseline first and compare final raw values
or disclose why measurement is unavailable.

## Decisions and output

Use `keeper` for distinct promised ownership; `consolidate` for retained distinct
cases sharing setup; `move` for a better boundary with the same outcome; `rewrite`
for right risk but stale/brittle/tautological proof; `delete` for no current risk,
equivalent replaced duplicates, or orphaned infrastructure; `changed-but-useless`
for passing tests with no verified future bug; `missing` for uncovered verified
change-relevant risk; `no-test-needed` for inspected obsolete/duplicate/low-value
new coverage; `no-change-needed` for already-fitting tests; and `dangerous-removal`
for loss of the last promised owner without an inspected equivalent at required cadence.

Report populated Keep, Consolidate, Move, Rewrite, Delete, Changed but useless,
Missing, No test needed, No change needed, Dangerous removals, Ownership, and
Validation buckets. Include cost conclusions, path-specific reasons, replacements
or why none is needed, and why adjacent coverage misses keeper/consolidated cases.
For portfolio reduction include before/after file counts, expanded counts, and
reliable measured runtime; do not guess unavailable values. During long audits,
report meaningful evidence/direction changes.
