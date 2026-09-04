---
name: to-tickets
description: 'Turn a plan or spec into tracer-bullet Obsidian tickets with blockers and logical PR groups.'
---

# To tickets

Convert the settled plan into thin, end-to-end tickets with explicit blockers
and a separate map of reviewable PR groups. Publish only the approved breakdown
to Obsidian `Issues/`.

Read the supplied spec or note in full and use conversation context, relevant
code, glossary, ADRs, and existing project decisions. Identify useful prefactoring
without turning the plan into implementation work.

Apply [ticket-design.md](references/ticket-design.md) to vertical slices, wide
refactors, blocker edges, and PR grouping. A ticket with no blockers can start
immediately. Preserve the approved spec's delivery shape unless the detailed
graph disproves it; load `gh-stack` for a strict chain of at least two review
groups, and keep independent paths in separate PRs or stacks.

Present a numbered proposal. Each ticket needs its title, blockers, `AFK` or
`HITL` mode, PR group and delivery, outcome, covered acceptance criteria, and
relevant UI state/viewport. Ask the user to approve granularity, dependency
edges, and PR grouping; revise until both maps are approved.

Write approved notes with [note-template.md](references/note-template.md),
[naming.md](references/naming.md), and the ordered todo rules in
[execution-contract.md](references/execution-contract.md). Without write access,
return complete Markdown bodies and proposed paths. Do not alter or close the
parent spec unless asked.
