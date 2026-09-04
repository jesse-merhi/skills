---
name: writing-for-agents
description: 'Write agent-facing skills, AGENTS.md, CLAUDE.md, and linked docs with precise behavioral instructions.'
---

# Writing for agents

Make the combined instruction system predictable across skills, AGENTS.md,
CLAUDE.md, and linked documents. Resolve contradictions at the owning instruction
before adding another rule. Ordinary execution should proceed from clear criteria;
genuine user decisions and permissions stay explicit.

## Establish the contract and owner

For a skill, load `model-writing-guides` and
[SKILL-MECHANICS.md](SKILL-MECHANICS.md) before drafting. Produce a complete prompt
for every supported profile while preserving outcome, permissions, exact commands,
and evidence. Keep each meaning in one authoritative place and co-locate its
definition, rules, and caveats. Preserve [upstream-license.md](references/upstream-license.md).

## Put the right information in context

Steps are ordered actions; references are definitions, rules, examples, and facts.
Keep steps and every-path reference inline. Put conditional or advanced reference
one hop from SKILL.md; reference files cannot chain to other references and may
link only to their own SKILL.md within `skills/`. Keep SKILL.md at most 500 lines
and every-turn skills in one file. Each extra read costs another model return.

A context pointer controls retrieval, whether it is a description or an AGENTS
line. Front-load a familiar leading word and state both what is behind it and
all distinct trigger branches. Collapse synonyms and omit target identity already
obvious there. Balance always-loaded token/attention cost against the human
burden of remembering unlinked material. Automate reliable retrieval and preserve
human judgment where it is actually needed.

## Define completion that supports action

End every step with a clear demanding criterion that distinguishes done from
unfinished. Require exhaustive accounting where appropriate, not vague artifact
requests. Sharpen the criterion before adding process. If premature completion
is observed and criteria cannot be made sharper, split the sequence across a
real context boundary so later steps cannot distract from unfinished work.

Use learned anchor words such as tight, frontier, or red, repeating the anchor
rather than its explanation. State desired behavior positively; pair necessary
hard prohibitions with the allowed alternative. Do not use redundant caution to
create extra permission rounds for already-authorized work.

## Prune against the real environment

Scripts, config, directory layout, and `--help` are live sources. Prose should
cache costly lookups, unwritten conventions, reasons, or gotchas rather than cheap
mechanical facts. Test every line for relevance, unique ownership, and actual
behavioral effect beyond model defaults. Delete failures and stale sediment.
