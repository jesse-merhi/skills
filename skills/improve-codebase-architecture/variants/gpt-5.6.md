---
name: improve-codebase-architecture
description: 'Review architecture for module depth, interfaces, locality, dependencies, and testability.'
---

# Improve codebase architecture

Identify the smallest structural improvement that addresses the user's actual
change pressure. This is a review lens, not default authority to refactor.

Scope to the named module, subsystem, pain point, or direction. If none is
named, inspect roughly the last 20 commit messages and prioritize repeatedly
changed code; widen only when that reveals no useful hotspot. Read current code,
tests, and available user-provided Obsidian project notes before proposing changes.

Use [language.md](references/language.md) for vocabulary and
[questions-and-moves.md](references/questions-and-moves.md) for the lens.
For deepening candidates read [deepening.md](references/deepening.md).
For requested alternative interfaces, use its dependency categories and then
[interface-design.md](references/interface-design.md).

Show the current files and symbols, establish the behavior or pressure, then
name the architectural smell. Recommend one or two scoped changes with migration
and behavior-preserving tests. Ask before cross-cutting edits touching more than
a handful of files unless that scope was already requested.

Lead with concrete findings and paths. Include current shape, pressure/risk,
recommended change, likely touched files, and verification strategy. Durable
architecture notes, glossary entries, ADRs, and plans belong in the user's
Obsidian project notes when available. Product-repo `CONTEXT.md`, `docs/adr/`, or
architecture reports require an explicit request. If Obsidian access or destination
is unclear, return the note body and proposed path instead. Include the durable
note path whenever a note is saved or proposed.
