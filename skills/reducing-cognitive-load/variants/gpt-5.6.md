---
name: reducing-cognitive-load
description: 'Review dense, clever, stringly typed, weakly typed, over-abstracted, or hard-to-read code.'
---

# Reducing cognitive load

Reduce the mental stack needed to understand code by exposing domain concepts,
invariants, and data shapes. More helpers or abstractions are not the goal.
Review-only work recommends concrete changes; refactor only when authorized.

Find existing domain, schema, API-response, route, and shared model types before
creating another. Cross-module contracts, multiply consumed shapes, and domain
concepts belong at the shared boundary; tiny implementation details may be local.
Model multi-field data as typed objects or discriminated states before encoding
it, then serialize once at a named boundary such as `createSnapshotSignature(parts)`
or `toCacheKey(input)`.

Inspect delimiter-joined identities, long inline transformations hiding domain
rules, duplicated/local contract types, positional arrays, boolean/optional-field
soup, one-expression wrappers, speculative generic helpers, and unsupported
guards/fallbacks/normalization/sanitization. Show what concept is built before
how it is encoded. For example, model a submission snapshot with `kind`, `id`,
`documentTypeId`, `updatedAtMs`, `requestId`, `status`, and nullable `objectKey`
using the existing `SubmissionStatus`, then serialize all parts in one named
function rather than an anonymous delimiter-joined template string.

Extract a helper only if it names a domain concept, removes meaningful duplication
at real call sites, isolates an external/serialization/framework boundary,
reduces caller branching/nesting, or creates a useful test seam. Do not make
readers jump elsewhere merely to understand one expression.

For changed defenses, establish a plausible current producer, contract, observed
failure, or boundary condition. Report unsupported defense when removal preserves
current behavior. For a one-use forward/convert/light-transform proxy, recommend
inlining only when it preserves behavior and improves the caller; retain domain
meaning, boundaries, dependency direction, expected variability, and useful seams.
Remove an implausible defense before inlining its remaining proxy.

Example: if repo evidence proves an admin connection string has no search
parameters, a helper that parses it, clears `url.search`, and serializes it adds
unsupported defense and indirection. Pass the configured value directly. Preserve
the helper if the provider supports meaningful parameters, input is untrusted,
or current callers rely on normalization.

Report specific replacements answering: which fields belong, whether a type
already exists or must be shared, what invalidates a key/snapshot, whether a
helper names a concept, and whether its invariant can be tested directly.
Relevant protocols need targeted proof for included fields, stable order,
nullish handling, and invalidation; apply the test portfolio policy before tests.
Finish with visible domain shape, reused shared contracts, named/tested protocol
boundaries, plausible defenses, and helpers that pass extraction/proxy checks.
