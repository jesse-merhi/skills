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

Start with the user's task and real content. Read existing screens, components, and tokens; preserve their visual language unless the brief asks for a new direction.

Put important content and actions first. Choose fitting hierarchy, type, spacing, and colour; make distinctive choices without inventing a design system for a small change.

For implementation, build a working slice with realistic content and relevant empty, loading, error, and narrow-screen states. Inspect and refine it.

A review reports observed problems and suggestions, not edits. For implementation, use `frontend-ui-validation` or project-native UI checks; reuse applicable evidence.

Show the actual interface and briefly explain consequential choices.

## References

- For layout and visual decisions, use [interface design](references/frontend.md).
- For animation and gestures, use [motion](references/motion.md).
- For requested alternatives, use [prototypes](references/prototype.md) and the optional [picker](references/prototype-picker.md).
