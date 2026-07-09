# Execution Contract

Each ticket note is both a planning artifact and an execution guardrail. The
agent implementing a ticket must work through its todos in order:

1. `pre-plan`: read the ticket, parent spec, blockers, and relevant code/docs;
   confirm the narrow scope; identify files and verification commands before
   editing.
2. `implementation`: make only the changes needed for this ticket, keeping the
   work end-to-end and avoiding unrelated cleanup.
3. `verification`: run the ticket-specific checks, record evidence, and only then
   mark the ticket complete.

For frontend UI tickets, `verification` includes `frontend-ui-validation` for the
changed viewport/state. Record proof that text does not clip, wrap badly,
overflow, or overlap.

For a batch of tickets, complete all three todos for the current ticket before
starting the next dependent ticket. If a phase is blocked, stop at that todo and
record the blocker instead of skipping ahead.
