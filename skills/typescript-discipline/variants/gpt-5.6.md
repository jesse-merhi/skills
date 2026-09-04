---
name: typescript-discipline
description: 'Write or review TypeScript with shared types, boundary validation, safe narrowing, and verification.'
---

# TypeScript discipline

Express the real domain contract in types and prove it at runtime boundaries.
Reuse exported domain, schema, client, route, and module types before inventing
local shapes. Put shared concepts at their owning boundary; keep small private
implementation types local.

Use [type-boundaries.md](references/type-boundaries.md) for type placement,
derivation, and data modeling. Keep data structured until an explicit
serialization boundary. Apply [unsafe-types.md](references/unsafe-types.md):
validate or narrow `unknown`, prove casts, and replace non-null assertions with
guards or corrected upstream types. `any` requires user approval; suppression
comments require a user request and an explanation. Stricter repo rules still
apply.

Before using a library, inspect its installed version and the corresponding
official docs or source. If remote Context7 tools are available, follow
[context7.md](references/context7.md); a configuration entry alone is not proof
of availability, and no local helper or credentials should be installed.

Use the repository's checks through [verification.md](references/verification.md),
including monorepo build prerequisites and public return types. Report the
contract change and verification, or actionable review findings when editing
was not requested.
