---
name: to-spec
description: 'Turn the current conversation into a spec and publish it to Obsidian Specs. Use after grilling has already resolved the important decisions.'
---

# To Spec

This skill takes the current conversation context and codebase understanding and
produces a spec. Do not interview the user; synthesize what has already been
discussed. The user may know this artifact as a PRD.

Publish specs to Obsidian. If the vault is unavailable or the target path is
unclear, return the Markdown body and proposed `Specs/` path.

## Workflow

1. Explore the repo to understand the current state of the codebase, if you
   have not already. Use the project's glossary vocabulary throughout the spec,
   and respect ADRs or Obsidian decisions in the area you are touching.
2. Search/read related Obsidian specs, issues, and notes when available so
   terminology, prior decisions, and folder conventions match the vault.
3. Sketch out the seams at which the feature will be tested. Existing seams
   should be preferred to new ones. Use the highest seam possible. If new seams
   are needed, propose them at the highest point you can. The fewer seams across
   the codebase, the better; the ideal number is one.
4. Check with the user that these seams match their expectations when the seam
   choice is not already settled.
5. For frontend UI work, capture the design direction and rendered validation
   bar from [frontend-spec.md](references/frontend-spec.md) before publishing.
6. Write the spec using [note-template.md](references/note-template.md).
7. Publish to Obsidian `Specs/` using [naming.md](references/naming.md). If
   write access is missing, return the Markdown body and proposed path.
8. Do not write specs into the product repo unless the user explicitly asks for
   repo-local docs.
9. Avoid brittle file-path inventories and code snippets. Exception: if a
   prototype produced a snippet that encodes a decision more precisely than
   prose can, inline the decision-rich part and name or link the prototype.

## Context Pointers

- Use [note-template.md](references/note-template.md) for the spec note body.
- Use [frontend-spec.md](references/frontend-spec.md) for rendered UI design and
  validation requirements.
- Use [naming.md](references/naming.md) for vault-relative note paths.
