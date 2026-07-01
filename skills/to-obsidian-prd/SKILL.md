---
name: to-obsidian-prd
description: 'Turn product ideas, planning notes, or rough feature requests into scoped PRD notes in Obsidian instead of GitHub Issues.'
---

# To Obsidian PRD

Create small PRDs that are useful working documents, not broad up-front
specifications.

## Workflow

1. Gather source context: current conversation, linked repo docs or notes,
   user-provided project notes, existing Obsidian notes, and code paths if
   implementation constraints are already known.
2. Search/read related Obsidian notes when available so terminology, prior
   decisions, and folder conventions match the user's vault. If the connection
   is read-only, use it for grounding and produce markdown plus the proposed
   path.
3. Draft one narrow PRD. If the idea is broad, split it into multiple PRDs or
   recommend `to-obsidian-slices`.
4. Use project glossary language and respect ADR-style decisions from Obsidian
   notes or checked-in docs.
5. If implementation work is likely, sketch the modules and interfaces that may
   change.
6. For frontend UI work, capture the design direction and rendered validation
   bar from [frontend-prd.md](references/frontend-prd.md) before publishing.
7. Capture implementation and testing decisions when they are already known. If
   the user is present and these choices matter, ask them to confirm the module
   shape, testing focus, and UI validation focus before publishing.
8. Make open questions explicit. Do not hide uncertainty in polished prose.
9. When the PRD is likely to become implementation work, make the acceptance
   criteria slice-ready: each later slice should be able to carry ordered
   `pre-plan`, `implementation`, and `verification` todos.
10. Publish to Obsidian only when write access is enabled and the target path is
    clear. Otherwise return the note body and proposed path.
11. Do not write PRDs into the product repo unless the user explicitly asks for
    repo-local docs.

## Context Pointers

- Use [note-template.md](references/note-template.md) for the PRD note body.
- Use [frontend-prd.md](references/frontend-prd.md) for rendered UI design and
  validation requirements.
- Use [naming.md](references/naming.md) for vault-relative note paths.
