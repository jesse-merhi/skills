---
name: parallel-slice-orchestration
description: 'Implement an existing PRD, slice plan, or feature plan with parallel subagents, disjoint slice ownership, integration, and verification.'
---

# Parallel Slice Orchestration

Use this when the user wants an existing PRD or slice plan implemented
with subagents. The orchestrator owns decomposition, dependency order,
integration, and final verification. Workers own narrow vertical slices.
If a source slice is marked `AFK` or `HITL`, preserve that mode during
assignment and integration.

Always load `vertical-slice-tdd` before assigning implementation work.
Load the relevant repo/domain skill before decomposition.
Only spawn subagents when the user has explicitly asked for subagents,
delegation, or parallel agent work. Otherwise, produce the slice plan and
ask before spawning.

## Orchestrator Workflow

1. Read the PRD, slice notes, issue, or plan plus the relevant repo
   instructions.
2. Identify externally meaningful behaviors and acceptance criteria.
3. Build a dependency map:
   - shared foundation that must land before parallel work
   - slices that can proceed independently
   - slices marked `AFK` or `HITL`
   - HITL checkpoints that need user/product review before continuing
   - files or modules that must not be edited by multiple workers
4. Convert work into vertical slices, not layers. A good slice crosses
   the real behavior path: UI to API to persistence, command to side
   effect, event to stored state, or equivalent.
5. Do blocking foundation work locally or assign exactly one worker to
   it. Do not parallelize over shared files until the shared shape is
   stable.
6. Spawn workers only for independent slices with disjoint write
   ownership. Keep the immediate critical-path task local.
7. Review each worker result before integrating:
   - changed files match ownership
   - `vertical-slice-tdd` was followed, or the worker stated a valid
     docs/config/generated-code exception
   - rendered UI slices used `impeccable` when shaping or refining UI
     and `frontend-ui-validation` before reporting done
   - failing test was created before production work
   - focused test passes
   - no worker reverted or overwrote unrelated changes
   - HITL slices stopped at the named checkpoint and returned evidence
     for user/product review
8. Resolve integration issues locally, then run the feature's relevant
   package verification commands.

If subagents are unavailable in the current harness, run the same slice
plan sequentially and say that parallel execution was not available.

## Worker Assignment Contract

Each worker prompt must include:

- the exact PRD/slice acceptance criterion they own
- the slice mode: `AFK`, `HITL`, or "unspecified"
- for HITL slices, the exact checkpoint where the worker must stop
- the expected vertical path through the system
- files/modules they may edit
- files/modules they must avoid
- required skills to load, especially `vertical-slice-tdd` and the
  repo/domain skill
- for rendered UI slices, required skills to load:
  `impeccable` before coding or visual refinement and
  `frontend-ui-validation` before reporting done
- a reminder that they are not alone in the codebase and must not revert
  or overwrite others' edits
- required final report: changed files, tests run, red/green evidence,
  UI validation evidence when relevant, HITL evidence when relevant,
  blockers, and any assumptions

Prefer worker prompts shaped like:

```text
You own Slice N: <behavior>.
Mode: <AFK | HITL | unspecified>.

Load <repo skill> and vertical-slice-tdd.
Write one failing test for <acceptance criterion>, prove it fails for the
expected reason, implement only enough production code to pass, then run
the focused test.

If the mode is HITL, stop at this checkpoint before continuing:
<review point>. Report the evidence needed for user/product review and
wait for the orchestrator or user to decide.

If this slice changes rendered UI, load `impeccable` before coding or
visual refinement and run `frontend-ui-validation` before reporting done.
Include the viewport/state proof in your final report.

Write ownership: <files/modules>.
Avoid: <files/modules owned by other workers>.

You are not alone in this codebase. Do not revert or overwrite changes
outside your ownership. Adapt to existing edits if you encounter them.

Final report: changed files, tests run, red/green evidence, UI
validation evidence when relevant, HITL evidence when relevant,
blockers, and assumptions.
```

## HITL Checkpoints

HITL means the slice needs user/product review while work is in flight,
such as an architectural decision, design review, workflow choice, or
acceptance-criteria clarification. AFK means the worker can finish the
slice with the written acceptance criteria and verification commands.

Do not turn a HITL slice into fully autonomous work. The assignment must
name the checkpoint, the evidence the worker should collect, and the
question the user or orchestrator must answer.

When a worker reaches a HITL checkpoint:

- pause that slice before further implementation or integration
- review the worker's evidence locally
- ask the user for the needed decision when it is product/design
  judgment
- continue the slice only after the decision is recorded

## Parallelization Rules

- Parallelize independent behavior slices, not architectural layers.
- Do not assign two workers to the same files, migrations, generated
  clients, route definitions, shared types, or shared test fixtures.
- If a shared type/schema/API contract is needed, land that foundation
  first, then parallelize consumers.
- If a slice is marked HITL, parallel work may proceed only up to the
  named checkpoint. Do not integrate or continue past that checkpoint
  until the needed decision exists.
- If two slices depend on the same unresolved design decision, stop and
  decide it before spawning workers.
- Prefer fewer well-scoped workers over many tiny workers that create
  integration overhead.

## Avoid

- "Backend agent", "frontend agent", and "tests agent" splits unless
  each is still part of a vertical behavior slice.
- Giving a worker the whole PRD and hoping it chooses a safe subset.
- Parallel edits to shared contracts without one owner.
- Waiting idly for workers when the orchestrator can do non-overlapping
  critical-path work.
- Accepting a worker result without reading the diff and running
  appropriate verification.
