---
name: grill-with-docs
description: 'Ground a plan in repo docs, code, Obsidian notes, ADRs, specs, and tickets, then grill its decisions.'
---

# Grill with docs

Use repository and project-note evidence to make the `grilling` interview
concrete. Resolve factual questions from those sources; preserve the interview's
user-owned decisions and final confirmation.

## Establish what the project already knows

Read [grounding.md](references/grounding.md) and locate relevant docs, code,
Obsidian notes, ADRs, specs, and tickets before judging the plan. Extract its
concepts, system names, transitions, outcomes, and invariants. Reuse established
vocabulary and expose overloaded names, invented terms, or missing domain concepts.
Already settled decisions are context, not reasons to reopen the interview.

## Test the unsettled decision tree

Load `grilling` for the full settled-frontier rounds, recommendations, background
fact-finding, and user answers. Apply [session-behavior.md](references/session-behavior.md)
to sharpen language, test scenarios and code claims, challenge glossary gaps,
assess UI readiness, update context, and offer ADRs.

Tie questions to evidence: the relied-on ADR, implementing code path, first
tracer-bullet behavior, failure-inducing assumption, and testable acceptance
criterion. For UI, cover design direction, viewport states, and expected
`frontend-ui-validation` proof. Do not ask the user to supply facts the project
can establish. Do put each unresolved decision to them as `grilling` requires.

## Reach a usable conclusion

If the scope is too large or foggy, suggest explicit decisions or tickets to
split it. Otherwise finish with a tightened executable plan, assumptions, and
first ticket, or identify the remaining blockers. Keep Grounding, What Holds Up,
Gaps, Tightened Plan, and Next Round sections short and use only those needed.
When the frontier is settled, stop adding questions; seek any missing shared-
understanding confirmation before proceeding.

Use [context-format.md](references/context-format.md) for glossary notes and
[adr-format.md](references/adr-format.md) when an ADR is warranted.
