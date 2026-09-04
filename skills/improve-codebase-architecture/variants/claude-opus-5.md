---
name: improve-codebase-architecture
description: 'Review architecture for module depth, interfaces, locality, dependencies, and testability.'
---

# Improve codebase architecture

Deliver one or two justified structural recommendations for the user's actual
change pressure, with concrete files, a migration path, and behavior-preserving
verification. Do not turn the review into a refactor or a broad architecture essay.

Scope to the named module, subsystem, pain point, or direction. Otherwise use
roughly the last 20 commit messages to find repeatedly changed code; widen only
if they reveal no useful hotspot. Inspect code, tests, and available user-provided
Obsidian project notes before proposing a structure.

Use [language.md](references/language.md) and
[questions-and-moves.md](references/questions-and-moves.md). Deepening work uses
[deepening.md](references/deepening.md). Requested interface alternatives also
use its dependency categories and [interface-design.md](references/interface-design.md).

Discover genuine scoped concerns before choosing recommendations. Show the
current files and symbols and the behavior or pressure before naming the smell.
The recommendation limit governs presentation, not discovery. Keep proposals
small; cross-cutting edits touching more than a handful of files require user
agreement unless that scope was already requested.

Report current shape, pressure/risk, recommended change, likely files, and
verification strategy. Store durable architecture, glossary, ADR, and planning
notes in available Obsidian project notes, keeping saved output concise too.
Do not create or edit product-repo `CONTEXT.md`, `docs/adr/`, or architecture
reports without an explicit request. If Obsidian access or destination is unclear,
return the note body and proposed path. Include the durable note path for saved
or proposed notes. No optional verifier team is needed to
finish this lens.
