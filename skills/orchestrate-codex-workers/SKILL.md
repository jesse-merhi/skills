---
name: orchestrate-codex-workers
description: 'Route authorized repository changes with Sol as the default implementer and oracle, guided Luna Max tasks as the preferred delegation exception, and Terra Max only when continuing judgment or native parallelism justifies it. Load before planning or implementing any repository change.'
---

# Orchestrate Codex Workers

Apply this skill as the routing layer around repository and domain skills. Keep
implementation in Sol by default. Delegate only when a concrete advantage
survives the cost of writing the contract, guiding the worker, reviewing the
result, integrating it, and independently validating it.

Respect an explicit user request to use a different model, work without
delegation, or stop at a plan. If a required model or tool is unavailable, use
the nearest capable tier and report the fallback rather than inventing the
requested topology.

## Target Topology

```text
Sol Extra High: default implementer, oracle, specification, review, validation
├── Luna Max: preferred delegated implementer in an independent Codex task
└── Terra Max: exceptional native implementer; native depth ends here
    └── Luna Max: optional independent Codex task
```

Only the Sol root invokes native subagent tools. Explicitly select Terra with
Max reasoning for every native worker. When delegation clears the gate, prefer
a direct independent Luna Max Codex task with a complete walkthrough. Use
Terra only when Luna would need unresolved continuing judgment, native shared-
workspace coordination, or valuable parallel decomposition. Sol or Terra may
create Luna tasks. Luna does not delegate further.

## Delegation Break-even

Use direct Sol implementation as the baseline. Delegate only when the expected
Sol effort and total credit cost to write the contract, walk the worker through
the change, coordinate it, review and integrate its diff, and independently
validate the result are lower than implementing and validating directly in
Sol. When the comparison is close or uncertain, keep the work in Sol.

Keep the work in Sol when it is one cohesive change and Sol would need to
reconstruct most implementation decisions during review. Size alone does not
clear the gate: a substantial single feature can still be faster and cheaper
in Sol. A normal five-line change and a tiny high-risk change remain in Sol.

Delegate when bounded mechanical volume, decisive validation, context
isolation, or genuinely parallel ownership saves more Sol effort than
coordination consumes. When delegating, test Luna first because its economics
can tolerate more guidance. Escalate to Terra only when Terra's additional
judgment is itself the concrete advantage.

## Active Oracle Supervision

Treat Terra and Luna as capable but untrusted implementers. Sol remains the
active guide throughout delegated work, not only the author of the first prompt
and reviewer of the final diff.

- Give each worker Sol's best known approach, relevant repository pattern,
  decisions already made, and likely failure modes before implementation.
- For Luna, turn that approach into an ordered walkthrough with exact targets,
  expected intermediate states, validation, and named decision gates. Do not
  ask Luna to discover architecture or silently fill consequential gaps.
- Define direction checkpoints in the worker contract. Have the worker send a
  mailbox event when it needs a decision, reaches a material discovery or
  failure, proposes a scope or approach change, or completes its assignment.
- After dispatching a native Terra worker, call
  `wait_agent({timeout_ms: 3600000})`. Worker messages, completion, and new user
  input wake Sol immediately; the one-hour timeout is only a recovery boundary
  for a possibly stalled or lost worker. Never use shorter recurring timeouts
  to monitor healthy progress. If the runtime rejects one hour, use its longest
  supported bounded timeout.
- On a mailbox event, inspect the reported evidence and any relevant shared
  diff. When Sol sees a mistaken assumption, repeated unproductive work, or a
  better path, steer the worker immediately with concrete reasoning and an
  updated approach.
- On a timeout without new evidence, inspect worker state once to diagnose a
  stall, missed event, or failure. Resume the event wait when the worker is
  healthy. Reserve manual status listing for that recovery branch.
- Have Terra actively supervise Luna tasks it creates and surface material
  pivots or repeated failures to Sol. Sol may steer Terra or Luna whenever its
  guidance is likely to save time or improve correctness.
- Continue in the same worker context when correcting direction. Do not wait
  passively for completion once evidence shows the worker is wandering.

Let correct, deterministic progress remain quiet. Spend Sol turns on worker
events, concrete evidence, steering, integration, and review.

## Guided Luna Execution

Treat a Luna task like a fast implementer following a senior engineer's
runbook.

- Give one bounded outcome and an ordered sequence of implementation stages.
- For each material stage, name the files or symbols, the intended change, the
  invariants, the expected intermediate result, and the validation to run.
- Resolve product and architecture choices before creation. List known traps
  and rejected alternatives so Luna does not rediscover them.
- Name only consequential pause points: a failed required check, contradictory
  repository evidence, a missing decision, or a proposed change of approach.
  Have Luna request attention with evidence at those gates. Routine correct
  execution remains quiet.
- Require Luna to run every specified validation before completion. A claim of
  completion without evidence is not acceptable.
- Keep corrections in the same Luna task while its context remains useful.
  Archive it after accepting or rejecting the result.

## Workflow

1. Frame the change before implementation or delegation.
   - Read the applicable repository instructions and domain skills.
   - Resolve consequential ambiguity or ask the user when it cannot be resolved
     safely.
   - Define observable acceptance criteria, owned scope, constraints, and exact
     validation.
   - Complete this step only when a worker can tell whether it is done without
     inventing product or architecture decisions.

2. Choose the worker tier.
   - Read [model-routing.md](references/model-routing.md).
   - Start from direct Sol implementation. Apply the delegation break-even
     gate and continue locally when the task does not clearly pass.
   - Keep architecture, cross-cutting trade-offs, risky debugging calls, and
     final review with Sol.
   - For work that clears the gate, prefer direct Luna Max when Sol can provide
     a complete walkthrough, validation is decisive, and recovery is cheap.
   - Use one or more Terra Max native workers only when continuing judgment,
     native shared-workspace coordination, or disjoint parallel ownership
     provides an advantage Luna cannot.
   - Let each Terra worker decide whether Luna improves its assigned scope.
     Terra applies the same Sol-first break-even test to that Luna task.

3. Dispatch a complete contract.
   - Read [worker-contract.md](references/worker-contract.md) before writing a
     Terra or Luna prompt.
   - Give the worker decisions, file or symbol boundaries, invariants,
     Sol's recommended approach, acceptance criteria, validation commands, and
     the required return shape.
   - Keep design and unresolved judgment with the assigning agent.
   - For Luna, include the full ordered walkthrough and its decision gates in
     the initial prompt.
   - Complete this step only when the prompt is independently executable.

4. Supervise implementation.
   - If Sol or Terra selects Luna, read
     [session-lifecycle.md](references/session-lifecycle.md) and follow the full
     create, wait, integrate, validate, and archive lifecycle.
   - Have Terra implement its scope in the native shared workspace only when
     the Terra exception applies.
   - Wait on Terra's mailbox events with `wait_agent({timeout_ms: 3600000})`.
     Treat a timeout as the recovery branch, not a recurring progress
     checkpoint.
   - Make the Luna task's creator responsible for its prompt, decisions,
     integration, independent validation, and archival.
   - Have Sol inspect meaningful progress and proactively steer mistaken
     assumptions, direction changes, repeated failures, or unnecessary scope.
   - Continue corrections in the same worker or task while its context is
     useful. Supply failing evidence and the expected behavior, not a vague
     request to try again.
   - Complete this step when every worker has returned a result or a diagnosed
     blocker, and every Sol intervention is tied to a worker event or concrete
     evidence.

5. Integrate and verify independently.
   - Inspect every worker diff and confirm it stayed inside assigned ownership.
   - Re-run the specified validation in the integration workspace. Treat a
     worker's reported result as evidence, not proof.
   - Send material defects back to the worker that owns them when practical.
     Use Sol for small integration edits or judgment-heavy corrections when
     another delegation round would add more risk than value.

6. Close with oracle review.
   - Have Sol compare the integrated behavior and net diff with the original
     acceptance criteria.
   - Run the repository's final relevant verification.
   - Confirm every independent Luna task is archived, including failed,
     cancelled, or abandoned tasks.
   - Report the implemented behavior, validation, worker fallbacks, and any
     residual risk.

## Completion Criteria

- The root retained specification, integration, and final judgment.
- Direct Sol was the default; every delegation recorded a concrete advantage
  that cleared the break-even gate.
- Luna was the preferred delegated tier and received an ordered walkthrough.
  Every Terra use identified why Luna was insufficient.
- Sol supplied an approach and promptly corrected every observed worker drift,
  material pivot, or repeated failure.
- Every native worker used Terra Max and no Terra worker spawned a native child.
- Every Luna task used Max reasoning, received a complete contract, and was
  integrated, independently validated, and archived by its creator.
- The integration agent independently validated accepted worker changes.
- Sol reviewed the integrated result against observable acceptance criteria.
