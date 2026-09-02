# Prototype UI variants

Use this mode only when the user explicitly requests a prototype, alternatives,
or several design directions. Explore one UI decision with three distinct
directions by default and at most five.

- Give every direction a name and a meaningful axis such as layout, density,
  personality, motion, or interaction model.
- Use realistic content and working interactions.
- Reuse the project's stack, tokens, components, and dependencies.
- Keep prototype routes and modules isolated from production imports.
- Render one direction at a time in realistic context.
- Use `references/prototype-picker.md` for the picker contract.
- Verify every direction at wide and narrow widths, including keyboard, focus,
  reduced motion, and console behavior.

Present each direction's axis, when it wins, and its cost. Stop for the user's
selection. After selection, integrate only the winner and remove prototype-only
code unless the user asks to keep it.
