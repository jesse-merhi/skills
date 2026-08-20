---
name: speak-fking-english
description: 'Run before every final response: clarify prose, cut AI tells, re-pitch confusion, and use visuals only when they help.'
---

# Speak fking English

Run this over the complete draft as the last editing pass before returning or
saving it.

## Route the pass

- When the model loads this skill as the final-response checkpoint, run the
  shared pass below, skip the deep catalogue pass, and return the result. This
  is the implicit route.
- When the user asks you to use `speak-fking-english`, invokes it with the
  harness's skill syntax, or asks for the full unslop or de-slop pass, run the
  shared pass, add the deep catalogue pass, and then return the result. Merely
  discussing the skill does not select this explicit route.
- For a "wait, what?" or re-pitch request that does not explicitly invoke this
  skill, run only the reader reset.
- For a "show me" or visual-support request that does not explicitly invoke
  this skill, run only the visual filter.
- When another skill calls this one, return the revised reviewer-facing text to
  that skill instead of addressing the user directly. Treat the call as
  implicit unless the user explicitly invoked this skill for that artifact.

## Shared pass

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

3. Apply the [natural-writing pass](references/natural-writing.md) to the
   complete draft, including any support added by the visual filter.

   Done when the result is direct, concrete, easy to follow, and recognisably
   written by a person, with every fact and evidence claim unchanged.

## Deep catalogue pass

Run this only on the explicit route. Apply the
[full AI-tells catalogue](references/ai-tells.md) to the result of the shared
pass. Keep the facts, scope, requested action, intended tone, exact names, and
evidence unchanged.

Done when no catalogued pattern survives and the draft still says exactly what
it needs to say.

## Return

For chat, return the revised draft as the whole final response. For a calling
skill, return the revised reviewer-facing text for that skill to save.

Done when the output stands alone, contains no duplicated explanation, and uses
the return path expected by the caller.

This skill incorporates MIT-licensed guidance adapted from Matt Pocock's
`wait-what`, HumanLayer's `show-me`, and pstack's `unslop`. See
[references/upstream-licenses.md](references/upstream-licenses.md).
