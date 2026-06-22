---
name: reducing-cognitive-load
description: 'Review dense, clever, stringly typed, weakly typed, over-abstracted, or hard-to-read code, especially data flows and type boundaries.'
---

# Reducing Cognitive Load

Use this skill to make code easier to read without turning it into a
maze of tiny wrapper functions. The goal is not "more abstraction"; the
goal is a smaller mental stack for the next maintainer.

## Core Rule

Prefer code that exposes domain concepts, invariants, and data shapes.
Avoid code that makes readers reverse-engineer hidden protocols,
positional fields, duplicated types, or clever inline transformations.

## Before Writing Code

1. Look for existing domain types, schemas, API response types, route
   types, and shared model types before inventing a local type.
2. If a type will cross module boundaries, be consumed by multiple
   modules, or encode a domain concept, define or reuse it at the
   boundary where that concept belongs.
3. If a local type is only for a tiny implementation detail, keep it
   local, but name it after the role it plays.
4. If data is serialized into a string, array, or hash, model the
   structured data first and serialize once at an explicit boundary.

## Red Flags

- Anonymous string protocols such as delimiter-joined snapshot keys,
  cache keys, sync keys, or audit keys.
- Long inline `map` / `filter` / `reduce` chains that encode domain
  rules inside formatting code.
- Local types that duplicate an existing exported type with a different
  name or subtly different optional fields.
- Types declared beside one file's implementation even though they are
  part of a contract used elsewhere.
- Positional arrays or tuple-ish strings where the order and meaning of
  fields must be memorized.
- Boolean or optional-field soup instead of a named state or
  discriminated union.
- Helper functions that merely hide one expression without naming a real
  concept, invariant, boundary, or test seam.
- Generic helpers introduced before there are multiple real call sites.

## What To Do Instead

- Reuse existing exported types where they already describe the concept.
- Promote a type to a shared module when it is a contract between
  modules, not an implementation detail.
- Add or reuse explicit types for multi-field domain data instead of
  leaving it as anonymous object literals, positional arrays, or strings.
- Use discriminated unions for domain states and typed objects for
  multi-field identity, freshness, or signature data.
- Give serialization code a named boundary such as
  `createSnapshotSignature(parts)` or `toCacheKey(input)`.
- Keep the call site readable: the reader should see what concept is
  being built before seeing how it is encoded.
- Add targeted tests for protocols: included fields, stable ordering,
  nullish handling, and changes that must invalidate the signature.

## Extraction Test

Extract a helper only when at least one is true:

- The name captures a domain concept the caller should think in.
- It removes meaningful duplication across real call sites.
- It isolates an external boundary, serialization format, or framework
  quirk.
- It lowers branching or nesting at the caller.
- It creates a useful test seam for behavior that deserves direct tests.

Do not extract when the helper only makes the reader jump elsewhere to
understand a single line.

## Snapshot / Cache Key Pattern

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

## Review Checklist

When reviewing a diff, call out code that forces a maintainer to ask:

- What fields are part of this concept, and why?
- Is this local type duplicating something that already exists?
- Should this type be shared because another module depends on it?
- What changes should invalidate this key, snapshot, or derived value?
- Is the helper naming a domain idea, or just hiding code?
- Can I test the invariant directly, or is it trapped in inline glue?

Prefer concrete rewrites over vague "make this cleaner" comments.
