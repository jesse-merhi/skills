---
name: grill-with-docs
description: 'Ground a plan in repo docs, code, Obsidian notes, ADRs, specs, and tickets, then grill its decisions.'
---

# Grill with docs

Deliver a project-grounded decision interview and, when settled, a concise
executable plan with assumptions and a first ticket. Keep source gathering
focused on the plan and avoid an unsolicited documentation rewrite.

Start with [grounding.md](references/grounding.md): inspect relevant docs, code,
and Obsidian context before judging the proposal. Match its concepts, system
names, transitions, outcomes, and invariants to existing vocabulary. Surface
invented terms, overloaded names, and domain gaps with evidence.

Use `grilling` to map the tree, ask the complete settled frontier with a
recommendation per question, wait for decisions, and dispatch bounded background
fact-finding. Group related fact probes where possible. Apply
[session-behavior.md](references/session-behavior.md) for terminology, precise
language, scenarios, code cross-checks, UI readiness, context updates, and ADR offers.

Cover the decisions the evidence exposes: reliance on existing ADRs, a code
path establishing feasibility, the first tracer-bullet behavior, assumptions
that could fail, and vague acceptance criteria. UI plans also need design
direction, viewport states, and expected `frontend-ui-validation` proof. A short
report must not suppress real decision branches.

If one session cannot usefully settle the plan, recommend dividing it into
explicit decisions or tickets. Return compact Grounding, What Holds Up, Gaps,
Tightened Plan, and Next Round sections as needed. Stop generating questions
once the plan is ready; obtain any outstanding user confirmation before action.
For an unready plan, return concrete blockers rather than a premature conclusion.

Use [context-format.md](references/context-format.md) for glossary notes and
[adr-format.md](references/adr-format.md) for warranted ADRs. Keep saved notes
as focused as the chat answer.
