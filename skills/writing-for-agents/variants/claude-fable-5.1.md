---
name: writing-for-agents
description: 'Write agent-facing skills, AGENTS.md, CLAUDE.md, and linked docs with precise behavioral instructions.'
---

# Writing for agents

Treat skills, AGENTS.md, CLAUDE.md, and linked documents as one instruction system.
Make the authorized process predictable with literal wording and explicit order
where order matters.

1. Establish the document's job and authority. For a skill, load
   `model-writing-guides` and [SKILL-MECHANICS.md](SKILL-MECHANICS.md) before drafting.
   Write complete variants for every supported profile, preserving outcome,
   permissions, exact commands, and evidence. Keep the requested rewrite scope;
   do not expand an ordinary edit into unrelated documents.
2. Separate steps from reference. Keep ordered actions and reference needed on
   every path inline. Put conditional/advanced reference one hop from SKILL.md.
   References may link only to their own SKILL.md among `skills/` files, not
   to another reference. Keep SKILL.md within 500 lines and every-turn skills in
   one file. Group each concept's definition, rules, and caveats together.
3. Write each pointer as a reliable trigger. Say what the material is and name
   every distinct branch that needs it. Front-load a familiar leading word,
   collapse synonyms for one branch, and remove identity already present in
   the target. The pointer's wording determines whether the agent ever reads it.
4. Balance context and cognitive costs. Always-loaded instructions spend tokens
   and attention; unlinked resources force humans to remember their existence.
   Put reliable automatic retrieval behind clear pointers and reserve human
   memory for choices needing human judgment. Do not split universally needed
   material into extra reads: each file adds a model return.
5. End every step with a clear, demanding completion criterion. State what must
   be accounted for, not just which artifact to emit. Improve the criterion
   before adding process. If observed rushing persists and the criterion cannot
   be sharpened, hide later steps behind a real context boundary.
6. Use familiar anchors such as tight, frontier, or red. Repeat the word rather
   than its definition. Prefer positive target behavior; keep prohibitions for
   hard guardrails and pair them with what to do instead. For long tool work,
   specify useful batching and meaningful updates when relevant. Unfamiliar or
   current factual claims need source lookup.
7. Prune every line for relevance, a single authoritative owner, and behavior
   beyond the model's default. Scripts/config/layout/`--help` are source truth;
   prose caches earn space only for expensive lookups, unwritten conventions,
   reasons, or gotchas. Finish the requested document and validation without
   leaving a pile of duplicate rules.

Preserve the MIT notice in [upstream-license.md](references/upstream-license.md).
