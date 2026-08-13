---
name: speak-fking-english
description: Run the final reader-first editing pass by composing wait-what and show-me. Use immediately before every final response, including answers, explanations, status reports, reviews, and completed-work handoffs, or when pr-proof-pack requests its final reviewer-facing pass.
---

# Speak Fking English

Run this over the complete draft as the last editing pass before returning or
saving it.

## Final Response Pass

1. Apply the reader reset.

   Load `wait-what` and apply it to the complete draft without changing the
   underlying facts, scope, or requested action.

   Done when the draft meets `wait-what`'s completion criterion.

2. Apply the visual filter.

   Load `show-me` after the reader reset. Give it the complete draft and any real
   evidence supplied by the owning workflow. Apply its support decision without
   replacing or weakening that evidence.

   Done when the draft meets `show-me`'s completion criterion and every evidence
   claim still points to the real behavior that produced it.

3. Return the final draft.

   Remove repeated explanation, unnecessary headings, and session-only jargon.
   For chat, return the revised draft as the whole final response. For a calling
   skill, return the revised reviewer-facing text for that skill to save.

   Done when the output stands alone, contains no duplicated explanation, and
   uses the return path expected by the caller.
