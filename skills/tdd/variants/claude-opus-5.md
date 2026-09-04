---
name: tdd
description: 'Build or fix behavior test-first through a red-green-refactor loop when the user requests TDD, test-first work, or integration-style tests.'
---

# Test-driven development

Deliver the accepted behavior through vertical red-green-refactor cycles and
leave a focused test portfolio. Completion includes the explicit cycle checks
and broader relevant suite, not an additional verifier agent or speculative tests.

Choose the proof before adding it. Load `test-audit` and state the seam,
observable outcome, external dependencies, distinct reachable regression, and
nearest existing coverage. Prefer an existing stable public boundary—CLI,
HTTP, exported function, component interaction, or adapter—with the narrowest
useful proof, an independent expectation, and no equivalent owner left behind.
Only material architecture, cost, or product choices need a user question.
Durable internal pure logic is suitable for focused tests when larger-boundary
coverage obscures failures or costs needlessly more. Read
[tests.md](references/tests.md) and [mocking.md](references/mocking.md).

For each behavior, keep the loop ordered:

- Red: write one focused test, execute it, and establish that missing behavior
  caused the failure rather than the test, fixture, or environment.
- Green: implement the smallest complete passing solution. Do not use knowingly
  temporary, duplicated, or awkward structure as a shortcut.
- Refactor: while green, improve names, duplication, control flow, module depth,
  and interfaces without adding behavior. Execute the affected test again.

Run the affected test at all three stages and the broader relevant suite when
the slice is stable. Let each cycle inform the next instead of writing all
imagined tests first. Keep reports to completed behaviors, evidence, and blockers.

Use one behavior per test, allowing jointly necessary assertions. Derive expected
results independently. Avoid private-method and incidental call-order assertions;
prefer real internal collaborators and mock impractical external boundaries.

This forks Matt Pocock's MIT-licensed `tdd` workflow: bounded refactoring remains
after each green pass, unlike the upstream version that excludes it, and seam
selection and internal-test rules are evidence-led rather than absolute.
