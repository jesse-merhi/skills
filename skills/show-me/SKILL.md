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

## Visual Filter

1. State the teaching question.

   Name the one relationship, sequence, state, comparison, spatial result, or
   code shape that supporting material would make easier to understand. If no
   such question exists, choose prose.

   Done when the question fits in one sentence or the decision is explicitly
   `prose`.

2. Choose the smallest useful form.

   Match the teaching question to one form:

   - **Algorithm or rule:** short pseudocode.
   - **Runtime behavior:** a shallow call tree.
   - **UI composition:** a TSX-shaped component tree with meaningful props or
     states.
   - **Ownership or refactor:** a shallow file-responsibility tree.
   - **Before and after:** a focused diff or comparison table when stable axes
     matter.
   - **Actors, decisions, data, or state:** a small Mermaid diagram.
   - **Mostly new, copyable code:** the focused code block itself.
   - **A real visual result:** the actual screenshot or recording from the owning
     proof workflow.
   - **Genuinely dense, interactive, or spatial material:** load
     `html-explanations` only when an interactive page is itself useful to the
     reader.

   Several steps, files, or components do not automatically justify a visual.
   Use prose instead of standalone HTML, a synthetic card, or a visualization
   whose only job is polish.

   Done when one form answers the teaching question better than prose, or prose
   remains the explicit choice.

3. Build and check the support.

   Start with the actor, event, or concept the reader recognizes. Use short
   labels and one direction of travel. Keep implementation names only when the
   reader must inspect or change them. Put the explanation beside the support.
   Use GitHub-renderable fenced text, `diff`, or Mermaid in chat and PR bodies,
   and validate Mermaid before relying on it.

   Preserve the boundary between explanation and evidence. A visual can explain
   behavior; only the actual rendered surface, interaction, request, response,
   state, or operator outcome can prove that it ran.

   Done when the support answers the teaching question, repeats no prose, and
   leaves real evidence intact.
