# Execution contract

Each ticket note is both a planning artifact and an execution guardrail. The
agent implementing a ticket must work through its todos in order:

1. `pre-plan`: read the ticket, parent spec, blockers, and relevant code/docs;
   confirm the narrow scope and approved PR group; identify files and
   verification commands before editing. If the ticket belongs to a stack,
   load `gh-stack` and confirm the correct branch and direct base before making
   changes.
2. `implementation`: make only the changes needed for this ticket, keeping the
   work end-to-end, inside its approved review group, and avoiding unrelated
   cleanup.
3. `verification`: run the ticket-specific checks, record evidence, and only then
   mark the ticket complete.

For frontend UI tickets, `verification` includes `frontend-ui-validation` for the
changed viewport/state. Record proof that text does not clip, wrap badly,
overflow, or overlap.

For a batch of tickets, complete all three todos for the current ticket before
starting the next dependent ticket. If a phase is blocked, stop at that todo and
record the blocker instead of skipping ahead.

Do not silently change the approved PR group or stack order during execution.
When implementation reveals a missing dependency or non-reviewable boundary,
stop and return the proposed delivery-map change for approval.
