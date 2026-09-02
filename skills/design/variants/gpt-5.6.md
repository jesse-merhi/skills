---
name: design
description: 'Route UI design work among production visual design, interaction and motion implementation, read-only motion review, and explicit multi-variant prototyping.'
---

# Design

Outcome: deliver and validate the requested design result with the least extra
machinery. Choose the design mode that fits, then read only its reference:

- **Production UI:** layout, hierarchy, typography, colour, components,
  responsive states, or implementation. Read
  [frontend.md](references/frontend.md).
- **Interaction and motion:** transitions, gestures, springs, easing, timing,
  interruption, or component feel. Read [motion.md](references/motion.md).
- **Motion review:** read-only findings about existing animation or motion code.
  Read [motion-review.md](references/motion-review.md).
- **Prototype:** several deliberately different UI directions for comparison.
  Read [prototype.md](references/prototype.md). Prototype only when the user
  explicitly requests alternatives, variants, or a prototype.

Combine production UI and interaction guidance when both materially affect the
same result. Keep motion review read-only unless the user also requests fixes.
Do not prototype merely because a design decision is difficult.

Use `frontend-ui-validation` or the repository's native rendered-UI workflow to
verify implemented UI before reporting completion.
