---
name: parallel-slice-orchestration
description: 'Implement specs with parallel agents, disjoint ownership, integration, and verification.'
---

# Parallel slice orchestration

Deliver a verified implementation of an existing spec through a small number of
substantial independent vertical slices. Keep the critical path local. Preserve
required workers/checkpoints, but do not add a discretionary verifier team.

Delegation requires the user's explicit request for subagents, delegation, or
parallel agent work. Without it, provide the slice plan and ask before spawning.
If the harness lacks subagents, run the same plan sequentially and say so.

Read the spec/notes/issue/plan, repo instructions, and domain skill. Use
[decomposition.md](references/decomposition.md) to identify observable behaviors,
acceptance criteria, and dependencies. Choose delivery before edits: one cohesive
unit in one PR; strict chains of at least two review units in `gh-stack`; independent
paths in separate PRs/stacks. Plan stack names/order, keep each layer buildable
against its direct base, and put dependencies in the same or lower layer.

Load `tdd` for behavior changes; a named docs/config/generated-artifact exception
must change no executable behavior. Slice UI→API→storage, command→effect, or
similar end-to-end behavior rather than layers. Resolve shared types/schemas/API
foundation locally or with exactly one worker before consumers. Assign disjoint
files, migrations, generated clients, routes, types, and fixtures. Group tiny
related tasks instead of multiplying workers.

Use [worker-contract.md](references/worker-contract.md) and preserve `AFK`/`HITL`
under [hitl-checkpoints.md](references/hitl-checkpoints.md). HITL requires the
named stop and evidence before continuation. Rendered UI uses `design` production
guidance, interaction guidance when material, and `frontend-ui-validation`.

The orchestrator reads every worker result using [integration.md](references/integration.md),
checks ownership and TDD/valid exception, resolves integration issues locally,
and runs relevant verification on the integrated tree. These are the completion
checks; extra review teams are not implied.

Publish only under AGENTS authority or deliver a verified local checkpoint.
The orchestrator owns stack submission and focused `pr-proof-pack` freshness/proof
for each layer; workers return edits/evidence, not independently published shared
branches. Apply exact-head Review and persistent PR Sign-off gates to every layer
before readiness/merge. Report integrated outcome, verification, and real blockers
concisely, with delivery shape matching the dependency graph.
