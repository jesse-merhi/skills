---
name: reducing-cognitive-load
description: 'Review dense, clever, stringly typed, weakly typed, over-abstracted, or hard-to-read code.'
---

# Reducing cognitive load

Outcome: reduce the next maintainer's mental stack by exposing domain concepts,
invariants, and data shapes. More abstraction is not the goal; avoid a maze of
tiny wrapper functions.

## Core rule

Prefer code that exposes domain concepts, invariants, and data shapes. Avoid
code that makes readers reverse-engineer hidden protocols, positional fields,
duplicated types, or clever inline transformations.

## Workflow

1. Look for existing domain types, schemas, API response types, route types, and
   shared model types before inventing a local type.
2. Decide where each concept belongs:
   - boundary/shared type when it crosses module boundaries, is consumed by
     multiple modules, or encodes a domain concept
   - local named type when it is only a tiny implementation detail
3. Model structured data before serialization. If data becomes a string, array,
   or hash, serialize once at an explicit boundary.
4. Scan for the red flags in [red-flags.md](references/red-flags.md).
5. In review-only work, recommend concrete replacement patterns from
   [patterns.md](references/patterns.md). Apply them only when refactoring is
   authorized.
6. Use the extraction test in [extraction-test.md](references/extraction-test.md)
   before adding helper functions.
7. When reviewing a diff, use [review-checklist.md](references/review-checklist.md)
   and prefer concrete rewrites over vague "make this cleaner" comments.

## Completion criteria

- The code exposes the domain concept before the encoding detail.
- Shared contracts use shared types instead of duplicated local shapes.
- Serialization boundaries have names and tests when the protocol matters.
- Defensive code passes the plausibility test; helpers pass the extraction and
  proxy tests.
- The reader can see what is being built before studying how it is encoded.

## Context pointers

- Use [red-flags.md](references/red-flags.md) for common cognitive-load smells.
- Use [patterns.md](references/patterns.md) for typed objects, unions,
  serialization boundaries, and protocol tests.
- Use [extraction-test.md](references/extraction-test.md) before extracting a
  helper.
- Use [review-checklist.md](references/review-checklist.md) when producing review
  findings.
