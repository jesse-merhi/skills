# HITL checkpoints

HITL means the slice needs user/product review while work is in flight, such as
an architectural decision, design review, workflow choice, or
acceptance-criteria clarification. AFK means the worker can finish the slice
with the written acceptance criteria and verification commands.

Do not turn a HITL slice into fully autonomous work. The assignment must name
the checkpoint, the evidence the worker should collect, and the question the
user or orchestrator must answer.

When a worker reaches a HITL checkpoint:

- pause that slice before further implementation or integration
- review the worker's evidence locally
- ask the user for the needed decision when it is product/design judgment
- continue the slice only after the decision is recorded

If a slice is marked HITL, parallel work may proceed only up to the named
checkpoint. Do not integrate or continue past that checkpoint until the needed
decision exists.

If two slices depend on the same unresolved design decision, stop and decide it
before spawning workers.
