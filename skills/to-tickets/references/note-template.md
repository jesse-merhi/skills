# Ticket Note Template

```md
# Ticket: <Outcome>

Status: Ready
Type: Ticket
Mode: AFK | HITL
Parent Spec: [[<spec note>]]
Blocked By: [[<ticket note>]] | None
PR Group: <logical review group>
PR Delivery: Single PR | Standalone PR | Stack <name> <position>/<total>
PR Group Depends On: <review group> | None

## Outcome
<One complete behavior this ticket proves.>

## Scope
Included:
- <included>

Excluded:
- <not in this ticket>

## Acceptance Criteria
- <observable criterion>

## PR Review Outcome
<What a reviewer can understand, verify, and accept independently in this PR group.>

## Implementation Notes
- <known code paths, constraints, or sequencing notes>

## Execution Checklist
- [ ] pre-plan: Read this ticket, parent spec, blockers, PR delivery fields, and relevant code/docs; confirm the intended branch/direct base and write a short implementation plan and verification target before editing.
- [ ] implementation: Implement only this ticket's included scope, keeping the change end-to-end and avoiding unrelated cleanup.
- [ ] verification: Run the focused and broader checks below, record the result, and update status only after evidence exists.

## Verification
- <focused test or command>
- <for frontend UI work: `frontend-ui-validation` proof for the changed viewport/state>
- <broader check>

## Blocking Edges
- <ticket or decision that must complete first, or "None">

## Frontier
This ticket can start when every blocking edge above is complete.
```
