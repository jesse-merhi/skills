---
name: typescript-discipline
description: 'Write or review TypeScript with shared types, boundary validation, safe narrowing, and verification.'
---

# TypeScript discipline

Keep the compiler's model aligned with the runtime contract.

1. Find existing domain, schema, API/client, route, and module types. Reuse or
   derive from those owners instead of duplicating their fields.
2. Apply [type-boundaries.md](references/type-boundaries.md). Name shared types
   at their boundary and small private types by their local role. Keep values
   structured until an explicit string, cache-key, or protocol boundary.
3. Apply [unsafe-types.md](references/unsafe-types.md) to each uncertain value.
   Validate or narrow `unknown`; use guards instead of non-null assertions;
   cast only after proving the narrower contract. Ask before `any`. Add a
   suppression comment only when requested, explaining its reason. Follow
   stricter repository prohibitions where present.
4. Before writing library code, read the installed version and retrieve its
   matching documentation. Batch independent lookups. Use callable remote
   Context7 through [context7.md](references/context7.md), or official docs and
   installed source; never install a local fallback or expose credentials.
5. Run the applicable repo scripts using
   [verification.md](references/verification.md). Check monorepo prerequisites
   before isolated package checks and annotate public return types where needed.

Finish the requested edit and verification without expanding it into unrelated
retyping. A review request returns findings rather than implementing them.
Explain the affected contract and observed check results in plain language.
