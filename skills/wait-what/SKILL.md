---
name: wait-what
description: Re-pitch an explanation after it did not land, or supply the reader-reset pass when speak-fking-english composes it before a final response. Use for an explicit wait-what request or when the final-response skill loads it.
---

# Wait, What?

Re-pitch the explanation that did not land:

1. Back up far enough to restore the missing premise or context.
2. Lead with the idea in everyday language. Introduce its technical name only
   after the idea is clear.
3. Use simple words, short sentences, and a concrete example when it helps.
4. Use only the technical vocabulary needed to understand or act. Match the
   technical density to the expertise the user has shown.
5. Prefer the project's established terms from `CONTEXT.md` when it exists.
   Briefly define any term that may still be unfamiliar.
6. Keep the re-pitch concise while preserving the important nuance.

When the user invokes this skill directly, return the re-pitch as the whole
response and let the user decide whether it now lands. When
`speak-fking-english` loads it, apply the same reset to the draft and continue to
that skill's visual decision before returning the final response.

This skill is adapted from Matt Pocock's `wait-what` skill. Its MIT license is
in [upstream-license.md](references/upstream-license.md).
