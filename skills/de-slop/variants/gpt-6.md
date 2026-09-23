---
name: de-slop
description: 'Rewrite prose to remove AI-like padding and preserve a natural, specific voice.'
metadata:
  license: Preserve the upstream notices in [LICENSE](LICENSE) when redistributing this skill.
  source: https://github.com/cursor/plugins
  source-path: pstack/skills/unslop
  source-revision: 99559f2f52047978602ef365589275831e76af07
---

# De-slop

Match the reader and voice. Rewrite the supplied prose, not identifiers, APIs, or unrelated code.

- Replace grand claims and vague metaphors with the specific event, mechanism, or consequence; remove unsupported claims rather than inventing facts.
- Cut promotional adjectives, empty importance claims, generic conclusions, greetings, and praise.
- Remove repeated ideas, synonym cycling, and forced patterns such as needless three-part lists or “not just X, but Y.”
- Name the actor and action. Split tangled sentences without imposing a uniform rhythm.
- Name the source and what it supports, rather than saying “experts say.” Keep real uncertainty without stacked hedges.
- Keep useful formatting, personality, and opinions. Remove decorative emphasis, not punctuation on principle; avoid bland boilerplate.

Preserve facts, scope, qualifications, evidence, and next actions. Keep quotations, code, logs, commands, proper names, and bug-significant characters exact. Invent no measurements, sources, or experience.

Finish with `speak-fking-english` (which does not call this skill). Return the requested format, not an edit catalogue or extra review workflow.
