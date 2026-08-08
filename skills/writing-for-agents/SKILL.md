---
name: writing-for-agents
description: 'Write or edit documents consumed by agents, including skills, AGENTS.md, CLAUDE.md, and docs reached through context pointers. Use when changing agent instructions or skill behavior.'
---

# Writing For Agents

Treat every document an agent consumes as part of one instruction system:
skills, `AGENTS.md`, `CLAUDE.md`, and documents reached through pointers all use
the same levers to make the agent's process predictable.

When the target is a skill, also read
[SKILL-MECHANICS.md](SKILL-MECHANICS.md) for invocation metadata, splitting,
and router skills. The upstream MIT notice is in
[upstream-license.md](references/upstream-license.md).

## Context Pointers

A context pointer is text already in the agent's context that names material
outside it and says when to load that material. A skill description is one. An
`AGENTS.md` line naming another document is the same object.

Write the pointer so its condition is unmistakable. Its wording, rather than
the target's quality, decides whether the agent reaches the material.

A pointer does two jobs: state what the material is and name each distinct
branch that should trigger it.

- Front-load the leading word that should trigger retrieval.
- Use one trigger per real branch. Collapse synonyms for the same branch.
- Remove identity or explanation the target already carries.

## The Two Loads

Budget two different costs:

- **Context load**: tokens and attention spent on instructions loaded every
  turn, whether or not they apply.
- **Cognitive load**: what the human must remember about which documents or
  skills exist and when to reach for them.

Material behind a pointer escapes most context load but still spends the
pointer's line. Material with no pointer spends cognitive load because the
human becomes its index. Spend cognitive load where human judgment matters;
remove it where reliable automatic retrieval is better.

## Information Hierarchy

Separate two content types:

- **Steps**: ordered actions the agent performs.
- **Reference**: definitions, rules, examples, and facts consulted on demand.

Place them on this hierarchy:

1. In-file steps.
2. In-file reference needed by every path.
3. Disclosed reference behind a context pointer.

Use progressive disclosure to move branch-specific reference down the ladder.
Keep what every branch needs inline. Too little disclosure creates sprawl; too
much hides instructions the agent needs on every run.

Co-locate a concept's definition, rules, and caveats under one heading. Grouped
material reads like documentation; scattered material makes the agent rebuild
the concept from fragments.

## Steps And Completion Criteria

End every step with a completion criterion that is both clear and demanding:

- **Clarity** lets the agent distinguish done from not done.
- **Demand** determines the legwork required before done is true.

Prefer checkable, exhaustive criteria such as “every modified model accounted
for” over vague output requests such as “produce a change list.” Sharpen the
criterion before adding more process.

Visible later steps can pull attention toward being finished and cause
premature completion. When a criterion cannot be made sharper and the rush is
observed, split the sequence across a real context boundary so later steps are
not loaded yet.

## Leading Words

Use a leading word: a compact concept already present in model pretraining that
anchors behavior. Repeat the token, not its full definition.

A leading word anchors execution in the body and invocation in a pointer. Use
words that already carry the desired shape, such as _tight_, _frontier_, or
_red_, before inventing a new term that needs its own explanation.

State the positive target behavior. Negation repeats the unwanted behavior and
makes it more available. Keep a prohibition only for a hard guardrail that
cannot be expressed positively, and pair it with what to do instead.

## Pruning

Keep each meaning in one authoritative place. Repeating a meaning creates
duplication; repeating a leading word creates a useful anchor.

Treat the environment as a source of truth. Scripts, configuration, directory
layout, and `--help` output already document facts an agent can cheaply inspect.
A prose copy is a cache, and it earns its load only when the lookup is costly.
Cache unwritten conventions, reasons, and gotchas; leave cheap mechanical facts
in the environment where they cannot drift.

Review every line with three tests:

1. **Relevance**: does it still bear on this document's job?
2. **Single source**: is this meaning authoritative here and nowhere else?
3. **No-op**: does it change behavior compared with the model's default?

Delete a sentence that fails. Continually adding without pruning produces
sediment: stale layers that obscure the live instructions.
