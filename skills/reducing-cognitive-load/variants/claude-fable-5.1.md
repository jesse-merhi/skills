---
name: reducing-cognitive-load
description: 'Review dense, clever, stringly typed, weakly typed, over-abstracted, or hard-to-read code.'
---

# Reducing cognitive load

Make code easier for the next maintainer to understand. Do not replace dense
code with a maze of tiny wrappers. Recommend concrete changes in review-only
work and edit only when refactoring is authorized.

1. Read the complete relevant path. Batch independent type, contract, and call-
   site reads. Look for existing domain types, schemas, API responses, routes,
   and shared models before inventing a local shape.
2. Put each concept at its owner. Shared boundaries hold cross-module contracts,
   multiply consumed types, and domain concepts. A tiny implementation detail
   may use a local named type.
3. Model structured data before encoding. Use typed objects for multi-field
   identity/freshness/signatures and discriminated unions for states. Serialize
   once at a named boundary such as `createSnapshotSignature(parts)` or `toCacheKey(input)`.
4. Inspect concrete red flags: delimiter-joined keys, long inline map/filter/reduce
   chains encoding rules, duplicated or misplaced types, positional arrays,
   boolean/optional-field soup, expression-only wrappers, generic helpers without
   multiple real uses, and defenses without plausible producers or contracts.
5. Before extracting a helper, require a domain name, real duplication removed,
   external/serialization/framework boundary, reduced caller branching/nesting,
   or useful test seam. Do not extract a line merely to move it elsewhere.
6. For guards, fallbacks, normalization, or sanitization, identify the current
   producer, contract, observed failure, or boundary condition. If none exists
   and removal preserves behavior, recommend removing the defense. For one-use
   proxies, recommend inlining only when clearer and behavior-preserving. Keep
   helpers that carry a concept, boundary, dependency direction, expected
   variability, or useful test seam. Remove unsupported defense before inlining.
7. Return focused replacements. Explain the fields in the concept, existing
   shared type, invalidation rules, helper meaning, and directly testable invariant.
   Protocol proof should cover fields, stable ordering, nullish values, and
   required invalidation under the test portfolio policy.

A complete snapshot example: represent a submission with `kind: "submission"`,
`id`, `documentTypeId`, `updatedAtMs`, `requestId`, existing `SubmissionStatus`,
and `objectKey: string | null`. Build that typed object, then serialize all parts
in one named function. The reader sees the domain data before the string format.

A complete defense example: if repository evidence establishes that an admin-
provided connection string has no search parameters, remove the one-use helper
that parses it, clears `url.search`, and stringifies it; pass the configured
value directly. Keep normalization if meaningful provider parameters exist,
input crosses an untrusted boundary, or current callers depend on it.

Finish when concepts precede encoding, shared contracts reuse shared types,
protocol boundaries are named and proved, defenses are plausible, and helpers
pass both tests. Report meaningful evidence/direction changes during long reviews.
