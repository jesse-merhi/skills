---
name: grill-with-docs
description: 'Challenge plans, PRDs, implementation ideas, or architecture decisions against repo docs, code, glossary, ADRs, project context, and open questions.'
---

# Grill With Docs

Interview the user about the plan until you reach shared understanding. Walk
down the design tree, resolving dependent decisions one by one. For each
question, provide your recommended answer.

Ask questions one at a time and wait for feedback before continuing. If a
question can be answered by exploring the codebase, docs, or project context,
explore first and bring the evidence back instead of asking.

## Workflow

1. Locate project context before judging or questioning the plan. Use
   [grounding.md](references/grounding.md) for the search targets.
2. Extract the plan's nouns and verbs: product concepts, system names, state
   transitions, user-visible outcomes, and implied invariants.
3. Compare those terms against existing docs and code. Prefer existing
   vocabulary. Flag invented terms, overloaded names, and domain gaps.
4. Grill the plan with concrete one-at-a-time questions:
   - Which existing decision or ADR does this rely on?
   - Which code path proves the plan is implementable?
   - What behavior is the first vertical slice?
   - What assumption would make the plan fail?
   - Which acceptance criterion is still vague or untestable?
   - If the plan changes rendered UI, what design direction, viewport states,
     and `frontend-ui-validation` proof will review require?
5. Apply the session behaviors in
   [session-behavior.md](references/session-behavior.md): glossary challenges,
   fuzzy-language sharpening, concrete scenarios, code cross-checks, UI
   readiness, context updates, and ADR offers.
6. Continue until the plan is clear enough to execute.
7. Return either a tightened plan with assumptions and first slice made clear,
   or a short set of blockers/questions if the plan is not ready.

## Output Shape

Prefer short sections:

- `Grounding`: docs/code/notes inspected
- `What Holds Up`: parts supported by evidence
- `Gaps`: unclear terms, missing decisions, weak assumptions
- `Tightened Plan`: revised plan or first slice
- `Next Question`: the single question the user should answer next

When the plan is ready, stop asking and give the tightened plan.

## Context Pointers

- Use [grounding.md](references/grounding.md) for project context search
  targets.
- Use [session-behavior.md](references/session-behavior.md) for how to
  challenge terminology, code claims, scenarios, and UI readiness.
- Use [context-format.md](references/context-format.md) when writing or
  proposing a project glossary note.
- Use [adr-format.md](references/adr-format.md) when an ADR is genuinely
  warranted.
