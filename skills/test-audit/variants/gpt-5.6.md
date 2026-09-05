---
name: test-audit
description: "Plan and audit test portfolios before creating, changing, or removing tests or test infrastructure; challenge missing, duplicate, brittle, wrongly placed, ownerless, and dangerous coverage."
---

# Test audit

Choose the smallest executable portfolio that protects distinct reachable failures
in behavior the product still promises. Run before test changes and in reviews
of production behavior, tests, or test infrastructure (fixtures, test-only routes,
helpers, config, and harnesses). Adding a test is a decision, not the default.

## Establish the changed contract and affected portfolio

State the new product contract in one sentence from the request/diff/API/UI/docs.
An intentionally replaced contract is obsolete unless compatibility remains promised.
Inventory committed changes with `git diff --name-status <base>...HEAD`. When local
changes are in scope, also inspect `git diff --name-status`,
`git diff --cached --name-status`, and `git ls-files --others --exclude-standard`;
deduplicate paths. Include deleted tests, infrastructure, and nearby unchanged
coverage around affected routes, components, hooks, services, schemas, helpers,
packages, and flows. Audit every changed assertion and decide whether unchanged
related tests still fit.

Apply four gates: coverage drift, value of each changed/proposed test, one owner
per distinct regression at the narrowest useful level, and execution cost.
A risk is real when current code/contracts/data/permissions/flows demonstrate it,
and change-relevant when this work introduces, exposes, fixes, or directly exercises it.

For every retained/proposed owner and nearby replacement/overlap comparison, record
the realistic future bug, proving boundary, nearest broader/narrower/peer test
and why it misses the bug, and an independent expected result. Known-good literals,
worked examples, fixtures, and specs qualify; recomputing production logic does not.

## Assign and preserve executable ownership

Tests at different levels may coexist only for different bugs. A broader test
replaces a smaller owner only if it drives the same branch with equivalent input,
fails for the same regression, asserts the same public outcome, and runs at an
equivalent required cadence. Incidental traversal is not proof. Inspect the
replacement and land/verify it before or with deletion. Future tests, planned
refactors, manual checks, dev assertions, types, or schemas are not executable
owners; opt-in/manual coverage alone cannot replace routine automation.

Unreachable/retired behavior needs no replacement unless absence remains a
compatibility, privacy, migration, security, or safety promise. Preserve distinct
owners for security/privacy/permissions/accessibility/safety, expiry/time,
concurrency/races, offline, migrations, transactions, isolation, and external-call
failure; happy paths do not own these branches without driving and asserting them.

Choose proof at the narrowest useful level:

| Contract | Owner |
| --- | --- |
| Pure policy/state/parser/calculation/boundary matrix | Unit |
| Real binding/persistence/authorization/transaction/isolation | Integration |
| Visible workflow/native interaction/cross-role handoff | E2E |
| Executable test parser/validator/selector/fixture helper/serializer | Focused helper test |
| Declarative test/build configuration | Parser or linter plus real execution |

Do not boot/render an app for pure policy, or claim binding proof from unit policy
coverage. Keep one valuable complete golden journey and focused owners only for
risks it cannot isolate. Consolidate repeated setup/assertion shape with named
object-shaped tables, retaining one row per distinct failure/required side effect.
Remove equivalent role/status/input/filter/wording cases exercising the same branch/outcome.

## Decide value and cost

A keeper must answer: what future code change fails it; why that is a real product/
API/data/security/workflow bug; why this is the lowest practical level; whether
it asserts stable behavior; and where the independent expectation comes from.
Challenge keepers against adjacent coverage and deletions against inspected
replacement equivalence, then recheck affected high-risk boundaries.

Remove or rewrite branch-history tests, obsolete-field/callback absence without
a current promise, impossible states ruled out upstream, incidental wording/
waits/mock counts/order/wiring, broad snapshots, tautologies, declarative source
mirrors, and orphaned test routes/fixtures/env switches/helpers/harnesses/duration
metadata. Status-only, key-presence-only, and render-only success tests miss real
values/state/persistence and do not earn ownership. Passing tests and historical
regressions alone do not establish value.

Frontend tests should prove navigation, submitted/loaded/persisted data, validation,
permissions, enabled state, or stable accessibility. Text selectors may locate
an element; do not lock arbitrary headings/buttons/placeholders/marketing copy.
Keep exact words, timing, geometry, lifecycle calls, appearance, or layout when
an explicit stable product/design/legal/accessibility/safety/domain/protocol
contract promises them. Authorization rejection must assert denial and absence
of possible forbidden effects. Some additions, removals, and cleanup need no new tests.

For every audit, trace whether the change affects selection/count, setup, retry,
cache, fixture, testability, duration, sharding, runner capacity, or scheduling.
A known slow/costly/sharded suite lowers the threshold, but is not itself a mechanism.
For explicit runtime/cost/makespan optimization, or a mechanism that could materially
change total work, runner cost, or parallel makespan, read
[expensive-suites.md](references/expensive-suites.md) and establish a comparable
baseline. Otherwise record `no material execution-cost impact`.
Repeat this gate before recommending test/infrastructure changes, even read-only
proposals. Report mechanism, expected direction, evidence or measurement limit;
for authorized edits capture baseline before editing. Repeat against final diff,
comparing raw baseline/candidate values for material signals or stating limitations.

## Classify, act, and report

Use these decisions consistently:

- `keeper`: owns a distinct reachable promised regression.
- `consolidate`: retain distinct cases but share setup/table.
- `move`: retain the outcome at a more appropriate boundary.
- `rewrite`: right risk/boundary, brittle/stale/tautological proof.
- `delete`: no current owner needed, equivalent replaced duplicate, or orphaned infrastructure.
- `changed-but-useless`: passes but catches no verified reachable future bug.
- `missing`: a verified change-relevant risk has no owner.
- `no-test-needed`: inspected work would gain only obsolete/duplicate/low-value coverage.
- `no-change-needed`: inspected existing coverage already fits.
- `dangerous-removal`: last promised owner removed without an inspected equivalent at required cadence.

Edit only with implementation authority. After authorized edits, run the focused file/package tests,
plus typecheck/lint for changed helpers, fixtures, route contracts, or shared types.
Report populated Keep, Consolidate, Move, Rewrite, Delete, Changed but useless,
Missing, No test needed, No change needed, and Dangerous removals buckets, plus
Ownership, Validation, and the execution-cost conclusion. Give a small path-specific
reason for each proposed change and name replacements or why none is needed;
explain adjacent-coverage gaps for each keeper/consolidated case. For portfolio
reduction include before/after file counts, expanded test counts, and reliably
measured runtime; state limitations rather than estimate.

Example: replacing `expect(json.data.alerts.systemAlerts.length).toBe(2)` with
`expect(json.data.alerts).not.toHaveProperty("systemAlerts")` usually preserves
branch history, not the new API contract. Delete that absence assertion unless
compatibility/privacy requires it and assert the alert data callers now consume.
