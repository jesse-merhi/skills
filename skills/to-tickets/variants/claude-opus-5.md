---
name: to-tickets
description: 'Turn a plan or spec into tracer-bullet Obsidian tickets with blockers and logical PR groups.'
---

# To tickets

Convert the approved plan into a blocker-aware tracer-bullet ticket graph
without inventing new scope. Begin with the proposed numbered breakdown rather
than a generic progress update. Subsequent approval rounds are the user
interaction, so narrate only a material graph or PR-grouping change.

Keep each saved Obsidian ticket to the referenced template and its owned
acceptance criteria. Return the published paths, or approved bodies and proposed
paths when publishing is blocked. User approval of granularity, blocking edges,
and PR groups is the required validation; do not add a generic recheck. Build
and publish the ticket set in the current session without delegation.

Break a plan, spec, or conversation into a set of tickets: tracer-bullet
vertical slices, each declaring the tickets that block it. Publish tickets to
Obsidian `Issues/`.

## Workflow

1. Gather context from whatever is already in the conversation. If the user
   passes a spec path or Obsidian note, fetch it and read the full body.
2. Explore the codebase if needed. Ticket titles and descriptions should use
   the project's glossary vocabulary and respect ADRs or Obsidian decisions in
   the area you are touching.
3. Look for opportunities to prefactor the code to make implementation easier:
   make the change easy, then make the easy change.
4. Draft tracer-bullet tickets using [ticket-design.md](references/ticket-design.md).
   Give each ticket its blocking edges. A ticket with no blockers can start
   immediately.
5. Derive PR delivery groups from the ticket graph using
   [ticket-design.md](references/ticket-design.md). Preserve an approved spec
   shape unless the detailed blocker graph disproves it. Load `gh-stack` for a
   strict dependency chain of two or more review groups. Keep independent graph
   paths as standalone PRs or separate stacks.
6. Mark each ticket `AFK` or `HITL`.
7. Present the proposed breakdown as a numbered list. For each ticket, show:
   title, blocked by, mode, PR group/delivery, what it delivers, covered
   acceptance criteria, and any frontend validation state/viewport.
8. Ask the user whether the granularity, blocking edges, and PR grouping feel
   right, and whether any tickets or review groups should be merged or split.
9. Iterate until the user approves both the ticket graph and PR delivery map.
10. Publish the approved tickets to Obsidian `Issues/` using
   [note-template.md](references/note-template.md) and
   [naming.md](references/naming.md). If write access is missing, return the
   Markdown bodies and proposed paths.
11. Do not close or modify any parent spec unless the user explicitly asks.

## Context pointers

- Use [ticket-design.md](references/ticket-design.md) for tracer-bullet rules,
  wide refactors, and blocker checks.
- Use [execution-contract.md](references/execution-contract.md) for the ordered
  todo contract.
- Use [note-template.md](references/note-template.md) for the ticket note body.
- Use [naming.md](references/naming.md) for vault-relative note paths.
