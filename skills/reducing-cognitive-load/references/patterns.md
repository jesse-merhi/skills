# Patterns

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

## Snapshot / cache key pattern

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
