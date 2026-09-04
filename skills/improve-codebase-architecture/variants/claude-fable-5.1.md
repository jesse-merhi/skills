---
name: improve-codebase-architecture
description: 'Review architecture for module depth, interfaces, locality, dependencies, and testability.'
---

# Improve codebase architecture

Review architecture and recommend a small structural improvement. Do not
refactor unless the user authorized implementation.

1. Choose the scope before scanning. Use the named module, subsystem, pain point,
   or direction. Otherwise inspect about 20 recent commit messages and focus on
   code that changes repeatedly. Widen only if there is no useful hotspot.
2. Read the scoped code and tests plus available user-provided Obsidian project
   notes. Batch independent reads. Use existing domain terms and prior decisions.
   Verify unfamiliar framework behavior against current sources.
3. Read [language.md](references/language.md) and use
   [questions-and-moves.md](references/questions-and-moves.md). For deepening,
   read [deepening.md](references/deepening.md). For requested alternate
   interfaces, read its dependency categories before
   [interface-design.md](references/interface-design.md).
4. Establish the behavior or change pressure. Show concrete files and symbols
   before naming a smell. Review the whole relevant structure before concluding.
5. Propose one or two scoped changes, with likely files, migration steps, and
   tests that preserve behavior. Cross-cutting edits touching more than a handful
   of files require a question unless the user already requested that scope.
6. Lead the report with findings. Include current shape, pressure/risk,
   recommendation, affected files, and verification. During a long review,
   report meaningful evidence or direction changes.

Store durable architecture, glossary, ADR, and planning notes in the user's
Obsidian-backed project when available. Treat product-repo files as read sources:
creating or editing `CONTEXT.md`, `docs/adr/`, or architecture reports requires
an explicit repo-documentation request. If the Obsidian path or write access is
unclear, supply the note body and proposed path. Include the durable note path
in the report whenever a note is saved or proposed.
