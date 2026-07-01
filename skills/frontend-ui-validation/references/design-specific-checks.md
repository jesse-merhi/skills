# Design-Specific Checks

If the UI uses dark mode, theme variants, density modes, or auth/empty states,
validate each one the user can reasonably reach.

For Figma/mockup/reference work:

1. Read the reference first.
2. Identify the 5-10 visual facts that matter: layout, hierarchy, spacing, type,
   color, and key states.
3. Use read-only browser evaluation or computed styles to compare values where
   possible.
4. Use screenshots for composition and visual mismatch.

For operational apps, look especially for:

- table/header/body misalignment
- badges or labels clipping in narrow cells
- long names/emails wrapping badly
- sticky bars covering content
- empty states that shove controls off-screen
- modals too tall for mobile
