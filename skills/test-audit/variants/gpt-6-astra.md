---
name: test-audit
description: "Plan and audit test portfolios before creating, changing, or removing tests or test infrastructure; challenge missing, duplicate, brittle, wrongly placed, ownerless, and dangerous coverage."
---

# Test audit

Resolve the changed product risk and choose the smallest useful test portfolio.
Use before test changes and for reviews of production behavior, tests, or their
fixtures/routes/helpers/config/harnesses. Do not ask the user to settle ordinary
coverage mechanics that code and existing owners can answer. Editing still needs
implementation authority.

## Establish what remains promised

Write the new contract in one sentence from the request/diff/API/UI/docs. Retire
intentionally replaced shapes unless compatibility remains promised. Inventory
`git diff --name-status <base>...HEAD`; include in-scope local changes through
`git diff --name-status`, `git diff --cached --name-status`, and
`git ls-files --others --exclude-standard`, deduplicating paths. Inspect changed,
deleted, proposed, and nearby unchanged tests around affected routes/components/
hooks/services/schemas/helpers/packages/flows and all changed infrastructure.
Every changed assertion needs judgment; unchanged nearby coverage may drift too.

Apply coverage drift, test value, portfolio ownership, and execution-cost gates.
A real risk has a current code/contract/data/permission/user-flow path, and is
change-relevant when introduced, exposed, fixed, or directly exercised here.
Do not invent a test merely because a feature changed or a historical failure existed.

## Establish each executable owner

For each keeper/proposal and nearby replacement/overlap comparison, record the
future bug, boundary, nearest broader/narrower/peer coverage and why it misses
that bug, plus independently derived expectation. Use known literals, worked
examples, specs, or fixtures; mirrored production calculations are tautological.

Keep one executable owner per distinct promised regression. Broader coverage
replaces narrower coverage only with equivalent input, same branch/bug/public
outcome, and equivalent required cadence. Inspect and land/verify replacements
before or with deletion. Incidental traversal, future work, manual checks,
dev assertions, types, and schemas do not qualify; opt-in/manual automation alone
cannot replace routine coverage. Retired/unreachable behavior needs no replacement
unless absence still serves compatibility/privacy/migration/security/safety.

Preserve distinct security/privacy/permission/accessibility/safety, time/expiry,
concurrency/race, offline, migration, transaction, isolation, and external-failure
owners. Drive the branch and assert its outcome; happy-path traversal is insufficient.
Authorization rejection includes denial and no possible forbidden effect.

Choose unit proof for pure policy/state/parser/calculation/matrices; integration
for real binding/persistence/authorization/transactions/isolation; E2E for visible
workflows/native interaction/cross-role handoff; focused tests for executable
test helpers; parser/linter plus real execution for declarative test/build config.
Avoid app startup for pure policy and do not claim binding from policy-only tests.
Keep one valuable complete golden journey plus focused owners for distinct risks.
Consolidate repeated setup/assertion shape in named object tables, retaining each
distinct failure or side-effect row and dropping equivalent cases.

## Decide whether intervention adds value

A keeper answers five questions: what future change makes it fail, why that failure
is a real product/API/data/security/workflow bug, why this proof level is the lowest
practical one, whether the assertion is stable behavior, and whether the expected
value has an independent source. Challenge keepers against adjacent coverage and
deletions against real replacement equivalence, then recheck affected high-risk boundaries.

Remove/rewrite branch-history assertions, obsolete absence without a current promise,
impossible validated-away states, incidental wording/waits/mock counts/order/wiring,
broad snapshots, tautologies, line-by-line source/config mirrors, and orphaned test
routes/fixtures/env switches/helpers/harnesses/duration metadata. Status/render/key-
presence-only success does not prove values, state changes, or persistence.

Frontend proof should target navigation, submitted/loaded/persisted data,
permissions, validation, control state, or stable accessibility. Stable text
selectors are useful; arbitrary UI/marketing copy is not a behavioral assertion.
Exact wording, timing, geometry, lifecycle, appearance, and layout earn coverage
when explicitly promised by stable product/design/legal/accessibility/safety/
domain/protocol contracts. Some additions, cleanup, and intentional removals need no tests.
For example, a `systemAlerts` removal should lead to proof of the replacement
alert contract, not `.not.toHaveProperty("systemAlerts")` unless absence remains promised.

## Bound execution cost before acting

For every audit trace whether selection/count, setup, retries, cache, fixtures,
testability, duration, sharding, runner capacity, or scheduling can materially
change total work, runner cost, or parallel makespan. Existing slow/costly/sharded
suites lower the threshold but do not themselves prove impact. Explicit optimization
or a material mechanism triggers [expensive-suites.md](references/expensive-suites.md)
and comparable baseline capture; otherwise record `no material execution-cost impact`.
Repeat for proposed test/infrastructure changes, even read-only recommendations,
and report expected direction, evidence, or limitations. Capture an applicable
baseline before authorized edits. Repeat on final diff and report raw comparable
values or measurement limits; do not claim estimates as measurements.

## Execute the chosen portfolio decision

Use `keeper`, `consolidate`, `move`, `rewrite`, `delete`, `changed-but-useless`,
`missing`, `no-test-needed`, `no-change-needed`, and `dangerous-removal`. Keepers
own distinct promised bugs; consolidation retains distinct cases; moves preserve
outcomes at better boundaries; rewrites fix brittle/stale/tautological proof.
Deletion needs no current risk or an equivalent replacement. Changed-but-useless
catches no real future bug; missing has a verified change-relevant unowned risk.
No-test/no-change decisions require inspection. Dangerous removal loses the last
promised owner without an inspected equivalent at required cadence.

For authorized edits, run focused file/package tests and typecheck/lint when
helpers, fixtures, route contracts, or shared types change. Report populated
decision buckets plus Ownership, Validation, and execution-cost conclusion.
Give path-specific reasons, replacement owners or why none is needed, and the
adjacent-coverage gap for each keeper/consolidated case. Portfolio reductions
also need before/after file counts, expanded test counts, and reliable measured
runtime or explicit limitations. Stop once the scoped portfolio decisions and
required proof are complete rather than adding tests to show diligence.
