---
name: improve-codebase-architecture
description: 'Review architecture for module depth, interfaces, locality, dependencies, and testability.'
---

# Improve codebase architecture

Outcome: identify the smallest durable structural change that improves the work
the user asked for. This is a review lens; do not refactor unless implementation
is authorized.

Use the vocabulary in [language.md](references/language.md). For deepening
candidates, read [deepening.md](references/deepening.md). When the user wants
alternative interfaces for a chosen candidate, read
[interface-design.md](references/interface-design.md).

## Workflow

1. Scope before scanning. If the user names a module, subsystem, pain point, or
   direction, focus there. Otherwise inspect roughly the last 20 commit messages
   and weight the review toward code that changes repeatedly. Widen the scan
   only when recent changes show no useful hotspot.
2. Read the current code and tests in that scope before proposing structure.
3. Load user-provided project notes when available so domain language and prior
   decisions come from Obsidian instead of repo-local scratch docs.
4. Identify the behavior or change pressure causing the architectural concern.
5. Describe the current shape with concrete files and symbols.
6. Name the architectural smell only after showing evidence.
7. Propose one or two scoped changes, not a rewrite.
8. Explain the migration path and what tests would preserve behavior.
9. Ask before cross-cutting edits that touch more than a handful of files unless
   the user already requested that scope.

## Storage

Product repo files are read sources. Durable architecture notes, glossary terms,
ADR-style decisions, and planning notes belong in the user's Obsidian-backed
project notes when available.

Do not create or edit product-repo `CONTEXT.md`, `docs/adr/`, or architecture
report files unless the user explicitly asks for repo-local docs. If Obsidian
write access or the target path is unclear, return the note body and proposed
Obsidian path.

## Output

Lead with findings and concrete paths. Include:

- current shape
- pressure or risk
- recommended change
- files likely touched
- verification strategy
- durable note path when something should be stored in Obsidian

## Context pointers

- Use [language.md](references/language.md) for architecture vocabulary and
  principles.
- Use [questions-and-moves.md](references/questions-and-moves.md) for review
  questions and useful moves.
- Use [deepening.md](references/deepening.md) for deepening candidates.
- Use [interface-design.md](references/interface-design.md) for alternate
  interface designs.
