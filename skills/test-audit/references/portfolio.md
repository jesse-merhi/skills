# Test portfolio

Treat the suite as a portfolio of distinct reachable regressions, not a record
of every implementation change. Keep the smallest set of executable tests that
protects every behavior the product still promises.

## Defend each owner

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

## Require a replacement owner

Before deleting coverage, name and inspect the executable test that will fail
for the same bug. Land and verify a required replacement before or in the same
change, and confirm it runs at an equivalent required cadence. Manually
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

## Choose the proof level

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

## Consolidate or remove

Consolidate cases that differ only by equivalent roles, statuses, invalid
inputs, filters, wording, or repeated workflow setup. Use a named object-shaped
table when the cases drive the same branch and assertion shape. Keep cases
separate when their failure modes or required side effects differ.

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

## Audit adversarially

For each proposed keeper, challenge whether the bug is reachable, distinct,
placed at the right level, and backed by an independent expectation. For each
deletion, challenge whether the named replacement really drives the same
branch and outcome. Recheck every affected high-risk boundary after the
challenge.

For a portfolio-reduction audit, report before-and-after test file counts,
expanded test counts, and measured runtime when the environment can measure it
reliably. State limitations rather than estimating.
