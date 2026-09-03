---
name: reducing-cognitive-load
description: 'Review dense, clever, stringly typed, weakly typed, over-abstracted, or hard-to-read code.'
---

# Reducing cognitive load

Review the complete relevant code path before recommending simplification.
Batch independent type, contract, and call-site reads. During a long review,
report only a change in evidence or direction. Prefer literal names and concrete
targeted rewrites. Apply a refactor only when implementation is authorized.

Use this skill to make code easier to read without turning it into a maze of
tiny wrapper functions. The goal is not "more abstraction"; the goal is a
smaller mental stack for the next maintainer.

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
4. Scan for the red flags in [Red flags](#red-flags).
5. In review-only work, recommend concrete replacement patterns from
   [Patterns](#patterns). Apply them only when refactoring is authorized.
6. Use the extraction test in [Extraction test](#extraction-test) before adding
   helper functions.
7. When reviewing a diff, use [Review checklist](#review-checklist) and prefer
   concrete rewrites over vague "make this cleaner" comments.

## Completion criteria

- The code exposes the domain concept before the encoding detail.
- Shared contracts use shared types instead of duplicated local shapes.
- Serialization boundaries have names and tests when the protocol matters.
- Defensive code passes the plausibility test; helpers pass the extraction and
  proxy tests.
- The reader can see what is being built before studying how it is encoded.

## Red flags

- Anonymous string protocols such as delimiter-joined snapshot keys, cache keys,
  sync keys, or audit keys.
- Long inline `map` / `filter` / `reduce` chains that encode domain rules inside
  formatting code.
- Local types that duplicate an existing exported type with a different name or
  subtly different optional fields.
- Types declared beside one file's implementation even though they are part of a
  contract used elsewhere.
- Positional arrays or tuple-ish strings where the order and meaning of fields
  must be memorized.
- Boolean or optional-field soup instead of a named state or discriminated
  union.
- Helper functions that merely hide one expression without naming a real
  concept, invariant, boundary, or test seam.
- Generic helpers introduced before there are multiple real call sites.
- Guards, fallbacks, normalization, or sanitization for states with no plausible
  producer, documented contract, observed failure, or boundary condition.

## Patterns

- Reuse existing exported types where they already describe the concept.
- Promote a type to a shared module when it is a contract between modules, not
  an implementation detail.
- Add or reuse explicit types for multi-field domain data instead of leaving it
  as anonymous object literals, positional arrays, or strings.
- Use discriminated unions for domain states and typed objects for multi-field
  identity, freshness, or signature data.
- Give serialization code a named boundary such as `createSnapshotSignature(parts)`
  or `toCacheKey(input)`.
- Keep the call site readable: the reader should see what concept is being built
  before seeing how it is encoded.
- Add targeted tests for protocols: included fields, stable ordering, nullish
  handling, and changes that must invalidate the signature.

### Snapshot / cache key pattern

Avoid:

```ts
const part = `submission:${submission.id}:${submission.documentTypeId}:${submission.updatedAt.getTime()}:${submission.requestId}:${submission.status}:${submission.objectKey ?? ""}`;
```

Prefer:

```ts
type SnapshotPart =
  | {
      kind: "submission";
      id: string;
      documentTypeId: string;
      updatedAtMs: number;
      requestId: string;
      status: SubmissionStatus;
      objectKey: string | null;
    };

const part: SnapshotPart = {
  kind: "submission",
  id: submission.id,
  documentTypeId: submission.documentTypeId,
  updatedAtMs: submission.updatedAt.getTime(),
  requestId: submission.requestId,
  status: submission.status,
  objectKey: submission.objectKey ?? null,
};
```

Then serialize all parts in one named function. The string format is an
implementation detail; the structured type is what reviewers and future
maintainers should reason about.

## Extraction test

Extract a helper only when at least one is true:

- The name captures a domain concept the caller should think in.
- It removes meaningful duplication across real call sites.
- It isolates an external boundary, serialization format, or framework quirk.
- It lowers branching or nesting at the caller.
- It creates a useful test seam for behavior that deserves direct tests.

Do not extract when the helper only makes the reader jump elsewhere to
understand a single line.

## Review checklist

When reviewing a diff, call out code that forces a maintainer to ask:

- What fields are part of this concept, and why?
- Is this local type duplicating something that already exists?
- Should this type be shared because another module depends on it?
- What changes should invalidate this key, snapshot, or derived value?
- Is the helper naming a domain idea, or just hiding code?
- Can I test the invariant directly, or is it trapped in inline glue?

Prefer concrete rewrites over vague "make this cleaner" comments.

### Plausibility test

For each changed guard, fallback, normalization, or sanitization, identify a
current producer, contract, observed failure, or boundary condition that can
plausibly trigger it. Report the code when no such evidence exists and removing
it preserves current behavior. "Just in case" is not evidence.

### Proxy test

Report a one-use helper that only forwards, converts, or lightly transforms a
value when inlining it preserves behavior and makes the caller easier to read.
Keep the helper when it names a domain concept, preserves a boundary or
dependency direction, handles expected variability, or creates a useful test
seam. A hypothetical future call site is not duplication.

If a proxy helper exists only to defend an implausible state, recommend removing
the defense before inlining the remaining work.

### Example

For example, if repository evidence shows an admin-provided connection string
does not contain search parameters, a one-use helper that parses the string,
clears `url.search`, and converts it back to a string adds unsupported defense
and indirection. Recommend removing the query cleanup and passing the configured
value directly. Preserve the helper when the provider supports meaningful query
parameters, the input crosses an untrusted boundary, or current callers rely on
the normalization.
