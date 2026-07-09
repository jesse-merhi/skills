---
name: to-tickets
description: 'Break a plan, spec, or conversation into tracer-bullet tickets with blocking edges, then publish them as Obsidian Issues.'
---

# To Tickets

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
5. Mark each ticket `AFK` or `HITL`.
6. Present the proposed breakdown as a numbered list. For each ticket, show:
   title, blocked by, mode, what it delivers, covered acceptance criteria, and
   any frontend validation state/viewport.
7. Ask the user whether the granularity feels right, whether the blocking edges
   are correct, and whether any tickets should be merged or split.
8. Iterate until the user approves the breakdown.
9. Publish the approved tickets to Obsidian `Issues/` using
   [note-template.md](references/note-template.md) and
   [naming.md](references/naming.md). If write access is missing, return the
   Markdown bodies and proposed paths.
10. Do not close or modify any parent spec unless the user explicitly asks.

## Context Pointers

- Use [ticket-design.md](references/ticket-design.md) for tracer-bullet rules,
  wide refactors, and blocker checks.
- Use [execution-contract.md](references/execution-contract.md) for the ordered
  todo contract.
- Use [note-template.md](references/note-template.md) for the ticket note body.
- Use [naming.md](references/naming.md) for vault-relative note paths.
