---
name: to-tickets
description: 'Turn a plan or spec into tracer-bullet Obsidian tickets with blockers and logical PR groups.'
---

# To tickets

Use the settled plan to prepare a complete ticket and PR-delivery proposal.
Resolve routine drafting choices from the supplied evidence, then preserve the
user's explicit approval checkpoint before publication.

## Build the graph

Read a named spec or note in full. Use relevant conversation, code, glossary,
ADRs, and Obsidian decisions. Identify useful prefactoring as planned work.
Follow [ticket-design.md](references/ticket-design.md) for thin end-to-end slices,
wide-refactor exceptions, and real blocking edges. No blockers means a ticket
can start now.

Group tickets into independently reviewable PR units. Keep an approved spec's
shape unless the detailed dependency graph disproves it. Load `gh-stack` for
strict chains of two or more review groups; independent paths stay separate.
Do not confuse ticket ordering with PR dependencies.

## Settle and deliver

Present numbered tickets with title, blockers, `AFK`/`HITL`, PR group/delivery,
outcome, covered acceptance criteria, and relevant UI state/viewport. Ask about
granularity, edges, and grouping, including needed merges or splits. Continue
revision until the user approves both maps.

Publish the approved set to Obsidian `Issues/` with
[note-template.md](references/note-template.md) and [naming.md](references/naming.md).
Retain [execution-contract.md](references/execution-contract.md) in each note's
ordered todos. If writing is unavailable, deliver the full bodies and proposed
paths instead. Do not modify or close the parent spec without a request.
