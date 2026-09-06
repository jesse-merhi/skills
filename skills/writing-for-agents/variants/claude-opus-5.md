---
name: writing-for-agents
description: 'Write skills, AGENTS.md, and other agent instructions in clear, practical language.'
metadata:
  source: https://github.com/mattpocock/skills
  source-path: skills/productivity/writing-for-agents
  source-revision: 6654f6b60cd9d5be8b54c6fafe44346dabeb3b76
---

# Writing for agents

Write as though you're explaining the job to a capable colleague. Explain what matters, give useful examples, and leave ordinary decisions to the agent. When shortening, remove unnecessary ideas rather than making sentences denser.

Prefer direct instructions over lists of anti-patterns. Keep necessary commands, permissions, and non-obvious gotchas. Familiar concepts and speculative mistakes rarely need explaining.

## Shape the document

Let the skill's name and description explain its purpose and when to use it. Start the body with useful guidance instead of repeating that introduction.

Use numbered stages when their order helps, and templates when they provide a useful starting point. Keep both brief and adaptable. Explain what a good result needs; reserve fixed steps and explicit completion checks for work where they materially protect correctness or safety.

For example, write "Explain what changed, why it matters, and show the result." A fixed four-sentence opening and another checklist of the same questions add little.

Keep skills and saved explanations concise and easy for a person to read. Do not manually wrap prose lines.

## Give each instruction one home

Read the relevant skills, AGENTS.md, CLAUDE.md, and linked documents together. Resolve contradictions at their owner instead of adding another rule.

Keep instructions needed on every path inline. Put conditional commands and substantial examples in references. Link supporting files and explain when to read them in the body. References may link only to their own SKILL.md among files under `skills/`, not to other references. Extra files cost extra reads; keep every-turn skills in one file and SKILL.md within 500 lines.

Use familiar terms consistently. Let scripts, configuration, and `--help` own mechanical details; retain prose for useful context and gotchas.

Record verified upstream URLs and known paths or revisions in frontmatter metadata.

## Skill mechanics

Preserve existing invocation policy unless the user requests a change. A model-invoked skill is discoverable without being named, but its description uses context on every turn; state its distinct triggers precisely. A user-invoked skill trades that cost for the human remembering to invoke it; keep its summary short. In Codex, user-invoked skills use `policy.allow_implicit_invocation: false` in `agents/openai.yaml`; model-invoked skills omit that policy.

Split off a model-invoked skill only for a distinct trigger or a skill that other workflows must reach. Split a sequence only when visible later steps repeatedly cause premature completion and a clearer completion criterion has not helped; an inline call does not create a new context boundary. If user-invoked skills become hard to remember, one user-invoked router can explain the choices without invoking hidden skills for the user.

## Model variants

Read the existing variants, shared resources, and the model guides below before editing. Maintain complete `variants/<profile>.md` prompts for all four supported models, not overlays or routing prompts. Preserve behavior, permissions, exact commands, evidence, and completion criteria; model advice does not authorize extra gates or delegation.

File presence records coverage. Keep root `SKILL.md` linked to `variants/gpt-5.6.md` and share scripts, references, assets, and metadata unless runtime behavior differs. Validate affected profiles with independent agent exercises and the materializer test; check that one complete prompt loads directly and shared behavior remains equivalent.

For a new model, add its official guide and complete skill variants, then update the matcher and same-family rank in `scripts/materialize-skill-variants.mjs`. The materializer owns fallback and the once-per-session warning until coverage exists. Keep source links and review dates in the four model guides; refresh them when needed.

Keep edits and validation within the requested scope; preserve required independent exercises without adding optional worker rounds. Installation and model switching follow repository `INSTALL.md` and README; a prompt edit does not authorize either.

## References

- [GPT-5.6](references/gpt-5.6.md): use when writing its variant.
- [Astra](references/gpt-6-astra.md): use when writing its variant.
- [Fable](references/claude-fable-5.1.md): use when writing its variant.
- [Opus](references/claude-opus-5.md): use when writing its variant.
