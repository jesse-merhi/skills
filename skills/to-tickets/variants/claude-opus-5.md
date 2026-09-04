---
name: to-tickets
description: 'Turn a plan or spec into tracer-bullet Obsidian tickets with blockers and logical PR groups.'
---

# To tickets

Deliver an approved set of behavior-focused Obsidian tickets with real blockers
and cohesive PR groups. Keep each note short enough to execute without losing
acceptance criteria or its ordered work phases.

## Plan from evidence

Read the supplied spec or note in full and use relevant conversation, code,
glossary, ADRs, and project notes. Consider necessary prefactoring as part of
the plan. Use [ticket-design.md](references/ticket-design.md) for end-to-end
slicing, wide refactors, and blocker validation. A ticket without blockers is
ready to start.

Derive PR groups independently from ticket count. Preserve the approved spec's
delivery shape unless the detailed graph disproves it. A strict chain of at
least two review groups uses `gh-stack`; independent paths use separate PRs or
stacks. Do not force parallel work into a linear chain.

## Approval and notes

Present one numbered breakdown containing each title, blockers, `AFK`/`HITL`,
PR group/delivery, outcome, acceptance criteria, and any UI state/viewport.
Ask the user to settle granularity, dependencies, and grouping, including merges
or splits. Publish only after both graph and delivery map are approved.

Use [note-template.md](references/note-template.md),
[naming.md](references/naming.md), and
[execution-contract.md](references/execution-contract.md) for Obsidian `Issues/`.
If write access is missing, return the Markdown bodies and proposed paths.
Leave the parent spec unchanged unless asked. End with the delivered set and
any actual blocker, without an additional verification team or filler report.
