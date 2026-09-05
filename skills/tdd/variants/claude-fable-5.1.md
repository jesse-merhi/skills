---
name: tdd
description: 'Build or fix behavior test-first through a red-green-refactor loop when the user requests TDD, test-first work, or integration-style tests.'
---

# Test-driven development

Complete one behavior through red, green, and refactor before starting the next.
Do not write a horizontal batch of imagined tests and implement them afterward.

1. Load `test-audit` before creating the first test. State the proposed seam,
   observable outcome, external dependencies, distinct reachable regression,
   and nearest existing coverage. Prefer an existing public boundary such as
   a CLI, HTTP request, exported function, component interaction, or adapter.
   Choose the narrowest useful proof with an independent expected result and
   no equivalent owner remaining. Ask only if the choice materially changes
   architecture, testing cost, or product behavior.
2. Read [tests.md](references/tests.md) and [mocking.md](references/mocking.md).
   Batch independent preparation only. A focused internal pure-logic test is
   appropriate when its contract is durable and a larger boundary obscures
   failure or makes the suite needlessly slow.
3. Write one focused behavior test. Run it. Confirm that it fails because the
   behavior is absent, not because the fixture, environment, or test is broken.
4. Implement the smallest complete solution and run the test to green. Small
   does not mean temporary, duplicated, or knowingly awkward.
5. Refactor while preserving behavior: improve names, remove duplication,
   simplify control flow, deepen modules, and repair interfaces. Run the
   affected test again. Do not add new behavior in this step.
6. Use what the cycle taught you to select the next behavior. Once the slice
   is stable, run the broader relevant suite. During long work, report a completed
   cycle, changed evidence, or blocker.

Tests should survive implementation changes. Use one behavior per test and as
many assertions as jointly needed to prove it. Derive expected results independently.
Avoid private methods and incidental call order. Prefer real repository modules;
mock external boundaries when using the real boundary is impractical.

This is a fork of Matt Pocock's MIT-licensed `tdd` workflow. It keeps a bounded
refactor after each green pass, unlike the upstream version that excludes it,
and relaxes absolute rules about pre-agreed seams and internal tests.
