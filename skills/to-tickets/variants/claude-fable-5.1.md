---
name: to-tickets
description: 'Turn a plan or spec into tracer-bullet Obsidian tickets with blockers and logical PR groups.'
---

# To tickets

Draft the whole ticket graph, obtain approval of its dependencies and PR groups,
then publish the approved notes to Obsidian `Issues/`.

1. Read a supplied spec or note completely. Gather relevant conversation, code,
   glossary, ADR, and project-note context; batch independent reads. Consider
   prefactoring that makes the implementation easier without performing it.
2. Build thin end-to-end slices with
   [ticket-design.md](references/ticket-design.md). Declare every blocker; a
   blocker-free ticket can begin immediately. Use its expand-contract rules
   when a wide mechanical refactor cannot be vertically sliced.
3. Derive cohesive PR groups from the ticket graph. Preserve an approved spec
   shape unless the detailed graph disproves it. Use `gh-stack` for a strict
   chain of two or more review groups; keep independent or forked paths separate.
4. Show a numbered proposal with title, blockers, `AFK`/`HITL`, PR group and
   delivery, outcome, acceptance criteria, and any frontend state/viewport.
5. Ask whether the granularity, blocking edges, and PR grouping are right and
   whether groups or tickets should merge or split. Revise until the user
   approves both the ticket graph and delivery map. Do not publish early.
6. Create the approved notes using [note-template.md](references/note-template.md)
   and [naming.md](references/naming.md). Retain the ordered todos and blocked
   phase rules in [execution-contract.md](references/execution-contract.md).
   If write access is unavailable, return the bodies and proposed paths.

Use literal titles describing behavior, not implementation layers. Leave the
parent spec unchanged unless the user requested a change. Finish by reporting
the approved notes and any remaining publication limitation.
