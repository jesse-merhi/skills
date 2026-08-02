---
name: tdd
description: 'Test-driven development. Use when the user wants to build features or fix bugs test-first, mentions red-green, or wants integration tests.'
---

# Test-Driven Development

This skill adapts Matt Pocock’s upstream `tdd` skill. Preserve its pre-agreed
seam and red -> green loop semantics unless this repository intentionally
documents a fork.

TDD is the red -> green loop. This skill is the reference that makes that loop
produce tests worth keeping: what a good test is, where tests go, the
anti-patterns, and the rules of the loop. Every section applies on every cycle;
consult them before and during the loop, not after.

When exploring the codebase, read `CONTEXT.md` if it exists so test names and
interface vocabulary match the project's domain language, and respect ADRs in
the area you are touching.

## What a good test is

Tests verify behavior through public interfaces, not implementation details.
Code can change entirely; tests should not. A good test reads like a
specification and survives refactors because it does not care about internal
structure.

See [tests.md](references/tests.md) for examples and
[mocking.md](references/mocking.md) for mocking guidelines.

## Seams: where tests go

A seam is the public boundary you test at: the interface where you observe
behavior without reaching inside. Tests live at seams, never against internals.

Test only at pre-agreed seams. Before writing any test, write down the seams
under test and confirm them with the user. No test is written at an unconfirmed
seam. You cannot test everything; agreeing the seams up front is how testing
effort lands on the critical paths and complex logic instead of every edge case.

Ask: "What is the public interface, and which seams should we test?"

## Anti-patterns

- **Implementation-coupled**: mocks internal collaborators, tests private
  methods, or verifies through a side channel. The tell: the test breaks when
  you refactor but behavior has not changed.
- **Tautological**: the assertion recomputes the expected value the way the code
  does, so it passes by construction and can never disagree with the code.
  Expected values must come from an independent source of truth: a known-good
  literal, a worked example, the spec.
- **Horizontal slicing**: writing all tests first, then all implementation. Work
  in vertical slices instead: one test, one implementation, repeat, each test a
  tracer bullet that responds to what the last cycle taught you.

## Rules of the loop

- **Red before green.** Write the failing test first, then only enough code to
  pass it. Do not anticipate future tests or add speculative features.
- **One slice at a time.** One seam, one test, one minimal implementation per
  cycle.
- **Refactoring is not part of the loop.** It belongs to the review stage; use
  `code-review` for that work.
