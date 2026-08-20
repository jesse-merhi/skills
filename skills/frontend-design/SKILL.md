---
name: frontend-design
description: 'Design production UI: layout, hierarchy, typography, color, responsive states, systems, and polish.'
---

# Frontend design

Shape interfaces around the product and its existing system, then implement the
complete rendered result.

## Workflow

1. Read the product context, audience, platform, vocabulary, and acceptance
   criteria. When the repo owns `PRODUCT.md`, `DESIGN.md`, tokens, or a project
   context skill, use them before choosing a direction.
2. Inspect representative components, theme files, typography, spacing, and
   existing states. Preserve working conventions; change the system only when
   the product outcome justifies it.
3. Name the design direction in one sentence. Make it specific to the task and
   register: product UI should optimize task clarity; brand screens may carry
   more expression.
4. Implement the full screen, including loading, empty, error, disabled, long
   content, narrow viewport, keyboard, focus, and touch behavior when relevant.
5. When motion, gestures, transitions, micro-interactions, or component feel
   materially affect the result, load `design-engineering` before implementing
   them.
6. Validate visible changes with `frontend-ui-validation` or the repo-owned
   native UI-quality workflow before reporting completion.

## Design principles

### Hierarchy and content

- Make the primary task and next action obvious.
- Use product language instead of design commentary or invented terminology.
- Organize information by user priority, not by the shape of the underlying
  data model.
- Keep recurring controls and states predictable across the product.

### Layout and responsive behavior

- Use the simplest layout model that expresses the relationship.
- Preserve useful density; do not turn every group into a card.
- Test real copy, long names, empty data, and constrained widths.
- Keep primary actions reachable and important content visible at supported
  breakpoints and font scales.

### Typography and color

- Use the existing type scale and color tokens when they exist.
- Build hierarchy with size, weight, spacing, and placement before decoration.
- Meet the repo's contrast standard and avoid color-only meaning.
- Introduce new tokens only when a repeated semantic role needs one.

### Components and states

- Reuse established components and interaction patterns.
- Preserve accessible names, focus behavior, touch targets, and semantic roles.
- Design errors, permissions, loading, emptiness, overflow, and partial data as
  first-class states.
- Treat copy, spacing, responsiveness, accessibility, and edge cases as part of
  the implementation rather than a final cosmetic pass.

## Completion

Do not claim a UI task complete from source inspection alone. Report the
rendered states and viewports checked, the validation performed, and any
remaining risk.
