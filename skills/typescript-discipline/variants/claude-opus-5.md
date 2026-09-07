---
name: typescript-discipline
description: 'Write or review TypeScript with shared types, boundary validation, safe narrowing, and verification.'
---

# TypeScript discipline

- Import domain, schema, API, client and route types from the module that defines them instead of redeclaring their fields. Keep types used by only one implementation local.
- Derive related types from the owner with schema inference, `typeof`, `ReturnType`, `Pick` or `Omit`. Do not copy field lists or build clever generics for one ordinary shape.
- Treat external input as `unknown`. Parse HTTP responses, request bodies, storage, configuration and messages at their real trust boundaries using the project's installed schema library, such as Zod or Effect Schema. Use the parsed value and its inferred type, not a cast of the original input.
- Validate constraints the application relies on, not just the outer object shape. Handle parse failures deliberately. Do not revalidate trusted internal values in forwarding wrappers or install a second schema library without approval.
- Use discriminated unions for states with different data. Distinguish missing, null and empty values when the contract does. Keep data structured until an explicit serialization boundary.
- Use meaningful names and object parameters when positional arguments are easy to confuse. Prefer straightforward branches to dense transformations.
- Narrow with runtime checks, not wishful `as` casts. Replace non-null assertions with a guard or a corrected upstream type. Necessary assertions need evidence that the narrower type holds.
- Do not use `any` without explicit approval; stricter repository bans still apply. Do not add `@ts-ignore`, `@ts-expect-error` or other suppressions unless requested, with the reason explained.
- Use `satisfies` to check a contract without discarding useful inference and `as const` for literal inference. Neither validates runtime input. Use `readonly` for non-mutating inputs; it does not freeze values at runtime.
- Let obvious local helpers infer return types; declare exported and public return types. Use type-only imports where the project expects them. Handle nullable/indexed values and exhaust meaningful unions.
- Await promises. For background work, use the project's task or resource-lifecycle pattern to handle completion, failure, and shutdown. Catch an error where the caller can retry, return an error result, or report the failure; do not silently return success.
- Check the installed library version and its matching source or official documentation before using unfamiliar APIs.
- Use repository scripts for typecheck, lint, tests and builds. Check monorepo project-reference prerequisites before running a package in isolation. Keep compiler, lint and formatting settings unchanged unless that is the task.
