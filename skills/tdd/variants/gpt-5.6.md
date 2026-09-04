---
name: tdd
description: 'Build or fix behavior test-first through a red-green-refactor loop when the user requests TDD, test-first work, or integration-style tests.'
---

# Test-driven development

Deliver behavior in vertical red-green-refactor cycles. Tests should describe
what a caller experiences and survive changes to implementation details.

Before writing a test, load `test-audit`. State the stable seam, observable
outcome, external dependencies, distinct reachable regression, and nearest
existing coverage. Prefer an existing public boundary—CLI, HTTP, exported
function, component interaction, or adapter. Choose the narrowest useful proof,
an independently derived expected result, and one owner after the change.
Ask only when seam selection materially changes architecture, test cost, or
product behavior. Durable internal pure logic may deserve focused tests when
a larger boundary would obscure failures or add unnecessary cost.

Read [tests.md](references/tests.md) and [mocking.md](references/mocking.md).
Then repeat:

1. Write one behavior test and run it. Confirm red means missing behavior,
   not a broken test, fixture, or environment.
2. Implement the smallest complete solution that passes. Do not knowingly
   introduce temporary, duplicated, or awkward design merely to be small.
3. Refactor while green: improve names, duplication, control flow, module depth,
   and interfaces without adding behavior.

Run the affected test after red, green, and refactor. Run the broader relevant
suite when the slice is stable. Let each cycle teach the next; do not write all
imagined tests before any implementation.

Keep one behavior per test; several assertions may prove it together. Avoid
private-method and incidental call-order assertions. Prefer real internal
collaborators and mock impractical external boundaries only.

This forks Matt Pocock's MIT-licensed `tdd` workflow. Unlike the upstream version
that excludes refactoring, this fork retains a bounded refactor after each green
pass and allows evidence-led seam choices and durable internal tests.
