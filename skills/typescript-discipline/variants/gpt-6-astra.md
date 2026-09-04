---
name: typescript-discipline
description: 'Write or review TypeScript with shared types, boundary validation, safe narrowing, and verification.'
---

# TypeScript discipline

Use the existing domain model to make the requested TypeScript change precise.
Resolve ordinary type and documentation choices from repository evidence. Keep
a review read-only unless the user also requested a repair.

## Model at the owner

Search exported domain, schema, client, route, and module contracts first.
Apply [type-boundaries.md](references/type-boundaries.md) to choose shared versus
local ownership and derive related shapes. Preserve structured values until
serialization is actually required.

## Prove uncertain values

Follow [unsafe-types.md](references/unsafe-types.md). Narrow or validate
`unknown`, establish a cast's claim before using it, and fix a missing guard or
upstream type instead of asserting non-null. User approval is required for
`any`; suppression comments require a user request and an explanation. These
exceptions do not override a stricter repository rule.

## Use and verify the installed API

Inspect the dependency version before implementing its calls. Retrieve matching
official docs or source; [context7.md](references/context7.md) describes the
optional remote route and its no-local-helper boundary. Do not mistake a
configured integration for an available tool.

Complete the relevant repository checks in
[verification.md](references/verification.md), including dependent package builds
when needed. Broaden checks only for changed behavior or an unresolved concern.
Return the contract change, evidence, and remaining limitation without another
approval question for work already authorized.
