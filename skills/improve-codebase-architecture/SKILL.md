---
name: improve-codebase-architecture
description: 'Review or plan architecture changes around module depth, interfaces, adapters, locality, dependency direction, testability, and durable architecture notes.'
---

# Improve Codebase Architecture

Use this as an architectural review lens. Do not refactor by default;
first identify the smallest structural change that improves the work
the user actually asked for.

Use the vocabulary in [LANGUAGE.md](./LANGUAGE.md). For deepening
candidates, read [DEEPENING.md](./DEEPENING.md). When the user wants
alternative interfaces for a chosen candidate, read
[INTERFACE-DESIGN.md](./INTERFACE-DESIGN.md).

## Storage

Product repo files are read sources. Durable architecture notes,
glossary terms, ADR-style decisions, and planning notes belong in
the user's Obsidian-backed project notes when available.

Do not create or edit product-repo `CONTEXT.md`, `docs/adr/`, or
architecture report files unless the user explicitly asks for repo-local
docs. If Obsidian write access or the target path is unclear, return the
note body and proposed Obsidian path.

## Questions

- Can a future change be made near the concept it changes?
- Does the module expose a small interface over meaningful internal
  complexity, or does every caller need to understand its internals?
- Are domain decisions centralized, or copied across call sites?
- Do dependencies point from policy to detail, or has detail leaked
  upward into core workflow code?
- Are names carrying domain meaning, or just restating mechanics?
- Can the behavior be tested without constructing the whole app?
- Is the pain real in this codebase, or only a preference?

## Process

1. Read the current code and tests before proposing structure.
2. Load user-provided project notes when available so domain language and
   prior decisions come from Obsidian instead of repo-local scratch docs.
3. Identify the behavior or change pressure causing the architectural
   concern.
4. Describe the current shape with concrete files and symbols.
5. Name the architectural smell only after showing evidence.
6. Propose one or two scoped changes, not a rewrite.
7. Explain the migration path and what tests would preserve behavior.
8. Ask before cross-cutting edits that touch more than a handful of
   files unless the user already requested that scope.

## Useful Moves

- Move policy decisions closer to the domain boundary.
- Split orchestration from pure transformation when that improves
  testability.
- Introduce a type or discriminated union when it removes impossible
  states.
- Collapse shallow pass-through wrappers that add vocabulary without
  hiding complexity.
- Prefer one deep module over several thin files that must be opened
  together to understand one concept.
- If a decision should be remembered, propose an Obsidian note instead of
  a product-repo ADR.

## Output

Lead with findings and concrete paths. Include:

- current shape
- pressure or risk
- recommended change
- files likely touched
- verification strategy
- durable note path when something should be stored in Obsidian
