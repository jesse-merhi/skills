---
name: improve-codebase-architecture
description: 'Review architecture for module depth, interfaces, locality, dependencies, and testability.'
---

# Improve codebase architecture

Turn the user's architectural concern into evidence-backed, scoped options.
Resolve investigative choices from the repository; implementation still requires
user authority.

## Locate the pressure

Use the stated module, subsystem, pain point, or direction. If unspecified,
inspect roughly 20 recent commit messages and prioritize repeatedly changed
code. Widen only if those changes yield no useful hotspot. Read current code,
tests, and available user-provided Obsidian notes to establish domain language
and settled decisions.

Apply [language.md](references/language.md) and
[questions-and-moves.md](references/questions-and-moves.md). For deepening,
read [deepening.md](references/deepening.md); when alternate interfaces were
requested, use its dependency categories and
[interface-design.md](references/interface-design.md).

## Make the recommendation concrete

Show files and symbols, explain the behavior or change pressure, then name the
smell. Select one or two small structural changes that improve the requested
work. Give their migration path, likely touched files, and behavior-preserving
verification. Do not ask the user to choose routine read paths or test mechanics.
Do ask before edits spanning more than a handful of files unless that scope
was already authorized.

## Deliver and store appropriately

Lead with findings and concrete paths, covering current shape, risk/pressure,
change, touched files, and verification. Durable architecture, glossary, ADR,
and planning notes use available Obsidian project notes. Product-repo
`CONTEXT.md`, `docs/adr/`, and architecture reports need an explicit request.
If Obsidian destination or access is unresolved, return the completed note body
and proposed path rather than blocking the review or writing elsewhere. Report
the durable note path for both saved and proposed notes.
