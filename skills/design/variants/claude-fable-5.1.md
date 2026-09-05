---
name: design
description: 'Route UI design work among production visual design, interaction and motion implementation, read-only motion review, and explicit multi-variant prototyping.'
---

# Design

1. Identify what the user wants: production UI, interaction work, a motion
   review, or explicitly requested prototype alternatives. Use the request and
   existing product context to choose. Do not expand a review into fixes.
2. Load the references for that work. Batch independent context reads.
   - Production layout, hierarchy, typography, colour, components, and responsive
     states: [frontend.md](references/frontend.md).
   - Transitions, gestures, springs, easing, timing, interruption, and component
     feel: [motion.md](references/motion.md). For opportunities add
     [motion-opportunity-audit.md](references/motion-opportunity-audit.md); for
     complex gestures add [gesture-design.md](references/gesture-design.md); to
     identify an unfamiliar effect add
     [animation-vocabulary.md](references/animation-vocabulary.md).
   - Read-only motion review: [motion-review.md](references/motion-review.md), then
     [motion-review-standards.md](references/motion-review-standards.md) before
     final findings.
   - User-requested alternatives, variants, or prototypes:
     [prototype.md](references/prototype.md) and
     [prototype-picker.md](references/prototype-picker.md).
3. Complete the selected task. Production UI and interaction guidance may be
   combined when both affect the same result. Do not create alternatives merely
   because a design choice is difficult. During long work, give short updates
   when the direction, rendered result, or blocker changes.
4. For implemented UI, run `frontend-ui-validation` or the repository's native
   rendered-UI workflow. Show the resulting interface and relevant interaction.
   Keep motion-review output read-only unless fixes were also requested.
