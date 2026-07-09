# Ticket Note Template

```md
# Ticket: <Outcome>

Status: Ready
Type: Ticket
Mode: AFK | HITL
Parent Spec: [[<spec note>]]
Blocked By: [[<ticket note>]] | None

## Outcome
<One complete behavior this ticket proves.>

## Scope
Included:
- <included>

Excluded:
- <not in this ticket>

## Acceptance Criteria
- <observable criterion>

## Implementation Notes
- <known code paths, constraints, or sequencing notes>

## Execution Checklist
- [ ] pre-plan: Read this ticket, parent spec, blockers, and relevant code/docs; write a short implementation plan and verification target before editing.
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
