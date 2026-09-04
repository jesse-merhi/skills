---
name: reducing-cognitive-load
description: 'Review dense, clever, stringly typed, weakly typed, over-abstracted, or hard-to-read code.'
---

# Reducing cognitive load

Return concrete, evidence-backed simplifications that reduce a maintainer's
mental stack. Discover all genuine scoped complexity candidates before selecting
recommendations. Do not add abstractions, guards, examples, or extra tests merely
to demonstrate thoroughness. Refactoring requires implementation authority.

Read existing domain/schema/API-response/route/shared types and their real
consumers. Reuse exported contracts. Cross-module or multiply consumed shapes
and domain concepts belong at shared boundaries; tiny implementation details
may be local. Model structured multi-field data before serializing once through
a named boundary; use discriminated unions for states.

Inspect anonymous delimiter protocols, rule-heavy inline transformations,
duplicated/misplaced types, positional arrays, boolean/optional-field soup,
one-expression wrappers, generic helpers without multiple real callers, and
unsupported guards/fallbacks/normalization/sanitization. For instance, a submission
snapshot should expose `kind`, `id`, `documentTypeId`, `updatedAtMs`, `requestId`,
existing `SubmissionStatus`, and nullable `objectKey` as typed data before one
`createSnapshotSignature(parts)` serialization. The caller should reveal what is
built before how it is encoded.

Accept helper extraction only for a domain concept, meaningful real duplication,
an external/serialization/framework boundary, lower branching/nesting, or a useful
test seam. A one-use proxy may be inlined when behavior is preserved and the
caller is clearer; keep it for genuine domain meaning, boundaries, dependency
direction, expected variability, or a useful seam. Hypothetical callers do not count.

For changed defenses, establish a plausible current producer, contract, observed
failure, or boundary condition. If absent and removal preserves behavior, recommend
removing the defense before inlining any remaining proxy. A parse/clear-`url.search`/
stringify wrapper is unnecessary when repo evidence proves an admin connection
string has no parameters. Preserve it for meaningful provider parameters, untrusted
input, or callers relying on normalization.

Keep recommendations focused: concept fields, type ownership/reuse, invalidation
rules, helper meaning, and directly testable invariants. Named protocol boundaries
need targeted proof of fields, stable order, nullish handling, and invalidation
under the test portfolio policy. Finish with domain concepts exposed, shared
contracts reused, justified serialization boundaries, plausible defenses, and
helpers that pass the extraction/proxy criteria. No additional verifier team is needed.
