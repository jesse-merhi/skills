---
name: tdd
description: 'Build or fix behavior test-first through a red-green-refactor loop when the user requests TDD, test-first work, or integration-style tests.'
---

# Test-driven development

Outcome: deliver observable behavior through one vertical red-green-refactor
cycle at a time, leaving tests that remain useful when implementation details
change.

## Choose the seam

A seam is the stable boundary through which a caller experiences behavior: a
CLI command, HTTP request, exported function, component interaction, adapter,
or another durable interface.

Before the first test, load `test-audit` and apply its test-portfolio policy.
State the proposed seam, observable outcome, external dependencies, distinct
reachable regression, and nearest existing coverage. Prefer an existing public
boundary. Done when the proposed test has the narrowest useful proof level, an
independent expected result, and no equivalent owner will remain after the
change. Ask the user only when the choice would materially change architecture,
testing cost, or product behavior.

Prefer tests at stable behavioral boundaries. Focused tests of internal pure
logic are appropriate when that logic has a durable contract and exercising it
through a larger boundary would obscure failures or make the suite needlessly
slow.

Read [tests.md](references/tests.md) for examples and
[mocking.md](references/mocking.md) for boundary guidance.

## Red-green-refactor

1. **Red:** Write one focused behavior test. Run it and confirm it fails because
   the behavior is missing, not because the test, fixture, or environment is
   broken.
2. **Green:** Implement the smallest complete solution that passes. Small does
   not mean knowingly temporary, duplicated, or awkward.
3. **Refactor:** While the suite remains green, improve names, remove
   duplication, simplify control flow, deepen useful modules, and repair
   awkward interfaces. Do not add new behavior during refactoring.
4. Repeat for the next behavior, letting the previous cycle inform the next
   test.

Run the affected test after red, green, and refactor. Run the broader relevant
suite when the slice is stable.

## Test quality

- Test behavior users or callers care about, not private methods or incidental
  call order.
- Keep one behavior per test. Use multiple assertions when they jointly prove
  that behavior.
- Derive expected results independently from the implementation.
- Mock external boundaries when a real boundary is impractical. Prefer real
  repository modules and collaborators inside the system.
- Avoid horizontal slicing in which every imagined test is written before any
  implementation. Each test should teach the next implementation move.

This skill intentionally forks Matt Pocock's MIT-licensed `tdd` workflow. The
upstream version currently excludes refactoring from the loop; this fork keeps
a bounded refactor after every green pass so the implementation is left simple
while the cycle's design context is still fresh. It also softens upstream's
absolute rules about pre-agreed seams and internal tests.
