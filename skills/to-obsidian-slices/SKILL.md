---
name: to-obsidian-slices
description: 'Break PRDs, rough plans, or broad features into Obsidian tracer-bullet slices with implementation and verification todos.'
---

# To Obsidian Slices

Create small vertical-slice notes that can be picked up independently. Each
slice should prove one observable path through the system. Every slice must
include an execution checklist that forces agents to complete `pre-plan`,
`implementation`, and `verification` in that order.

## Workflow

1. Read the PRD or source plan.
2. Search/read related Obsidian notes when available so naming, prior decisions,
   and folder conventions match the vault.
3. Identify user-visible or system-visible outcomes.
4. Split outcomes into tracer-bullet slices using
   [slice-design.md](references/slice-design.md).
5. Mark each slice `AFK` or `HITL`.
6. Present the proposed breakdown before publishing. For each slice, show title,
   mode, blockers, covered acceptance criteria, and any frontend validation
   state/viewport.
7. Ask the user to confirm granularity, dependencies, merge/split choices, and
   `AFK`/`HITL` markings.
8. Iterate until the user approves the breakdown.
9. Add the execution checklist from
   [execution-contract.md](references/execution-contract.md) to every slice.
10. Publish approved slices in dependency order only when Obsidian write access
    is enabled and the target path is clear. Otherwise return proposed note
    paths and markdown bodies.
11. Do not write slices into the product repo or close/modify the parent PRD
    unless the user explicitly asks.

## Required Review Before Publishing

- Slices are thin, end-to-end, independently verifiable, and dependency ordered.
- `HITL` slices name the checkpoint that needs user/product review.
- Frontend UI slices name the expected `frontend-ui-validation` evidence:
  screenshots, layout-audit output, console checks, or traces.
- Each slice carries ordered `pre-plan`, `implementation`, and `verification`
  todos.

## Context Pointers

- Use [slice-design.md](references/slice-design.md) for good and bad slice
  shapes.
- Use [execution-contract.md](references/execution-contract.md) for the ordered
  todo contract.
- Use [note-template.md](references/note-template.md) for the slice note body.
- Use [naming.md](references/naming.md) for vault-relative note paths.
