---
name: orchestrate-codex-workers
description: 'Orchestrate change-making Codex work with Sol as the planning and review oracle, Terra Max native implementation agents, and optional Luna Max independent tasks. Use when implementing features, fixing bugs, refactoring, migrating, or otherwise changing a repository under an authorized delegated workflow.'
---

# Orchestrate Codex Workers

Apply this skill as the routing layer around repository and domain skills. Keep
the primary Sol context focused on requirements, decisions, integration, and
final judgment; move implementation volume to cheaper workers without
delegating accountability.

Respect an explicit user request to use a different model, work without
delegation, or stop at a plan. If a required model or tool is unavailable, use
the nearest capable tier and report the fallback rather than inventing the
requested topology.

## Target Topology

```text
Sol Extra High: oracle, specification, decomposition, review, final validation
└── Terra Max: native implementation agent; native depth ends here
    └── Luna Max: optional independent Codex task, never a native subagent
```

Only the Sol root invokes native subagent tools. Explicitly select Terra with
Max reasoning for every native worker. Terra may create an independent Luna
Max Codex task when its own routing judgment supports that choice and the task
tools are available. Sol does not route directly to Luna, and Luna does not
delegate further.

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
   - Keep architecture, cross-cutting trade-offs, risky debugging calls, and
     final review with Sol.
   - Route substantial implementation to one or more Terra Max native workers.
     Give parallel workers disjoint ownership.
   - Let each Terra worker decide whether Luna improves its assigned scope.
     Do not force Luna by task category or avoid it merely because code changes
     are involved.

3. Dispatch a complete contract.
   - Read [worker-contract.md](references/worker-contract.md) before writing a
     Terra or Luna prompt.
   - Give the worker decisions, file or symbol boundaries, invariants,
     acceptance criteria, validation commands, and the required return shape.
   - Keep design and unresolved judgment with the assigning agent.
   - Complete this step only when the prompt is independently executable.

4. Supervise implementation.
   - Have Terra implement its scope in the native shared workspace.
   - If Terra selects Luna, read
     [session-lifecycle.md](references/session-lifecycle.md) and follow the full
     create, wait, integrate, validate, and archive lifecycle.
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
- Every native worker used Terra Max and no Terra worker spawned a native child.
- Every Luna task used Max reasoning, received a complete contract, and was
  archived by its creator.
- The integration agent independently validated accepted worker changes.
- Sol reviewed the integrated result against observable acceptance criteria.
