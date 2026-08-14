---
name: grill-with-docs
description: 'Ground a plan in repo docs, code, Obsidian notes, ADRs, specs, and tickets, then grill its decisions.'
---

# Grill With Docs

Run a `grilling` session after grounding the plan in project context.
`grilling` is the interview primitive; this skill adds docs, code, and Obsidian
context before the questioning starts.

## Workflow

1. Locate project context before judging or questioning the plan. Use
   [grounding.md](references/grounding.md) for the search targets.
2. Extract the plan's nouns and verbs: product concepts, system names, state
   transitions, user-visible outcomes, and implied invariants.
3. Compare those terms against existing docs and code. Prefer existing
   vocabulary. Flag invented terms, overloaded names, and domain gaps.
4. Run `grilling`: map the decision tree, ask the whole settled frontier in a
   numbered round, provide a recommended answer for each question, dispatch
   background fact-finding, and put decisions to the user.
5. Use these prompts as useful pressure points during grilling:
   - Which existing decision or ADR does this rely on?
   - Which code path proves the plan is implementable?
   - What behavior is the first tracer-bullet ticket?
   - What assumption would make the plan fail?
   - Which acceptance criterion is still vague or untestable?
   - If the plan changes rendered UI, what design direction, viewport states,
     and `frontend-ui-validation` proof will review require?
6. Apply the session behaviors in
   [session-behavior.md](references/session-behavior.md): glossary challenges,
   fuzzy-language sharpening, concrete scenarios, code cross-checks, UI
   readiness, context updates, and ADR offers.
7. If the work is too large or foggy for one session, point the user to
   `wayfinder` instead of forcing the whole journey through one grill.
8. Continue until the plan is clear enough to execute and the user confirms the
   shared understanding.
9. Return either a tightened plan with assumptions and first ticket made clear,
   or a short set of blockers/questions if the plan is not ready.

## Output Shape

Prefer short sections:

- `Grounding`: docs/code/notes inspected
- `What Holds Up`: parts supported by evidence
- `Gaps`: unclear terms, missing decisions, weak assumptions
- `Tightened Plan`: revised plan or first ticket
- `Next Round`: the settled frontier the user should answer next

When the plan is ready, stop asking and give the tightened plan. If the user has
not confirmed the shared understanding, make the confirmation request the next
round instead of proceeding.

## Context Pointers

- Use [grounding.md](references/grounding.md) for project context search
  targets.
- Use [session-behavior.md](references/session-behavior.md) for how to
  challenge terminology, code claims, scenarios, and UI readiness.
- Use [context-format.md](references/context-format.md) when writing or
  proposing a project glossary note.
- Use [adr-format.md](references/adr-format.md) when an ADR is genuinely
  warranted.
