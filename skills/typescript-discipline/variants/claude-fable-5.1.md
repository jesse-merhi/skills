---
name: typescript-discipline
description: 'Write or review TypeScript with shared types, boundary validation, safe narrowing, and verification.'
---

# TypeScript discipline

Complete the authorized TypeScript change at the real contract boundary. Batch
independent type, schema, and call-site reads. During long implementation,
report changed evidence or a completed validation checkpoint. Verify unfamiliar
library APIs from installed source. Prefer targeted edits and keep tests
proportional to requested behavior.

Use TypeScript to model the real contract. Prefer named types, validated
boundaries, and compiler-checked narrowing over casts or informal object shapes.

## Workflow

1. Reuse existing exported domain, schema, API/client, route, and module
   contract types before creating local ones.
2. Place types at the boundary where the concept belongs.
3. Apply the boundary and data-shape rules in
   [type-boundaries.md](references/type-boundaries.md).
4. Avoid unsafe typing using [unsafe-types.md](references/unsafe-types.md).
5. Before writing library/framework code, check installed versions and use
   current docs for that version. Prefer the remote Context7 workflow in
   [context7.md](references/context7.md) when its tools are available.
6. Verify with repo scripts using [verification.md](references/verification.md).

## Required discipline

- Do not use `any` without asking the user first.
- Do not add `@ts-ignore` or `@ts-expect-error` unless the user asks, and explain
  why in the comment.
- Model structured data first. Serialize strings, cache keys, and protocol
  values only at an explicit boundary.

## Context pointers

- Use [type-boundaries.md](references/type-boundaries.md) for shared/local type
  placement and data modeling.
- Use [unsafe-types.md](references/unsafe-types.md) for `any`, `unknown`,
  non-null assertions, casts, and TS comments.
- Use [verification.md](references/verification.md) for return types, package
  scripts, and monorepo checks.
