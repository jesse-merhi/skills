---
name: show-me
description: Decide whether an explanation needs supporting visual material, then choose the smallest useful form. Use when explaining control or data flow, architecture, code shape, before-and-after behavior, state changes, comparisons, spatial UI, or when speak-fking-english requests the final visual decision; omit visuals when prose is clearer.
---

# Show Me

Treat this as a visual filter, not a request to draw something. Start from how a
good teacher would explain the content. Add supporting material only when it
materially reduces the work needed to understand the idea.

This skill is adapted from HumanLayer's `show-me` skill. Read
[references/upstream-license.md](references/upstream-license.md) for attribution.

## Reader Contract

Lead with the outcome. Back up far enough to restore the premise the reader is
missing, then use everyday language before technical vocabulary. Match the
detail to the reader. Use a concrete example only when it makes the idea easier
to grasp.

Ask what you would put on a whiteboard while teaching this person. If the answer
is "nothing," use prose. One fact, a short status, a simple outcome, and an easy
list do not need a visual.

## Make the Visual Decision

Use a visual when the content's shape matters and prose would make the reader
reconstruct it:

- **Algorithm or rule:** short pseudocode.
- **Runtime behavior:** a shallow call tree.
- **UI composition:** a TSX-shaped component tree with meaningful props or states.
- **Ownership or refactor:** a shallow file-responsibility tree.
- **Before and after:** a focused diff or comparison table when stable axes matter.
- **Actors, decisions, data, or state:** a small Mermaid diagram.
- **Mostly new, copyable code:** the focused code block itself.
- **A real visual result:** the actual screenshot or recording from the owning
  proof workflow.
- **Genuinely dense, interactive, or spatial material:** load `html-explanations`
  only when an interactive page is itself useful to the reader.

These are options, not a checklist. Several steps, files, or components do not
automatically justify a diagram. Never create standalone HTML, a synthetic card,
or a visualization merely to make an explanation or PR look polished.

## Build Only What Helps

1. State the one question the support should answer.
2. Choose the smallest form that answers it better than prose.
3. Start with the actor, event, or concept the reader recognizes.
4. Use short labels and one direction of travel.
5. Remove implementation names unless the reader must inspect or change them.
6. Put the explanation next to the supporting material.

Use GitHub-renderable fenced text, `diff`, or Mermaid in chat and PR bodies.
Validate Mermaid before relying on it. A visual explains a relationship; it is
not proof that behavior ran. When evidence matters, use the actual rendered
surface, interaction, request, response, state, or operator outcome required by
the owning workflow.

## Done Means

- The reader sees the outcome before the mechanism.
- Plain language carries the explanation whenever it can.
- Any supporting material answers one concrete teaching question.
- Performative visuals and repeated prose are absent.
- Evidence still comes from the real behavior, not an invented explainer.
