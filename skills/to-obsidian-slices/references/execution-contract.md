# Execution Contract

Each slice note is both a planning artifact and an execution guardrail. The
agent implementing a slice must work through its todos in order:

1. `pre-plan`: read the slice, parent PRD, dependencies, and relevant code/docs;
   confirm the narrow scope; identify files and verification commands before
   editing.
2. `implementation`: make only the changes needed for this slice, keeping the
   work end-to-end and avoiding unrelated cleanup.
3. `verification`: run the slice-specific checks, record evidence, and only then
   mark the slice complete.

For frontend UI slices, `verification` includes `frontend-ui-validation` for the
changed viewport/state. Record proof that text does not clip, wrap badly,
overflow, or overlap.

For a batch of slices, complete all three todos for the current slice before
starting the next dependent slice. If a phase is blocked, stop at that todo and
record the blocker instead of skipping ahead.
