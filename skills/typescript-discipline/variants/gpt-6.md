---
name: typescript-discipline
description: 'Write or review TypeScript with shared types, boundary validation, safe narrowing, and verification.'
metadata:
  license: Preserve the HumanLayer notice in [LICENSE](LICENSE) when redistributing the adapted React guidance.
  sources: |
    - adapted from [narrow-react-prop-types](https://github.com/humanlayer/skills/blob/ca7c8088db69e315a8b2deea43820270457f8f3c/plugins/narrow-react-prop-types/skills/narrow-react-prop-types/SKILL.md) — deriving React prop types from callers while preserving supported public APIs.
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

## React prop contracts

When simplifying a component's props, establish what its callers need before narrowing types.

- Find component and prop-type usages through imports, re-exports, wrappers and dynamic registrations. Read consuming apps/packages and documented contracts. Separate application callers from stories, fixtures and mocks. Local usage alone cannot prove an exported public prop is unused externally.
- Require an internal prop when supported callers guarantee it. Keep omission for supported defaults, loading, permission or read-only states. A supplied nullable value differs from an omitted prop; preserve empty arrays and other valid values.
- If an enabled control needs a callback to act, its contract must supply one. A read-only variant may instead hide or disable that action. Do not require every callback merely because all inspected callers currently pass it.
- Keep parent and child contracts consistent. Remove optional calls and fallbacks only after proving their states unsupported. Preserve public contracts unless their change is authorized; report consumers you could not inspect.
- Make stories, mocks and fixtures satisfy the supported contract; keep convenience defaults in support code. Preserve coverage of supported states. A simpler fixture is no reason to weaken production types.
- Run existing typechecks for the changed package and consuming apps/packages. Check affected interactions and supported states with relevant coverage; types alone cannot prove controls act correctly. Report unchecked consumers and behavior.

For example, if internal callers always supply items, selection and a handler:

```ts
type Props = {
  items: readonly Item[];
  selectedId: Item["id"] | null;
  onSelect: (id: Item["id"]) => void;
};
```

Missing data or a handler is then a type error. An empty list and no selection are still valid. Use `onSelect(id)` for the enabled action; stories supply a handler too.
