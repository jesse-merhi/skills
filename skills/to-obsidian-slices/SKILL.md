---
name: to-obsidian-slices
description: 'Break PRDs, rough plans, or broad features into Obsidian tracer-bullet slices with implementation and verification todos.'
---

# To Obsidian Slices

Create small vertical-slice notes that can be picked up independently.
Each slice should prove one observable path through the system.
Every slice must include an execution checklist that forces agents to
complete `pre-plan`, `implementation`, and `verification` in that order.

## Workflow

1. Read the PRD or source plan.
2. Search/read related Obsidian notes when available so naming, prior
   decisions, and folder conventions match the vault.
3. Identify user-visible or system-visible outcomes.
4. Split outcomes into tracer-bullet slices:
   - thin
   - end-to-end
   - independently verifiable
   - sequenced by dependency
5. Mark each slice:
   - `AFK` when an agent can execute without more product judgment
   - `HITL` when user/product review is needed mid-flight
6. Present the proposed breakdown before publishing. For each slice,
   show:
   - title
   - mode: `AFK` or `HITL`
   - blocked by
   - user stories or acceptance criteria covered, when the source has
     them
   - for frontend UI slices, the viewport/state that must be proven
     with `frontend-ui-validation`
7. Ask the user:
   - Does the granularity feel right?
   - Are the dependency relationships correct?
   - Should any slices be merged or split further?
   - Are the correct slices marked `AFK` and `HITL`?
8. Iterate until the user approves the breakdown.
9. Add an execution checklist to every slice with these todos, in this
   order:
   - `pre-plan`
   - `implementation`
   - `verification`
   For frontend UI slices, the verification todo must name the expected
   screenshots, layout-audit output, console checks, or traces.
10. Publish approved slices in dependency order only when
   Obsidian write access is enabled and the target path is clear.
   Otherwise return proposed note paths and markdown bodies. Do not
   write slices into the product repo unless the user explicitly asks for
   repo-local docs.
11. Do not close or modify the parent PRD unless the user asks.

## Execution Contract

Each slice note is both a planning artifact and an execution guardrail.
The agent implementing a slice must work through its todos in order:

1. `pre-plan`: read the slice, parent PRD, dependencies, and relevant
   code/docs; confirm the narrow scope; identify files and verification
   commands before editing.
2. `implementation`: make only the changes needed for this slice,
   keeping the work end-to-end and avoiding unrelated cleanup.
3. `verification`: run the slice-specific checks, record evidence, and
   only then mark the slice complete.

For frontend UI slices, `verification` includes `frontend-ui-validation`
for the changed viewport/state. Record proof that text does not clip,
wrap badly, overflow, or overlap.

For a batch of slices, complete all three todos for the current slice
before starting the next dependent slice. If a phase is blocked, stop at
that todo and record the blocker instead of skipping ahead.

## Good Slices

Prefer:

- `User can create a basic project and see it after refresh`
- `User sees validation when project name is empty`
- `Archived project disappears from active project list`

Avoid:

- `Add database table`
- `Build API endpoint`
- `Create frontend form`

Layer tasks are implementation details. A slice is a behavior.

## Slice Note Shape

```md
# Slice: <Outcome>

Status: Ready
Type: Slice
Mode: AFK | HITL
Parent PRD: [[<prd note>]]

## Outcome
<One complete behavior this slice proves.>

## Scope
Included:
- <included>

Excluded:
- <not in this slice>

## Acceptance Criteria
- <observable criterion>

## Implementation Notes
- <known code paths, constraints, or sequencing notes>

## Execution Checklist
- [ ] pre-plan: Read this slice, parent PRD, dependencies, and relevant code/docs; write a short implementation plan and verification target before editing.
- [ ] implementation: Implement only this slice's included scope, keeping the change end-to-end and avoiding unrelated cleanup.
- [ ] verification: Run the focused and broader checks below, record the result, and update status only after evidence exists.

## Verification
- <focused test or command>
- <for frontend UI work: `frontend-ui-validation` proof for the changed
  viewport/state>
- <broader check>

## Dependencies
- <prior slice or decision, or "None">
```

## Naming

Prefer:

```text
Slices/YYYY-MM-DD-short-outcome.md
```

If splitting a named PRD, use a folder beneath that PRD's area when the
vault already has a convention.
