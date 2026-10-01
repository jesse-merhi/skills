---
name: design
description: 'Design or refine interfaces around the product, its users, and a clear visual direction.'
metadata:
  license: Preserve the upstream notice in [LICENSE](LICENSE) when redistributing adapted material.
  sources: |
    - adapted from [skills/emil-design-eng](https://github.com/emilkowalski/skills/tree/d16ebe60d09a5ba2afcb7054ede9d0a10c9f6128/skills/emil-design-eng) — recorded upstream review.
    - adapted from [skills/find-animation-opportunities](https://github.com/emilkowalski/skills/tree/d23d7f88a2e21c9e4b1418c7abe420f5c1052ba7/skills/find-animation-opportunities) — recorded upstream review.
    - adapted from [skills/apple-design](https://github.com/emilkowalski/skills/tree/d16ebe60d09a5ba2afcb7054ede9d0a10c9f6128/skills/apple-design) — recorded upstream review.
    - adapted from [skills/animation-vocabulary](https://github.com/emilkowalski/skills/tree/d23d7f88a2e21c9e4b1418c7abe420f5c1052ba7/skills/animation-vocabulary) — recorded upstream review.
    - adapted from [skills/prototype](https://github.com/emilkowalski/skills/tree/d23d7f88a2e21c9e4b1418c7abe420f5c1052ba7/skills/prototype) — recorded upstream review.
    - adapted from [skills/review-animations](https://github.com/emilkowalski/skills/tree/d23d7f88a2e21c9e4b1418c7abe420f5c1052ba7/skills/review-animations) — recorded upstream review.
    - adapted from [skills/animate](https://github.com/emilkowalski/skills/tree/d16ebe60d09a5ba2afcb7054ede9d0a10c9f6128/skills/animate) — practical motion recipes.
    - adapted from [skills/mobile-native](https://github.com/emilkowalski/skills/tree/d16ebe60d09a5ba2afcb7054ede9d0a10c9f6128/skills/mobile-native) — mobile web guidance.
    - adapted from [skills/animate-expo](https://github.com/emilkowalski/skills/tree/d16ebe60d09a5ba2afcb7054ede9d0a10c9f6128/skills/animate-expo) — native motion guidance.
    - Informed by [Anthropic frontend-design](https://github.com/anthropics/skills/blob/main/skills/frontend-design/SKILL.md), researched 2026-09-05; not an installed dependency.
---

# Design

Start with the user's task and real content. Read existing screens, components, tokens, and any anti-references the brief or spec names; preserve the existing visual language unless the brief asks for a new direction, and avoid the anti-references.

Put important content and actions first. Choose fitting hierarchy, type, spacing, and colour; make distinctive choices without inventing a design system for a small change.

When neither the product nor the brief sets a visual direction, avoid these stock defaults: a cream or off-white background, italic accent words in headlines, numbered "01/02/03" section labels, monospace labels, and pill-shaped buttons. When implementing, check the first render: list your other style choices and where each came from, and replace any that are stock rather than drawn from the product or its subject.

For implementation, build a working slice with realistic content and relevant empty, loading, error, and narrow-screen states. Inspect and refine it.

A review reports observed problems and suggestions, not edits. For implementation, use `frontend-ui-validation` or project-native UI checks; reuse applicable evidence.

Show the actual interface and briefly explain consequential choices.

## References

- For layout and visual decisions, use [interface design](references/frontend.md).
- For web animation and gestures, use [motion](references/motion.md).
- For mobile websites, PWAs, viewport, keyboard, or touch problems, use [mobile web](references/mobile-web.md).
- For React Native or Expo animation and gestures, use [native motion](references/native-motion.md).
- For requested alternatives, use [prototypes](references/prototype.md) and the optional [picker](references/prototype-picker.md).
