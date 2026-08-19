# Visual Filter

Treat this as a visual filter, not a request to draw something. Add support only
when it materially reduces the work needed to understand the idea.

1. State the teaching question.

   Name the one relationship, sequence, state, comparison, spatial result, or
   code shape that support would make easier to understand. If none exists,
   choose prose.

2. Choose the smallest useful form.

   - Algorithm or rule: short pseudocode.
   - Runtime behavior: a shallow call tree.
   - UI composition: a TSX-shaped component tree with meaningful props or
     states.
   - Ownership or refactor: a shallow file-responsibility tree.
   - Before and after: a focused diff or comparison table when stable axes
     matter.
   - Actors, decisions, data, or state: a small Mermaid diagram.
   - Mostly new, copyable code: the focused code block itself.
   - A real visual result: the actual screenshot or recording from the owning
     proof workflow.
   - Genuinely dense, interactive, or spatial material: load
     `html-explanations` only when an interactive page is itself useful.

   Several steps, files, or components do not automatically justify a visual.
   Avoid standalone HTML, synthetic cards, or visualizations whose only job is
   polish.

3. Build and check the support.

   Start with the concept the reader recognizes. Use short labels and one
   direction of travel. Put the explanation beside the support. Use
   GitHub-renderable fenced text, `diff`, or Mermaid in chat and PR bodies, and
   validate Mermaid before relying on it.

   A visual can explain behavior. Only the actual rendered result, interaction,
   request, response, state, or operator outcome can prove it ran.
   Done when the support answers the teaching question, repeats no prose, and
   leaves real evidence intact.
