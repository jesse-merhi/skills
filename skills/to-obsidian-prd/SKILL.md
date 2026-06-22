---
name: to-obsidian-prd
description: 'Turn product ideas, planning notes, or rough feature requests into scoped PRD notes in Obsidian instead of GitHub Issues.'
---

# To Obsidian PRD

Create small PRDs that are useful working documents, not broad
up-front specifications.

## Workflow

1. Gather source context:
   - current conversation
   - linked repo docs or notes
   - user-provided project notes when available
   - existing Obsidian notes when available
   - code paths if implementation constraints are already known
2. Search/read related Obsidian notes when available so terminology,
   prior decisions, and folder conventions match the user's vault. If
   the connection is read-only, use it for
   grounding and produce markdown plus the proposed path.
3. Draft one narrow PRD. If the idea is broad, split it into multiple
   PRDs or recommend `to-obsidian-slices`.
4. Use project glossary language and respect ADR-style decisions from
   Obsidian notes or checked-in docs. If implementation work is
   likely, sketch the modules and interfaces that may change.
5. For frontend UI work, capture the design direction and rendered
   validation bar before publishing:
   - use `impeccable` language for audience/register, mode, tone,
     structure, tokens, anti-references, and likely visual risk
   - include acceptance criteria for the important states and viewports
   - include `frontend-ui-validation` proof expected during review:
     screenshots, layout-audit output, console checks, or traces
6. Capture implementation and testing decisions when they are already
   known. If the user is present and these choices matter, ask them to
   confirm the module shape, testing focus, and UI validation focus
   before publishing.
7. Make open questions explicit. Do not hide uncertainty in polished
   prose.
8. When the PRD is likely to become implementation work, make the
   acceptance criteria slice-ready: each later slice should be able to
   carry ordered `pre-plan`, `implementation`, and `verification` todos.
9. Publish to Obsidian only when write access is enabled and the target
   path is clear. Otherwise return the note body and proposed path. Do
   not write PRDs into the product repo unless the user explicitly asks
   for repo-local docs.

## Note Shape

Use this structure:

```md
# PRD: <Outcome>

Status: Draft
Type: PRD
Created: <YYYY-MM-DD>

## Outcome
<One or two sentences describing the user/system outcome.>

## Problem
<What pain or opportunity this addresses.>

## Scope
Included:
- <included behavior>

Excluded:
- <explicit non-goal>

## User Flow
1. <step>

## Acceptance Criteria
- <observable criterion>
- <for frontend UI work: viewport/state criterion that can be
  proven visually or by layout audit>

## Implementation Decisions
- <modules, interfaces, schema/API contracts, or sequencing decisions already agreed>
- <for frontend UI work: audience, mode, tone, structure, tokens, and
  likely visual risk>
- <avoid brittle file-path lists unless a path is necessary for execution>

## Testing Decisions
- <behavior to test through public interfaces>
- <test level or prior-art test path when known>
- <for frontend UI work: required `frontend-ui-validation` evidence
  such as mobile/desktop screenshots, layout audit, console check, or
  trace>
- <what does not need dedicated coverage>

## Open Questions
- <decision still needed>

## Technical Notes
- <known constraints, code paths, or dependencies>
- <implementation sequencing notes that should become phase-gated slices>

## Related
- [[related note]]
```

## Naming

Prefer vault-relative paths like:

```text
PRDs/YYYY-MM-DD-short-outcome.md
```

If the vault already has a project-specific folder, follow that folder's
convention instead.
