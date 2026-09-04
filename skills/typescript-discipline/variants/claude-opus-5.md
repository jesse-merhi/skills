---
name: typescript-discipline
description: 'Write or review TypeScript with shared types, boundary validation, safe narrowing, and verification.'
---

# TypeScript discipline

Deliver the requested TypeScript work with one accurate domain contract. Keep
unrelated type cleanup outside the assignment.

## Contract and boundaries

Reuse existing exported domain, schema, client, route, and module types. Put a
cross-module concept at its owner and retain tiny private types locally.
[type-boundaries.md](references/type-boundaries.md) covers derivation and modeling;
keep structured data intact until an explicit serialization boundary.

Use [unsafe-types.md](references/unsafe-types.md) for uncertain values. Runtime
validation and narrowing must establish `unknown` values before normal app code
uses them. Prefer guards to non-null assertions and prove any narrowing cast.
`any` needs approval; suppression comments need a user request and a reason.
Honor stronger repository constraints.

## API evidence and completion

Check the installed dependency version and its actual API before coding. Use
[context7.md](references/context7.md) only with callable remote tools; otherwise
read official docs or installed source. Do not install a documentation helper
or copy its credentials.

The repository checks in [verification.md](references/verification.md) provide
the required compiler, lint, build, and test evidence, including monorepo
prerequisites. Avoid additional generic verification rounds. In review mode,
collect genuine contract defects before filtering the report; do not silently
fix them. Keep the result focused on the contract and evidence.
