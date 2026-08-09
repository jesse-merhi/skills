---
name: wait-what
description: 'Re-pitch the preceding explanation after it did not land. Use only when the user explicitly invokes this skill.'
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

Return the re-pitch as the whole response. Let the user decide whether it now
lands before continuing the original explanation or task.

This skill is adapted from Matt Pocock's `wait-what` skill. Its MIT license is
in [upstream-license.md](references/upstream-license.md).
