---
name: tdd
description: 'Build or fix behavior test-first through a red-green-refactor loop when the user requests TDD, test-first work, or integration-style tests.'
---

# Test-driven development

Carry each authorized behavior through a vertical red-green-refactor cycle.
Resolve routine test mechanics from repository evidence while preserving user
choices that materially affect architecture, cost, or product behavior.

## Establish the right proof boundary

Load `test-audit` before the first test. State the seam, observable outcome,
external dependencies, distinct reachable regression, and nearest existing
coverage. Prefer an existing stable caller boundary: CLI, HTTP, exported function,
component interaction, or adapter. A suitable test has the narrowest useful
proof level, an independently derived expectation, and no equivalent owner left
afterward. Ask the user only for material seam decisions. Durable internal pure
logic may be tested directly when a larger boundary would hide failures or be
needlessly slow. Read [tests.md](references/tests.md) and
[mocking.md](references/mocking.md) for concrete guidance.

## Learn one behavior at a time

Write one focused test and execute it. Establish that red comes from missing
behavior, not a broken fixture, environment, or test. Implement the smallest
complete solution and rerun to green; avoid knowingly temporary, duplicated,
or awkward design. Refactor names, duplication, control flow, module depth, and
interfaces without adding behavior, then rerun the affected test.

Repeat only for the next behavior informed by the prior cycle. Run the broader
relevant suite when the slice is stable. These red, green, refactor, and affected-
suite checks remain required; additional checking should answer a real change,
failure, or unresolved concern.

## Keep the tests useful

Test caller-visible behavior with one behavior per test and multiple assertions
when they jointly prove it. Avoid private-method and incidental call-order
coupling. Prefer real internal collaborators; mock an external boundary when
using it is impractical. Do not prewrite a horizontal batch of speculative tests.

This fork of Matt Pocock's MIT-licensed `tdd` workflow retains bounded refactoring
after every green pass, unlike the upstream version that excludes it, and permits
evidence-led seam choices and durable internal tests.
