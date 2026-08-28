# Production UI

Shape the interface around the product and its existing design system, then
implement and inspect the complete rendered result.

1. Read the audience, platform, vocabulary, acceptance criteria, product docs,
   tokens, and representative existing components.
2. Name the visual direction in one sentence. Preserve established conventions
   unless the requested outcome justifies changing the system.
3. Reuse the project's components and installed dependencies. Extend a shared
   component when its existing contract is close; do not rebuild it at the call
   site.
4. Implement the relevant loading, empty, error, disabled, overflow, long-copy,
   narrow-viewport, keyboard, focus, and touch states.
5. Build hierarchy with content order, typography, spacing, placement, and
   existing colour tokens before decoration. Preserve useful density and avoid
   turning every group into a card.
6. Inspect the rendered result at supported widths and states. Report what was
   visibly checked and any remaining risk.

When motion or gestures materially affect the result, also read
[motion.md](motion.md).
