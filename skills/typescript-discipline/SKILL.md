---
name: typescript-discipline
description: 'Write or review TypeScript production code, shared domain types, schemas, API/client contracts, exported functions, typed React, casts, any/unknown, ts-ignore, narrowing, and package-script verification.'
---

# TypeScript Discipline

Use TypeScript to model the real contract. Prefer named types,
validated boundaries, and compiler-checked narrowing over casts or
informal object shapes.

## Type Boundaries

- Reuse existing exported domain, schema, API/client, route, and module
  contract types before creating local ones.
- Put a type at the boundary where the concept belongs when it crosses
  modules or packages.
- Keep tiny implementation-detail types local, but name them after the
  role they play.
- Derive related types with `typeof`, `ReturnType<T>`, mapped types,
  `Pick`, or `Omit` instead of copying fields by hand.

## Unsafe Types

- Do not use `any` without asking the user first.
- Treat `unknown` as boundary data. Validate or narrow it immediately,
  then convert it into a named type before normal app code sees it.
- Avoid non-null assertions. Add the guard or fix the upstream type.
- Avoid `as` casts unless the code has already proved the narrower type.
- Do not add `@ts-ignore` or `@ts-expect-error` unless the user asks,
  and explain why in the comment.

## Data Shape

- Prefer discriminated unions for meaningful states.
- Use `as const` for literal inference.
- Validate external data at runtime boundaries with the repo's schema
  tool, usually Zod or an existing equivalent.
- Model structured data first. Serialize strings, cache keys, and
  protocol values only at an explicit boundary.

## Functions And Verification

- Let obvious local helpers infer return types.
- Add explicit return types to exported functions and public API
  boundaries.
- Before reaching for `npx`, inspect `package.json` and use the repo's
  scripts for typecheck, lint, test, or build.
- In monorepos, check for project-reference scripts before running a
  package typecheck directly. A referenced package may need to build
  first.

## Library Code

Before writing code against a library or framework, check the installed
version in `package.json`, then use current docs such as Context7 or the
project's official docs for that version.
