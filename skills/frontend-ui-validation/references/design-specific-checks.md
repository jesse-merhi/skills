# Design-specific checks

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

Also check for repeated generic visual filler, weak type hierarchy, washed-out
muted text, nested containers, monotonous spacing, layout that depends on short
placeholder copy, and motion that delays frequent actions. Treat these as
contextual observations rather than automatic failures.

When motion or interaction feel is material to the change, use
`design` in interaction mode for implementation guidance or motion-review mode for a
focused motion review.
