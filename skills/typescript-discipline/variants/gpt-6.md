---
name: typescript-discipline
description: 'Write or review TypeScript with shared types, boundary validation, safe narrowing, and verification.'
---

# TypeScript discipline

- Import domain, schema, API, client and route types from their owners; keep one-use types local.
- Derive related types with schema inference, `typeof`, `ReturnType`, `Pick` or `Omit`, not copied field lists or clever one-off generics.
- Treat external input as `unknown`. Parse HTTP responses, request bodies, storage, configuration and messages at trust boundaries with the installed schema library (such as Zod or Effect Schema). Use the parsed value and inferred type, not a cast of the input.
- Validate relied-on constraints, not only outer shape. Handle parse failures; do not revalidate trusted forwarding values or install another schema library without approval.
- Use discriminated unions for states with different data. Distinguish missing, null and empty values when the contract does. Keep data structured until an explicit serialization boundary.
- Use clear names and object parameters for confusing positional arguments; prefer plain branches to dense transformations.
- Narrow with runtime checks, not wishful `as` casts. Replace non-null assertions with guards or corrected upstream types; justify necessary assertions.
- Do not use `any` without explicit approval; stricter repository bans still apply. Do not add `@ts-ignore`, `@ts-expect-error` or other suppressions unless requested, with the reason explained.
- Use `satisfies` to check a contract without discarding useful inference and `as const` for literal inference. Neither validates runtime input. Use `readonly` for non-mutating inputs; it does not freeze values at runtime.
- Infer obvious local returns; declare public/exported returns. Use type-only imports where expected. Handle nullable/indexed values and exhaust meaningful unions.
- Await promises. For background work, use project task/lifecycle patterns for completion, failure and shutdown. Catch errors where callers can retry, return an error or report failure; never silently succeed.
- Check the installed library version and its matching source or official documentation before using unfamiliar APIs.
- Use repository scripts for typecheck, lint, tests and builds. Check monorepo project-reference prerequisites before running a package in isolation. Keep compiler, lint and formatting settings unchanged unless that is the task.
