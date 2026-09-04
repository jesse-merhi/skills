---
name: parallel-slice-orchestration
description: 'Implement specs with parallel agents, disjoint ownership, integration, and verification.'
---

# Parallel slice orchestration

Implement the whole authorized spec through vertical slices, integration, and
verification. The orchestrator owns planning, dependency order, integration,
verification, and publication. Workers own only their assigned slices.

1. Confirm the user explicitly requested subagents, delegation, or parallel
   agent work before spawning. Otherwise produce a slice plan and ask. If the
   harness has no subagents, run the plan sequentially and state that limitation.
2. Read the spec, slice notes, issue, or plan, repo instructions, and relevant
   domain skill. Batch independent preparation. Identify observable behaviors
   and acceptance criteria, then map dependencies with
   [decomposition.md](references/decomposition.md).
3. Choose delivery before editing: one cohesive review unit in one PR; two or
   more strictly dependent review units in `gh-stack`; independent paths in separate
   PRs/stacks. Plan stack branch names/order. Each layer must build and review
   against its direct base, with dependencies in that layer or below.
4. Load `tdd` for behavior-changing slices. Permit a named docs/config/generated-
   artifact exception only when no executable behavior changes. Slice through
   real UI→API→storage, command→effect, or event→state paths, not code layers.
5. Complete blocking shared types/schemas/API foundations locally or with one
   worker. Keep the immediate critical path local. Dispatch independent slices
   together only with disjoint files, migrations, clients, routes, types, and
   fixtures. Prefer fewer well-scoped workers over many tiny assignments.
6. Use [worker-contract.md](references/worker-contract.md). Preserve `AFK`/`HITL`
   with [hitl-checkpoints.md](references/hitl-checkpoints.md). Require evidence
   at HITL stops before continuing. For rendered UI require `design` production
   guidance, interaction guidance when material, and `frontend-ui-validation`.
7. Read each returned result using [integration.md](references/integration.md)
   before integrating. Check ownership and TDD/valid exception. Resolve integration
   issues locally and run package verification on the integrated tree.
8. Publish only when `AGENTS.md` authorizes it; otherwise deliver a verified local
   checkpoint. The orchestrator owns stack submission and separate per-layer
   `pr-proof-pack` freshness/proof. Workers do not publish shared-stack branches.
9. Before readiness or merge, apply AGENTS Review and Sign-off gates to every PR:
   review exact heads; retain valid PR-level sign-off across later heads.

Keep useful local work moving while workers run. Report completed slices,
changed dependencies, integration evidence, or blockers. Completion means all
worker results read, assigned ownership preserved, required checkpoints met,
integrated checks run, and delivery matching the dependency graph.
