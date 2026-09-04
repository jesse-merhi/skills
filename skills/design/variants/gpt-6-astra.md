---
name: design
description: 'Route UI design work among production visual design, interaction and motion implementation, read-only motion review, and explicit multi-variant prototyping.'
---

# Design

Resolve the design mode from the requested outcome and existing product.
Make routine visual choices within that scope; reserve user questions for
choices that materially change it.

## Apply the relevant guidance

Production UI work—layout, hierarchy, typography, colour, components, responsive
states, or implementation—uses [frontend.md](references/frontend.md).

Interaction work uses [motion.md](references/motion.md) for transitions, gestures,
springs, easing, timing, interruption, and component feel. Read
[motion-opportunity-audit.md](references/motion-opportunity-audit.md) when finding
opportunities, [gesture-design.md](references/gesture-design.md) for complex
gestures, and [animation-vocabulary.md](references/animation-vocabulary.md) when
an effect needs a name. Combine this with production UI guidance when both
materially affect the same result.

A request to review existing motion uses [motion-review.md](references/motion-review.md).
Read [motion-review-standards.md](references/motion-review-standards.md) before
finalizing findings. Review authority remains read-only unless fixes were requested.

A request explicitly seeking alternatives, variants, or a prototype uses
[prototype.md](references/prototype.md) and the picker contract in
[prototype-picker.md](references/prototype-picker.md). Do not treat unresolved
ordinary design choices as permission to prototype.

## Finish in the selected mode

Read only applicable references and carry authorized implementation through
rendered validation with `frontend-ui-validation` or the repository's native
UI workflow. Validate the interface and interaction affected by the work;
retain any mandatory checks in the selected guidance.
