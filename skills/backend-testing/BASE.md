---
name: backend-testing
description: 'Create, review or audit backend integration tests through real production callers and data stores, using the project’s existing harness.'
---

# Backend testing

Load [writing-good-tests](../writing-good-tests/SKILL.md) first. It owns permanent-test value, deletion, unit-test exceptions, temporary verification, execution roles, required checks and authority. Apply its value gate before adding or retaining backend proof. Use this skill for the backend-specific boundary and fixture decisions below; an uncovered branch alone does not need a test.

## Establish the boundary

Trace the changed result from a real route, service, job or event caller through its collaborators and stored state. Inspect nearby tests, fixtures, project instructions, package scripts and installed runtime/dependency APIs. Establish supported inputs and the consequential failure the existing proof misses; do not invent invalid states just to exercise rejection.

Reuse the project's integration harness and commands. Do not replace its runner or add dependencies to obtain a preferred test shape. Clear production code and a real complete journey may already provide effective proof; avoid recreating that journey endpoint by endpoint.

## Keep production collaborators real

Exercise the production entry point appropriate to the claimed proof. A service test cannot establish route authentication, serialization or middleware binding. Keep first-party services, repositories and the relevant data store real; mocked results cannot prove their interaction or persistence.

Use isolated disposable stores through the existing harness. Match the relevant production engine semantics; an in-memory substitute does not prove production constraints or transactions. Use Testcontainers where already available and suitable, rather than requiring it everywhere. Keep Redis or another broker/cache real when its atomicity, persistence or delivery behavior is part of the tested contract. Follow project isolation and cleanup rules; never use customer or production data to obtain proof.

Build tiny realistic fixtures from application data definitions. Seed only the identities, permissions and records needed to distinguish the result. Assert stored state through an independent read after the action, rather than a mock expectation or the value the subject itself calculated. Do not add production exports, switches or abstractions solely for test convenience.

## Assert consequential outcomes

Successful and stateful actions must prove returned values and the meaningful persisted result, rather than only status or response-key presence. For denied actions, prove rejection and absence of possible forbidden effects, including writes or queued work. A rejection status can suffice when it is the complete observable contract and no forbidden effect is possible.

Investigate these risks only where the changed flow can reach them, retaining dedicated tests only under the shared value gate:

- **Permissions and isolation:** use actual identities and scoped records through production authorization. Response filtering does not prove row or tenant isolation; a filtering consolidation must exercise the production response path.
- **Transactions and rollback:** induce a supported failure at the actual boundary and inspect which state committed or rolled back. Test setup rollback is not proof of application rollback.
- **Concurrency and retries:** drive real overlapping callers or retryable boundary failures with the existing harness. Verify the promised final state, uniqueness or idempotency; avoid incidental call counts and arbitrary sleeps. Do not inject a failure that the installed client absorbs before application code can see it.
- **Time:** identify which process owns the clock, use its native controllable clock when supported, and set timezones explicitly. Distinguish calendar dates from instants; fixed parser/boundary fixtures are valid, dates assumed to remain in the future are not.

Assert database outcomes rather than emitted SQL fragments, configuration constants, schema-library behavior or framework/compiler internals. A runtime schema matters when it governs a consequential application contract; the library's validation mechanics alone do not justify permanent tests.

## External boundaries and migrations

Substitute external providers through existing interfaces with realistic responses and failures. Assert application results and required external effects without letting the substitute supply the first-party behavior being claimed. A provider mock proves application handling, not the provider's protocol or deployment. When actual provider integration needs proof, use an authorized isolated provider smoke check or report the missing capability; do not present a mock as real provider evidence.

When schema, migration or stored-data behavior changes, use the project's migration checks and harness. Verify representative supported prior state survives or transforms correctly and can be read through the affected production path. Inspect supported old/new readers and writers under the project's compatibility contract; an empty-database migration or schema snapshot alone cannot prove stored-data compatibility. This does not require new permanent tests for every migration statement or an unrelated full-suite run.

## Verify and report

Select affected checks from current project/package scripts and complete explicit requirements under writing-good-tests. Broaden execution only to answer an unresolved question or cover invalidated evidence. Report the caller exercised, real stores and substituted boundaries, observed result, commands and limits. Distinguish temporary verification from permanent coverage and provider/application proof; keep required evidence with the task, without a new test registry.
