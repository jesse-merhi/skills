---
name: design
description: 'Route UI design work among production visual design, interaction and motion implementation, read-only motion review, and explicit multi-variant prototyping.'
---

# Design

Deliver the requested UI result, interaction, motion review, or explicitly
requested set of alternatives. Keep the work and report within that mode.

Select the applicable reference set:

| Result | Guidance |
| --- | --- |
| Production layout, hierarchy, typography, colour, components, responsive UI | [frontend.md](references/frontend.md) |
| Transitions, gestures, springs, easing, timing, interruption, component feel | [motion.md](references/motion.md) |
| Read-only review of existing motion | [motion-review.md](references/motion-review.md), then [motion-review-standards.md](references/motion-review-standards.md) before final findings |
| Explicitly requested alternatives, variants, or prototype | [prototype.md](references/prototype.md) and [prototype-picker.md](references/prototype-picker.md) |

For interaction work, add [motion-opportunity-audit.md](references/motion-opportunity-audit.md)
when finding opportunities, [gesture-design.md](references/gesture-design.md)
for complex gestures, or [animation-vocabulary.md](references/animation-vocabulary.md)
to identify an effect. Load only relevant guidance. Production UI and motion
may be combined for the same result.

Do not turn difficult design choices into unsolicited prototypes, or a review
into implementation. In motion review, discover genuine interaction problems
before filtering the actionable findings. For implementation, make rendered
proof part of completion through `frontend-ui-validation` or the repository's
native UI workflow. Preserve the selected mode's required checks without
adding an optional verification team or unrelated final sweep.
