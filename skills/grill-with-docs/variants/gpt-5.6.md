---
name: grill-with-docs
description: 'Ground a plan in repo docs, code, Obsidian notes, ADRs, specs, and tickets, then grill its decisions.'
---

# Grill with docs

Ground a `grilling` interview in current project evidence, then reach a plan the
user confirms is clear enough to execute. `grilling` owns the decision-tree
interview; this skill supplies its factual basis.

Before judging the plan, locate docs, code, and Obsidian context with
[grounding.md](references/grounding.md). Extract product concepts, system names,
state transitions, outcomes, and implied invariants. Compare them with the
existing vocabulary; identify overloaded names, invented terms, and domain gaps.

Load `grilling`. Ask the complete settled frontier in each numbered round,
recommend an answer for each question, dispatch its background fact-finding,
and leave decisions to the user. Apply [session-behavior.md](references/session-behavior.md)
for glossary challenges, precise language, concrete scenarios, code cross-checks,
UI readiness, context updates, and ADR offers.

Useful pressure points are the existing ADR behind a choice, the code path
supporting feasibility, the first tracer-bullet ticket, a failure-inducing
assumption, and vague acceptance criteria. For rendered UI, establish design
direction, relevant viewport states, and expected `frontend-ui-validation` proof.

If the plan is too large or unclear for one session, propose explicit decisions
or tickets to divide it. Return short sections as useful: Grounding, What Holds
Up, Gaps, Tightened Plan, and Next Round. The tightened plan should expose its
assumptions and first ticket; an unready plan needs concrete blockers/questions.
Stop questioning once ready. If confirmation is still missing, make that the
next round before proceeding.

For a glossary note use [context-format.md](references/context-format.md).
For a warranted ADR use [adr-format.md](references/adr-format.md).
