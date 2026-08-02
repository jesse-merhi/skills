---
name: parallel-slice-orchestration
description: 'Implement an existing PRD, slice plan, or feature plan with parallel subagents, disjoint slice ownership, integration, and verification.'
---

# Parallel Slice Orchestration

Use this when the user wants an existing PRD or slice plan implemented with
subagents. The orchestrator owns decomposition, dependency order, integration,
and final verification. Workers own narrow vertical slices.

Load `tdd` for behavior-changing implementation slices. A worker may use a
named docs, configuration, or generated-artifact exception when no executable
behavior changes. Load the relevant repo/domain skill before decomposition.

Only spawn subagents when the user has explicitly asked for subagents,
delegation, or parallel agent work. Otherwise, produce the slice plan and ask
before spawning. If subagents are unavailable in the current harness, run the
same slice plan sequentially and say that parallel execution was not available.

## Orchestrator Workflow

1. Read the PRD, slice notes, issue, or plan plus the relevant repo
   instructions.
2. Identify externally meaningful behaviors and acceptance criteria.
3. Build a dependency map using [decomposition.md](references/decomposition.md).
4. Choose the PR delivery shape before implementation using
   [decomposition.md](references/decomposition.md). Load `gh-stack` when one
   story has two or more dependency-ordered review units.
5. Convert implementation work into vertical slices, not architectural layers.
6. Do blocking foundation work locally or assign exactly one worker to it.
7. Spawn workers only for independent slices with disjoint write ownership.
   Keep the immediate critical-path task local.
8. Give each worker the assignment contract in
   [worker-contract.md](references/worker-contract.md).
9. Preserve `AFK` and `HITL` modes. Use
   [hitl-checkpoints.md](references/hitl-checkpoints.md) for review stops.
10. Review each worker result before integrating, using the checklist in
   [integration.md](references/integration.md).
11. Resolve integration issues locally, then run the feature's relevant package
    verification commands.
12. Publish the chosen delivery shape. For a stack, keep foundation at the
    bottom, dependent behavior above it, and run `pr-proof-pack` separately for
    every PR layer.

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

## PR Delivery Shape

- Use one PR when the result is one cohesive review unit.
- Use one `gh-stack` stack when two or more independently reviewable concerns
  form a strict dependency chain. Plan branch names and order before editing.
- Keep independent parallel slices as standalone PRs or separate stacks.
  GitHub stacks are linear; do not serialize independent work merely to put it
  in one stack.
- Keep each stacked PR buildable and reviewable against the branch directly
  below it. Put a dependency in the same layer or a lower layer, never above.
- Have the orchestrator own stack submission and per-layer proof. Workers return
  scoped changes and evidence; they do not independently publish branches from
  a shared stack.

## Completion Criteria

- Every worker result has been read before integration.
- Changed files match assigned ownership.
- `tdd` was followed, or the worker stated a valid
  docs/config/generated-code exception.
- Rendered UI slices used `frontend-design` for visual direction,
  `design-engineering` when interaction craft was material, and
  `frontend-ui-validation` before reporting done.
- HITL slices stopped at named checkpoints and returned evidence before
  continuation.
- Final verification ran in the integrated tree.
- The delivery shape matches the dependency map, and every stacked layer has
  its own focused `pr-proof-pack` evidence.

## Context Pointers

- Use [decomposition.md](references/decomposition.md) for dependency mapping and
  vertical slicing.
- Use [worker-contract.md](references/worker-contract.md) for required worker
  prompt fields and the prompt template.
- Use [hitl-checkpoints.md](references/hitl-checkpoints.md) for `AFK` and `HITL`
  handling.
- Use [integration.md](references/integration.md) for worker-result review,
  verification, and anti-patterns.
