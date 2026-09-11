---
name: design
description: 'Route UI design work among production visual design, interaction and motion implementation, read-only motion review, and explicit multi-variant prototyping.'
---

# Design

Choose the design mode that matches the requested outcome, then read only that
mode's references:

- **Production UI:** layout, hierarchy, typography, colour, components,
  responsive states, or implementation. Read
  [frontend.md](references/frontend.md).
- **Interaction and motion:** transitions, gestures, springs, easing, timing,
  interruption, or component feel. Read [motion.md](references/motion.md).
  For motion opportunities, also read
  [motion-opportunity-audit.md](references/motion-opportunity-audit.md); for
  complex gestures, [gesture-design.md](references/gesture-design.md); when the
  effect is hard to name,
  [animation-vocabulary.md](references/animation-vocabulary.md).
- **Motion review:** read-only findings about existing animation or motion code.
  Read [motion-review.md](references/motion-review.md), then
  [motion-review-standards.md](references/motion-review-standards.md) before
  finalizing findings.
- **Prototype:** several deliberately different UI directions for comparison.
  Read [prototype.md](references/prototype.md) and
  [prototype-picker.md](references/prototype-picker.md) for the picker
  contract. Prototype only when the user explicitly requests alternatives,
  variants, or a prototype.

Combine production UI and interaction guidance when both materially affect the
same result. Keep motion review read-only unless the user also requests fixes.
Do not prototype merely because a design decision is difficult.

Use `frontend-ui-validation` or the repository's native rendered-UI workflow to
verify implemented UI before reporting completion.
