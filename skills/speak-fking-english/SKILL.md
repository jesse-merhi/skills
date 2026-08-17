---
name: speak-fking-english
description: 'Run before every final response: clarify prose, re-pitch confusion, and use visuals only when they help.'
---

# Speak Fking English

Run this over the complete draft as the last editing pass before returning or
saving it.

## Route The Pass

- Before every final response, run the complete pass below.
- For an explicit “wait, what?” or re-pitch request, run only the reader reset.
- For an explicit “show me” or visual-support request, run only the visual
  filter.
- When another skill calls this one, return the revised reviewer-facing text to
  that skill instead of addressing the user directly.

## Complete Pass

1. Apply the [reader reset](references/reader-reset.md) to the complete draft
   without changing its facts, scope, or requested action.

   Done when the reader can understand or act without reconstructing missing
   context.

2. Apply the [visual filter](references/visual-filter.md) after the reader reset.
   Give it the complete draft and any real evidence supplied by the owning
   workflow. Add support only when it materially reduces comprehension effort,
   and never replace or weaken real evidence.

   Done when prose is the explicit choice or the smallest useful support answers
   one clear teaching question, with every evidence claim still pointing to the
   behavior that produced it.

3. Return the final draft.

   Remove repeated explanation, unnecessary headings, and session-only jargon.
   For chat, return the revised draft as the whole final response. For a calling
   skill, return the revised reviewer-facing text for that skill to save.

   Done when the output stands alone, contains no duplicated explanation, and
   uses the return path expected by the caller.

This skill incorporates MIT-licensed guidance adapted from Matt Pocock's
`wait-what` and HumanLayer's `show-me`. See
[references/upstream-licenses.md](references/upstream-licenses.md).
