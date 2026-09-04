---
name: design
description: 'Route UI design work among production visual design, interaction and motion implementation, read-only motion review, and explicit multi-variant prototyping.'
---

# Design

Match the requested result to its design guidance and complete only that scope.

- Build or refine layout, hierarchy, typography, colour, components, or responsive
  UI with [frontend.md](references/frontend.md).
- Implement transitions, gestures, springs, easing, timing, interruption, or
  component feel with [motion.md](references/motion.md). Add
  [motion-opportunity-audit.md](references/motion-opportunity-audit.md) for finding
  opportunities, [gesture-design.md](references/gesture-design.md) for complex
  gestures, or [animation-vocabulary.md](references/animation-vocabulary.md) when
  the desired effect is hard to name.
- Review existing motion read-only with [motion-review.md](references/motion-review.md)
  and read [motion-review-standards.md](references/motion-review-standards.md)
  before finalizing findings. Fixes need a user request.
- Compare deliberately different UI directions only when the user explicitly
  requests alternatives, variants, or a prototype. Follow
  [prototype.md](references/prototype.md) and its picker contract in
  [prototype-picker.md](references/prototype-picker.md).

Load only the relevant references. Combine production UI and motion when both
materially affect the result; uncertainty alone does not call for prototypes.
Verify implemented UI through `frontend-ui-validation` or the repository's
native rendered-UI workflow before completion.
