---
name: parallel-slice-orchestration
description: 'Implement an existing PRD, slice plan, or feature plan with parallel subagents, disjoint slice ownership, integration, and verification.'
---

# Parallel Slice Orchestration

Use this when the user wants an existing PRD or slice plan implemented with
subagents. The orchestrator owns decomposition, dependency order, integration,
and final verification. Workers own narrow vertical slices.

Always load `vertical-slice-tdd` before assigning implementation work. Load the
relevant repo/domain skill before decomposition.

Only spawn subagents when the user has explicitly asked for subagents,
delegation, or parallel agent work. Otherwise, produce the slice plan and ask
before spawning. If subagents are unavailable in the current harness, run the
same slice plan sequentially and say that parallel execution was not available.

## Orchestrator Workflow

1. Read the PRD, slice notes, issue, or plan plus the relevant repo
   instructions.
2. Identify externally meaningful behaviors and acceptance criteria.
3. Build a dependency map using [decomposition.md](references/decomposition.md).
4. Convert work into vertical slices, not layers.
5. Do blocking foundation work locally or assign exactly one worker to it.
6. Spawn workers only for independent slices with disjoint write ownership.
   Keep the immediate critical-path task local.
7. Give each worker the assignment contract in
   [worker-contract.md](references/worker-contract.md).
8. Preserve `AFK` and `HITL` modes. Use
   [hitl-checkpoints.md](references/hitl-checkpoints.md) for review stops.
9. Review each worker result before integrating, using the checklist in
   [integration.md](references/integration.md).
10. Resolve integration issues locally, then run the feature's relevant package
    verification commands.

## Slice Rules

- Parallelize independent behavior slices, not architectural layers.
- A good slice crosses the real behavior path: UI to API to persistence, command
  to side effect, event to stored state, or equivalent.
- Do not assign two workers to the same files, migrations, generated clients,
  route definitions, shared types, or shared test fixtures.
- If a shared type/schema/API contract is needed, land that foundation first,
  then parallelize consumers.
- Prefer fewer well-scoped workers over many tiny workers that create
  integration overhead.

## Completion Criteria

- Every worker result has been read before integration.
- Changed files match assigned ownership.
- `vertical-slice-tdd` was followed, or the worker stated a valid
  docs/config/generated-code exception.
- Rendered UI slices used `impeccable` when shaping or refining UI and
  `frontend-ui-validation` before reporting done.
- HITL slices stopped at named checkpoints and returned evidence before
  continuation.
- Final verification ran in the integrated tree.

## Context Pointers

- Use [decomposition.md](references/decomposition.md) for dependency mapping and
  vertical slicing.
- Use [worker-contract.md](references/worker-contract.md) for required worker
  prompt fields and the prompt template.
- Use [hitl-checkpoints.md](references/hitl-checkpoints.md) for `AFK` and `HITL`
  handling.
- Use [integration.md](references/integration.md) for worker-result review,
  verification, and anti-patterns.
