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

Use this for a requested rewrite, de-slop pass or removal of AI-sounding prose. Match the intended reader and voice. Work on the supplied writing, not identifiers, APIs or unrelated code.

- Replace grand claims and vague metaphors with the specific event, mechanism or consequence. If the text supplies no supporting fact, remove the claim rather than inventing one.
- Cut promotional adjectives, empty importance claims, generic conclusions and chatbot praise or greetings.
- Remove repeated ideas, synonym cycling and forced patterns such as three-part lists or “not just X, but Y” when they add no meaning.
- Name the actor and action. Split sentences that need rereading; vary sentence length naturally instead of imposing one rhythm.
- Make attribution specific. Keep the source and what it supports; do not substitute “experts say” or a publication name for evidence.
- Keep the actual uncertainty. Remove stacked hedges without turning an estimate or possibility into a fact.
- Keep formatting and punctuation that help the reader. Remove decorative emphasis and mechanical sectioning; do not treat a punctuation mark as proof that prose is AI-written.
- Preserve useful personality and the author's opinions. Do not replace a distinctive voice with bland professional boilerplate.

Preserve facts, scope, material qualifications, evidence and requested next actions. Keep quotations, code, logs, commands, proper names and bug-significant characters exact. Do not invent measurements, sources or personal experience.

Finish with `speak-fking-english` for concise, understandable language. That skill does not call this one. Return the revised text in the requested format, not a catalogue of edits or an extra review workflow.
