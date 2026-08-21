# Type boundaries and data shape

## Type boundaries

- Reuse existing exported domain, schema, API/client, route, and module contract
  types before creating local ones.
- Put a type at the boundary where the concept belongs when it crosses modules
  or packages.
- Keep tiny implementation-detail types local, but name them after the role they
  play.
- Derive related types with `typeof`, `ReturnType<T>`, mapped types, `Pick`, or
  `Omit` instead of copying fields by hand.

## Data shape

- Prefer discriminated unions for meaningful states.
- Use `as const` for literal inference.
- Validate external data at runtime boundaries with the repo's schema tool,
  usually Zod or an existing equivalent.
- Model structured data first. Serialize strings, cache keys, and protocol
  values only at an explicit boundary.
