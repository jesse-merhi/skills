---
name: parallel-slice-orchestration
description: 'Implement specs with parallel agents, disjoint ownership, integration, and verification.'
---

# Parallel slice orchestration

Implement an existing spec through disjoint vertical slices, then integrate and
verify the whole result. The orchestrator owns decomposition, dependency order,
integration, final verification, and publication; workers own assigned slices.

Subagents require the user's explicit request for subagents, delegation, or
parallel agent work. Without it, produce the slice plan and ask before spawning.
If the harness lacks subagents, execute the same plan sequentially and disclose it.

Read the spec/plan/issue, repo instructions, and relevant domain skill before
decomposition. Identify observable behaviors and acceptance criteria. Use
[decomposition.md](references/decomposition.md) for dependencies and choose delivery
before edits: one cohesive review unit in one PR; a strict chain of two or more
review units in `gh-stack`; independent work in separate PRs/stacks. Plan branch
names/order for stacks. Every layer must build against its direct base, with
dependencies in the same or lower layer.

Load `tdd` for behavior-changing slices. Docs/config/generated-artifact exceptions
must be named and change no executable behavior. Slice through real behavior
(UI→API→storage, command→effect, event→state), not architectural layers. Complete
shared types/schemas/API foundations first, locally or with exactly one worker.
Keep the immediate critical path local and use fewer substantial independent
workers with disjoint ownership of files, migrations, clients, routes, types,
and fixtures.

Assign with [worker-contract.md](references/worker-contract.md). Preserve `AFK`
and `HITL` using [hitl-checkpoints.md](references/hitl-checkpoints.md); HITL stops
at named checkpoints with evidence before continuation. Rendered UI slices use
`design` production-UI guidance, interaction guidance when material, and
`frontend-ui-validation` before completion.

Read every worker result against [integration.md](references/integration.md),
check owned files and TDD/valid exception, integrate, resolve integration issues
locally, and run relevant package verification on the integrated tree.

Publish only under `AGENTS.md` authority; otherwise stop at the verified local
checkpoint. The orchestrator submits stacks and owns per-layer `pr-proof-pack`
freshness/proof; workers return changes and evidence without publishing shared
stack branches. Keep foundations below dependents. Before readiness or merge,
apply both AGENTS gates to every PR: exact-head review and PR-level persistent
sign-off. Completion requires correct ownership, reviewed worker results,
checkpoint compliance, integrated validation, and dependency-matched delivery.
