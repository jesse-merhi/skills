---
name: vertical-slice-tdd
description: 'Implement behavior changes with one narrow failing vertical-slice test at a time for features, bugfixes, refactors, flows, and APIs.'
---

# Vertical Slice TDD

Drive the work through thin end-to-end behavior slices. Avoid writing all tests
first or building layers that do not yet connect.

## Workflow

1. Pick the smallest externally meaningful behavior.
2. Follow the red/green/refactor loop in [loop.md](references/loop.md).
3. Keep each slice shaped like the examples in [slice-shape.md](references/slice-shape.md).
4. Finish with the package's relevant typecheck/lint/test commands.
5. Use [exceptions.md](references/exceptions.md) only for docs-only,
   config-only, generated-code, or mechanical formatting changes.

## Required Discipline

- One narrow failing vertical-slice test at a time.
- Implement only enough production code to pass that test.
- Refactor only after green, keeping behavior unchanged.
- Do not mock the behavior the slice is supposed to prove.

## Context Pointers

- Use [loop.md](references/loop.md) for the exact TDD loop.
- Use [slice-shape.md](references/slice-shape.md) for good boundaries and
  layer-only tasks to avoid.
- Use [exceptions.md](references/exceptions.md) when TDD is not appropriate.
