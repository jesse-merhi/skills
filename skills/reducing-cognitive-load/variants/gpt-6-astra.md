---
name: reducing-cognitive-load
description: 'Review dense, clever, stringly typed, weakly typed, over-abstracted, or hard-to-read code.'
---

# Reducing cognitive load

Expose the domain model and invariants so a maintainer can understand the caller
without reverse-engineering encodings or jumping through wrappers. Resolve
ordinary type and ownership questions from code; a review remains read-only
unless refactoring is authorized.

## Find the concept and its owner

Inspect existing domain/schema/API-response/route/shared types before inventing
shapes. Put cross-module contracts, multiply consumed shapes, and domain concepts
at shared boundaries; keep only tiny implementation details local. Represent
multi-field identities, freshness, and signatures as typed objects and states
as discriminated unions. Encode once through a named serialization boundary.

For a submission snapshot, model `kind`, `id`, `documentTypeId`, `updatedAtMs`,
`requestId`, existing `SubmissionStatus`, and nullable `objectKey` first. Then
serialize all parts in `createSnapshotSignature(parts)` or an equivalent owner-
named function. Avoid making a delimiter-joined template string the domain model.

## Judge whether indirection earns its place

Inspect inline map/filter/reduce chains hiding domain rules, positional arrays,
boolean/optional soup, duplicate or misplaced contract types, anonymous string
protocols, expression-only wrappers, speculative generic helpers, and unsupported
defensive paths. An extraction must name a domain concept, remove real duplication,
isolate an external/serialization/framework boundary, reduce branching/nesting,
or create a useful test seam. Moving one expression behind a jump is insufficient.

For each changed guard, fallback, normalization, or sanitization, establish a
current plausible producer, contract, observed failure, or boundary condition.
If none exists and removal preserves behavior, recommend removal. For a one-use
forward/convert/light-transform helper, inline only when the caller becomes
clearer without losing domain meaning, a boundary/dependency direction, expected
variability, or a useful seam. Remove unsupported defense before inlining its proxy.

Example: repo proof that an admin connection string has no query parameters can
justify removing a parse/clear-`url.search`/stringify wrapper and using the value
directly. Preserve it when parameters are meaningful, input is untrusted, or
callers rely on normalization. "Just in case" and future callers are not evidence.

## Recommend a concrete improvement

Explain which fields belong, which existing/shared type owns them, which changes
invalidate derived keys/snapshots, what concept a helper names, and how to test
the invariant without inline glue. Give short replacement advice, not "make it
cleaner." Protocols need targeted proof for fields, ordering, nullish handling,
and invalidation, subject to the test portfolio policy.

Completion means visible domain shape before encoding, reused shared contracts,
named/proved serialization boundaries, plausible defenses, and helpers that
pass extraction/proxy checks. Do not widen authorized simplification into new
abstraction or unrelated tests.
