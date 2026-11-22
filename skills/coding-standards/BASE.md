---
name: coding-standards
description: 'Read engineering expectations before implementation or review. Apply, sync, or translate repository enforcement only when explicitly requested.'
---

# Coding standards

Read expectations by default; enforcement modes run only on explicit request. The shared coding standards principles govern.

## Read expectations

Read [principles.md](principles.md) in full, including unenforced standards. When reading a prompt directly under `variants/`, find the sheet one directory up. Apply relevant principles and read the target's scoped agent guidance and `lint/standards/ADOPTION.md` if present. Preserve project exceptions; a missing adoption record does not block this mode.

Use relevant expectations during implementation. During review, assess changed behavior and report relevant ids, evidence, exceptions and verification gaps. Apply the review workflow's findings criteria to supported violations; a missing linter or style preference alone is not a finding. Do not claim unassessed compliance.

Read expectations does not install tools, change configuration, create adoption records, sync files or authorize unrelated repairs. Return to the calling task. Shared-catalog edits use [catalog-format.md](references/catalog-format.md).

## Enforcement requests

Use `catalog.json` as the authoritative source for enforcement. Only when the user explicitly asks to apply, sync or translate enforcement, read [enforcement.md](references/enforcement.md) and [adoption.md](references/adoption.md), then the mode's reference: [apply.md](references/apply.md) for apply and sync, [sync.md](references/sync.md) for sync, and [translate.md](references/translate.md) for translation or an unrepresented ecosystem. For the `tailwind-v4` preset, also read the [design-system integration guidance](README.md#tailwind-v4-design-system-checks).
