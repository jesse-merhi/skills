# Ticket note template

Use only the sections the ticket needs. Write concrete work and verification steps for this ticket rather than copying a generic checklist.

```md
# Ticket: <Outcome>

Status: <Blocked or Ready, according to prerequisites>
Parent Spec: [[<spec note>]]
Blocked By: [[<ticket note>]] | None
PR Group: <review unit>
PR Delivery: Single PR | Standalone PR | Stack <name and position>
PR Group Depends On: <group> | None

## Outcome
<What will work when this ticket is complete.>

## Scope
<Included behavior and important exclusions.>

## Acceptance Criteria
- <Observable outcome.>

## Implementation Notes
<Known constraints, relevant code, prerequisites, and any order that actually matters. Include an unresolved user decision here rather than assigning a mode label.>

## Verification
<Inputs, actions or commands, and expected results. For UI work, identify the states and viewports requiring rendered proof. Record the result before marking complete.>
```
