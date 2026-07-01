# Slice Note Template

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
- <for frontend UI work: `frontend-ui-validation` proof for the changed viewport/state>
- <broader check>

## Dependencies
- <prior slice or decision, or "None">
```
