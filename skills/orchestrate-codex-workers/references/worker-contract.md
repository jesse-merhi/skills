# Worker Contract

Write each worker prompt as an executable specification. Give the worker the
decisions it needs; do not ask it to rediscover the parent agent's reasoning.

## Required Fields

```text
Objective
  One observable outcome.

Starting point
  Repository, worktree or branch, and relevant existing state.

Context
  Entry points, symbols, supporting files, and prior decisions.

Recommended approach
  The assigning agent's best path, repository pattern to follow, known traps,
  and alternatives already ruled out.

Ownership
  Files or components the worker may change; concurrent areas it must leave
  untouched.

Behavior and acceptance criteria
  Concrete cases that must work, including important errors and edge cases.

Constraints and invariants
  Repository rules, API compatibility, dependencies, generated files, and
  behavior that must not change.

Validation
  Exact commands or manual checks, expected success, and the instruction to
  stop on the first failure and diagnose it before continuing.

Direction checkpoints
  Discoveries, failures, decisions, scope changes, or proposed pivots that emit
  a mailbox event before the worker continues. Routine correct progress stays
  quiet; completion returns the required final result.

Delivery
  Required commit or artifact, changed-file summary, validation evidence, and
  remaining risks or blockers.

Stop conditions
  Decisions the worker must return instead of guessing.
```

## Prompting Rules

- Assign one bounded outcome per worker.
- Give the worker the best known implementation approach. Do not make it spend
  time rediscovering guidance the assigning agent can already provide.
- When the native spawn tool cannot combine explicit model or effort overrides
  with a full-history fork, use a bounded or empty context fork and carry every
  required fact in this contract.
- Name decisions positively and concretely. Replace “do not break auth” with
  the exact auth behavior that must remain true.
- Point to the smallest useful context. Include file paths and symbols rather
  than broad instructions to inspect the whole repository.
- Separate required behavior from optional cleanup. Keep optional work out of
  the assignment unless it is necessary for acceptance.
- Specify how work integrates with concurrent changes. Give write ownership to
  one worker only.
- Require validation before the worker reports completion. When no decisive
  validation exists, keep the work with the assigning agent, route it to Terra,
  or define an observable manual check first.
- Require the worker to stop and report evidence before a material change of
  approach. The assigning agent decides whether to steer, rescope, or continue.
- For a native worker, make direction checkpoints, decision requests,
  blockers, and completion the reporting events. Routine progress continues
  without timer-based status messages. The assigning Sol agent waits with
  `wait_agent({timeout_ms: 3600000})`; worker events wake it immediately, and
  the timeout exists only for recovery.
- Tell an independent Luna task that the parent task owns final delivery. Have
  it create one scoped local commit and return the commit SHA; it must not push
  or open a second pull request.

## Required Return Shape

```text
Status: complete | blocked
Behavior: what now works from the user's perspective
Changed files: exact paths and why each changed
Commit: SHA for an independent task, otherwise omitted
Validation: commands/checks and exact result
Direction changes: none | change, evidence, and guidance received
Risks: unresolved uncertainty, assumptions, or none
```

Reject “done” without the changed-file list and validation evidence. The
assigning agent must still inspect the diff and rerun validation after
integration.
