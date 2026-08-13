---
name: wait-what
description: Re-pitch an explanation after it did not land, or supply the reader-reset pass when speak-fking-english composes it before a final response. Use for an explicit wait-what request or when the final-response skill loads it.
---

# Wait, What?

## Reader Reset

1. Find the missing premise.

   Identify the smallest piece of context the reader needs before the idea can
   make sense.

   Done when that premise can be stated in one or two sentences without relying
   on the preceding explanation.

2. Rewrite for this reader.

   Lead with the idea in everyday language and introduce its technical name only
   after the idea is clear. Use simple words, short sentences, and a concrete
   example when it helps. Match technical density to the reader's demonstrated
   expertise. Prefer established terms from `CONTEXT.md` when it exists and
   briefly define any term that may still be unfamiliar.

   Done when the reader can understand or act without recovering context from
   the failed explanation, while the important nuance remains.

3. Hand back the reset.

   When the user invokes this skill directly, return the re-pitch as the whole
   response and let the user decide whether it now lands. When
   `speak-fking-english` loads it, return the revised draft to that skill.

   Done when the result follows the return path expected by the caller.

This skill is adapted from Matt Pocock's `wait-what` skill. Its MIT license is
in [upstream-license.md](references/upstream-license.md).
