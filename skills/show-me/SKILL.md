---
name: show-me
description: Make complex explanations and completed-work handoffs easier to understand with the smallest useful visual. Use when explaining control or data flow, architecture, code shape, before-and-after behavior, multi-step results, state changes, or any final response whose relationships are hard to hold in prose alone.
---

# Show Me

Make the reader understand the shape of the idea without making them decode the
implementation. Use one focused visual when it materially shortens or clarifies
the explanation. Omit it when a sentence or short list is clearer.

This skill is adapted from HumanLayer's `show-me` skill. Read
[references/upstream-license.md](references/upstream-license.md) for attribution.

## Reader Contract

Lead with the outcome. Back up far enough to restore the premise the reader is
missing, then use everyday language before technical vocabulary. Match the
detail to the reader and keep the explanation next to the visual it supports.

The visual must answer one concrete question. Include only the calls, files,
props, states, actors, or boundaries needed to answer it.

## Choose the Smallest Useful View

- **Algorithm or rule:** use short pseudocode.
- **Runtime behavior:** use a shallow call tree.
- **UI composition:** use a TSX-shaped component tree with only meaningful
  props and states.
- **Ownership or refactor:** use a shallow file-responsibility tree.
- **Before and after:** use a focused diff of the component, file, call, or state
  flow.
- **Actors, decisions, data, or state:** use a small Mermaid diagram.
- **Mostly new, copyable code:** show the focused code block rather than a
  diagram of it.
- **Dense, interactive, or spatial explanation:** load `html-explanations` and
  create the smallest standalone page that answers the reader's question.

These are options, not a checklist. Most explanations need one. A comparison
table is useful only when several items share stable comparison axes.

## Build the Visual

1. State in one sentence what the reader should learn.
2. Pick the smallest view from the list above.
3. Start with the actor, event, or concept the reader already recognizes.
4. Use short labels and one direction of travel.
5. Remove implementation names unless the reader must inspect or change them.
6. Put the explanation immediately before or after the visual.

Use GitHub-renderable fenced text, `diff`, or Mermaid for chat and PR bodies.
Validate Mermaid before relying on it. A visual explains a relationship; it is
not proof that behavior ran. When evidence matters, pair it with the required
rendered or screenshot proof from the owning workflow.

## Final Response Checkpoint

Run this checkpoint immediately before sending a substantial explanatory or
completed-work response:

1. Name the one relationship, sequence, state change, or before-and-after shape
   that is hardest to hold in prose.
2. Add the smallest useful visual if it makes that idea easier to understand.
3. Remove decorative visuals and repeated prose.
4. Re-read the result as someone who did not see the working session.

Do not invoke `wait-what` automatically here. `wait-what` is a user-invoked
re-pitch after an explanation misses; this checkpoint makes the first
explanation legible without replacing it wholesale.

## Done Means

- The reader sees the outcome before the mechanism.
- Any hard-to-hold relationship has one small, understandable visual.
- The visual and nearby text use the same plain-language nouns.
- Simple answers remain simple.
- Evidence is still supplied by the workflow that owns verification.
