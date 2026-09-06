---
name: design
description: 'Design or refine interfaces around the product, its users, and a clear visual direction.'
metadata:
  sources: |
    - adapted from [skills/emil-design-eng](https://github.com/emilkowalski/skills/tree/d23d7f88a2e21c9e4b1418c7abe420f5c1052ba7/skills/emil-design-eng) — recorded upstream review.
    - adapted from [skills/find-animation-opportunities](https://github.com/emilkowalski/skills/tree/d23d7f88a2e21c9e4b1418c7abe420f5c1052ba7/skills/find-animation-opportunities) — recorded upstream review.
    - adapted from [skills/apple-design](https://github.com/emilkowalski/skills/tree/d23d7f88a2e21c9e4b1418c7abe420f5c1052ba7/skills/apple-design) — recorded upstream review.
    - adapted from [skills/animation-vocabulary](https://github.com/emilkowalski/skills/tree/d23d7f88a2e21c9e4b1418c7abe420f5c1052ba7/skills/animation-vocabulary) — recorded upstream review.
    - adapted from [skills/prototype](https://github.com/emilkowalski/skills/tree/d23d7f88a2e21c9e4b1418c7abe420f5c1052ba7/skills/prototype) — recorded upstream review.
    - adapted from [skills/review-animations](https://github.com/emilkowalski/skills/tree/d23d7f88a2e21c9e4b1418c7abe420f5c1052ba7/skills/review-animations) — recorded upstream review.
    - Informed by [Anthropic frontend-design](https://github.com/anthropics/skills/blob/main/skills/frontend-design/SKILL.md), researched 2026-09-05; not an installed dependency.
---

# Design

Start with what the person is trying to do and the real content they need. Read the existing screens, components, and design tokens. Preserve the product's visual language unless the brief calls for a new direction.

Choose a clear hierarchy, typography, spacing, and palette that fit the subject. Put the important content and actions first. Make distinctive choices where the brief allows them, not a new design system for every small change.

Build a working slice with realistic content and the relevant empty, loading, error, and narrow-screen states. Inspect it while working; refine what looks unclear or awkward.

A review returns observed problems and useful changes; it does not authorize implementation. For implementation, use `frontend-ui-validation` or the project's native UI checks. Reuse current evidence from the task rather than launching another identical validation pass.

Show the result in the actual interface. Explain consequential choices briefly.

## References

- For layout and visual decisions, use [interface design](references/frontend.md).
- For animation and gestures, use [motion](references/motion.md).
- For requested alternatives, use [prototypes](references/prototype.md) and the optional [picker](references/prototype-picker.md).
