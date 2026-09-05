---
name: parallel-slice-orchestration
description: 'Implement specs with parallel agents, disjoint ownership, integration, and verification.'
---

# Parallel slice orchestration

Turn an existing spec into independently owned vertical slices and a verified
integrated result. The orchestrator owns decomposition, dependency order,
integration, verification, and delivery; workers own their bounded slices.

## Establish delegation and delivery boundaries

Spawn only when the user explicitly requested subagents, delegation, or parallel
agent work. Otherwise prepare the slice plan and ask before spawning. Once
that authority exists, do not ask again for each disjoint assignment. If subagents
are unavailable, execute the same plan sequentially and disclose the limitation.

Read the spec/notes/issue/plan, repo instructions, and relevant domain skill.
Identify observable behavior and acceptance criteria and use
[decomposition.md](references/decomposition.md) to map dependencies. Choose
one PR for one cohesive review unit, `gh-stack` for a strict chain of two or
more review units, and separate PRs/stacks for independent paths. Plan stack
names/order before editing; each layer builds against its direct base and
contains its dependencies or depends downward, never upward.

## Assign meaningful independent work

Use `tdd` for executable behavior changes. Named docs/config/generated-artifact
exceptions require no executable behavior change. Slice through the real behavior
path, not architectural layers. Finish shared types/schemas/API foundations first,
locally or with one worker. Keep the immediate critical path local, prefer fewer
substantial workers, and separate ownership of files, migrations, generated
clients, routes, shared types, and fixtures.

Use [worker-contract.md](references/worker-contract.md). Preserve `AFK` and
`HITL` under [hitl-checkpoints.md](references/hitl-checkpoints.md); a named HITL
checkpoint remains a user gate with evidence before continuation. Rendered UI
requires `design` production-UI guidance, material interaction guidance, and
`frontend-ui-validation` before completion.

## Integrate and finish within authority

Read every result through [integration.md](references/integration.md), verify
ownership and TDD/valid exception, integrate, fix integration issues locally,
and run relevant package checks on the integrated tree. Do not substitute worker
claims for integration evidence.

Publish only with AGENTS authority, otherwise stop at a verified local checkpoint.
The orchestrator owns submission and per-layer `pr-proof-pack` freshness/proof;
workers return scoped edits/evidence and do not publish shared stacks. Apply
exact-head Review and PR-persistent Sign-off gates to every layer before readiness/
merge. Complete when the integrated behavior is verified and the delivery shape
matches the actual dependency map.
