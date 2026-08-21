# Usefulness bar

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

## Good test signals

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

## Waste signals

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
