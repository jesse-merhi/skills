---
name: grill-with-docs
description: 'Ground a plan in repo docs, code, Obsidian notes, ADRs, specs, and tickets, then grill its decisions.'
---

# Grill with docs

Use current project evidence to prepare and conduct a `grilling` session.
The interview must settle the user's decisions, not replace them with guesses.

1. Before judging the plan, search the sources in
   [grounding.md](references/grounding.md). Batch independent docs, code, and
   Obsidian reads. Verify unfamiliar or current claims from their source.
   Mark copied wording as a quotation and separate it from your interpretation.
2. List the plan's concepts, system names, state changes, user outcomes, and
   implied invariants. Compare them with existing code and documentation.
   Prefer established terms and flag invented or overloaded names and domain gaps.
3. Load `grilling`. Map the decision tree and ask its complete settled frontier
   in numbered rounds. Recommend an answer for each question, dispatch background
   fact-finding as that skill requires, and wait for the user's decisions.
4. Use [session-behavior.md](references/session-behavior.md) throughout: challenge
   glossary gaps, sharpen vague language, test concrete scenarios, cross-check
   code claims, assess UI readiness, update context, and offer warranted ADRs.
   Ask which ADR supports a choice, which code path proves feasibility, what
   the first tracer-bullet ticket does, what assumption could fail, and which
   acceptance criteria cannot yet be tested. For UI, establish design direction,
   viewport states, and expected `frontend-ui-validation` proof.
5. If the subject cannot fit a useful session, suggest splitting it into explicit
   decisions or tickets. Otherwise continue until executable and user-confirmed.
   Report a grounding change when it changes the questions or recommendations.
6. Return the tightened plan, assumptions, and first ticket, or concise blockers
   if it remains unready. Use Grounding, What Holds Up, Gaps, Tightened Plan, and
   Next Round only where useful. When the plan is ready, stop asking new questions;
   make any outstanding confirmation the next round before proceeding.

Use [context-format.md](references/context-format.md) for a glossary note and
[adr-format.md](references/adr-format.md) for an ADR that is genuinely warranted.
