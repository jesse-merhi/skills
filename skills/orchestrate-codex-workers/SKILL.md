---
name: orchestrate-codex-workers
description: 'Orchestrate change-making Codex work with Sol as the planning and review oracle, Terra Max native implementation agents, and optional Luna Max independent tasks created by Sol or Terra. Use when implementing features, fixing bugs, refactoring, migrating, or otherwise changing a repository under an authorized delegated workflow.'
---

# Orchestrate Codex Workers

Apply this skill as the routing layer around repository and domain skills. Keep
the primary Sol context focused on requirements, decisions, integration, and
final judgment; move substantial implementation volume to cheaper workers
without delegating accountability.

Respect an explicit user request to use a different model, work without
delegation, or stop at a plan. If a required model or tool is unavailable, use
the nearest capable tier and report the fallback rather than inventing the
requested topology.

## Target Topology

```text
Sol Extra High: oracle, specification, decomposition, review, final validation
├── Luna Max: optional direct independent Codex task
└── Terra Max: native implementation agent; native depth ends here
    └── Luna Max: optional independent Codex task
```

Only the Sol root invokes native subagent tools. Explicitly select Terra with
Max reasoning for every native worker. Sol or Terra may create an independent
Luna Max Codex task when its routing judgment supports that choice and the task
tools are available. Sol may route directly to Luna when a Terra supervision
layer would add no useful judgment. Luna does not delegate further.

## Delegation Break-even

Delegate only when the expected effort to write the contract, coordinate the
worker, review and integrate its diff, and independently validate the result is
lower than implementing and validating the change in Sol. When the comparison
is close or uncertain, keep the work in Sol.

Keep the work in Sol when it is one focused local edit with limited context, no
clean independent slice, and one straightforward validation path. A normal
five-line change should remain in Sol. A tiny but high-risk change also remains
in Sol because it needs judgment, not implementation capacity.

Delegate only when the task has enough implementation volume, context-heavy
reading, validation work, or separable ownership that the worker saves more
Sol effort than coordination consumes. Judge size by workflow cost rather than
predicted lines changed.

## Active Oracle Supervision

Treat Terra and Luna as capable but untrusted implementers. Sol remains the
active guide throughout delegated work, not only the author of the first prompt
and reviewer of the final diff.

- Give each worker Sol's best known approach, relevant repository pattern,
  decisions already made, and likely failure modes before implementation.
- Require a worker to report before a material change of approach instead of
  silently pivoting after discovery or failure.
- Watch meaningful progress, direction changes, test failures, and scope
  growth. When Sol sees a mistaken assumption, repeated unproductive work, or
  a better path, steer the worker immediately with concrete reasoning and an
  updated approach.
- Have Terra actively supervise Luna tasks it creates and surface material
  pivots or repeated failures to Sol. Sol may steer Terra or Luna whenever its
  guidance is likely to save time or improve correctness.
- Continue in the same worker context when correcting direction. Do not wait
  passively for completion once evidence shows the worker is wandering.

Avoid ceremony during correct, deterministic progress. The purpose of
supervision is to prevent expensive wrong turns, not to require approval for
every edit.

## Workflow

1. Frame the change before delegation.
   - Read the applicable repository instructions and domain skills.
   - Resolve consequential ambiguity or ask the user when it cannot be resolved
     safely.
   - Define observable acceptance criteria, owned scope, constraints, and exact
     validation.
   - Complete this step only when a worker can tell whether it is done without
     inventing product or architecture decisions.

2. Choose the worker tier.
   - Read [model-routing.md](references/model-routing.md).
   - Apply the delegation break-even gate. Continue locally in Sol when the
     task does not clear it.
   - Keep architecture, cross-cutting trade-offs, risky debugging calls, and
     final review with Sol.
   - For work that clears the gate, route directly from Sol to Luna when Sol can
     provide a complete bounded contract, validation is decisive, and Terra
     would only relay the prompt.
   - Route substantial implementation to one or more Terra Max native workers.
     Give parallel workers disjoint ownership.
   - Let each Terra worker decide whether Luna improves its assigned scope.
     Do not force Luna by task category or avoid it merely because code changes
     are involved.

3. Dispatch a complete contract.
   - Read [worker-contract.md](references/worker-contract.md) before writing a
     Terra or Luna prompt.
   - Give the worker decisions, file or symbol boundaries, invariants,
     Sol's recommended approach, acceptance criteria, validation commands, and
     the required return shape.
   - Keep design and unresolved judgment with the assigning agent.
   - Complete this step only when the prompt is independently executable.

4. Supervise implementation.
   - Have Terra implement its scope in the native shared workspace.
   - If Sol or Terra selects Luna, read
     [session-lifecycle.md](references/session-lifecycle.md) and follow the full
     create, wait, integrate, validate, and archive lifecycle.
   - Make the Luna task's creator responsible for its prompt, decisions,
     integration, independent validation, and archival.
   - Have Sol inspect meaningful progress and proactively steer mistaken
     assumptions, direction changes, repeated failures, or unnecessary scope.
   - Continue corrections in the same worker or task while its context is
     useful. Supply failing evidence and the expected behavior, not a vague
     request to try again.

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
- Delegation cleared the break-even gate; small focused changes remained in
  Sol.
- Sol supplied an approach and promptly corrected every observed worker drift,
  material pivot, or repeated failure.
- Every native worker used Terra Max and no Terra worker spawned a native child.
- Every Luna task used Max reasoning, received a complete contract, and was
  integrated, independently validated, and archived by its creator.
- The integration agent independently validated accepted worker changes.
- Sol reviewed the integrated result against observable acceptance criteria.
