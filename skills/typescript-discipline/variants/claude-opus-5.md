---
name: typescript-discipline
description: 'Write or review TypeScript with shared types, boundary validation, safe narrowing, and verification.'
---

# TypeScript discipline

Apply shared types, validated boundaries, and safe narrowing to the requested
TypeScript scope. When loaded as an implementation or review lens, return
findings or edits to the owning workflow without separate user-facing progress
or a final verdict. On direct use, lead with the contract change and observable
effect.

Create no standalone report; saved output is the authorized code and its
existing tests. Run only the package checks selected by the verification
reference and affected scope, without a generic recheck. Keep type-boundary
judgment in the current context and do not delegate it.

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
