---
name: improve-codebase-architecture
description: 'Review or plan architecture changes around module depth, interfaces, adapters, locality, dependency direction, testability, and durable architecture notes.'
---

# Improve Codebase Architecture

Use this as an architectural review lens. Do not refactor by default; first
identify the smallest structural change that improves the work the user actually
asked for.

Use the vocabulary in [language.md](references/language.md). For deepening
candidates, read [deepening.md](references/deepening.md). When the user wants
alternative interfaces for a chosen candidate, read
[interface-design.md](references/interface-design.md).

## Workflow

1. Read the current code and tests before proposing structure.
2. Load user-provided project notes when available so domain language and prior
   decisions come from Obsidian instead of repo-local scratch docs.
3. Identify the behavior or change pressure causing the architectural concern.
4. Describe the current shape with concrete files and symbols.
5. Name the architectural smell only after showing evidence.
6. Propose one or two scoped changes, not a rewrite.
7. Explain the migration path and what tests would preserve behavior.
8. Ask before cross-cutting edits that touch more than a handful of files unless
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

## Context Pointers

- Use [language.md](references/language.md) for architecture vocabulary and
  principles.
- Use [questions-and-moves.md](references/questions-and-moves.md) for review
  questions and useful moves.
- Use [deepening.md](references/deepening.md) for deepening candidates.
- Use [interface-design.md](references/interface-design.md) for alternate
  interface designs.
