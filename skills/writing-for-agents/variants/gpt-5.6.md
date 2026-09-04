---
name: writing-for-agents
description: 'Write agent-facing skills, AGENTS.md, CLAUDE.md, and linked docs with precise behavioral instructions.'
---

# Writing for agents

Write agent-facing documents as one instruction system: skills, AGENTS.md,
CLAUDE.md, and linked guidance jointly determine behavior. For skill work load
`model-writing-guides` and [SKILL-MECHANICS.md](SKILL-MECHANICS.md) before drafting.
Produce every supported complete variant with equivalent outcomes, permissions,
exact commands, and evidence. Preserve [upstream-license.md](references/upstream-license.md).

## Put each instruction where it is needed

Separate ordered actions from reference definitions/rules/examples. Keep steps
and universally needed reference inline; disclose branch-specific material through
one-hop pointers from SKILL.md. Each file read costs another model return, so do
not hide material every invocation needs. References may link only to their own
SKILL.md among files under `skills/`, not to other references. Keep SKILL.md at
most 500 lines; an every-turn skill is one file. Co-locate each concept's definition,
rules, and caveats under one heading.

A pointer already in context determines whether external material is reached.
Say what it is and each distinct trigger branch unmistakably. Front-load the
leading retrieval word, collapse synonyms, and omit identity/explanation already
in the target. Balance always-loaded token/attention cost with human memory:
without a pointer the human must remember the resource. Spend that cognitive
load on genuine human judgment, not reliable automatic retrieval.

## Specify the result before adding process

End each step with a clear demanding completion criterion: the agent must tell
done from unfinished and account for the whole obligation. Prefer "every modified
model accounted for" to "produce a change list." Sharpen criteria before adding
steps. If observed rushing persists and criteria cannot be improved, split the
sequence at a real context boundary so later steps are not yet visible.

Use familiar leading words such as tight, frontier, or red to anchor behavior.
Repeat the anchor, not its definition. State the desired behavior positively;
retain prohibitions for hard boundaries and pair them with the permitted action.

## Remove instructions that do not earn their load

Keep each meaning authoritative once. Treat scripts, config, layout, and `--help`
as current truth; cache prose only for costly lookups, unwritten conventions,
reasons, and gotchas. Review every line for relevance to the job, a single owner,
and a behavior change beyond the model's default. Delete what fails these tests
instead of accumulating stale instructions.
