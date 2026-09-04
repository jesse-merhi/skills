---
name: writing-for-agents
description: 'Write agent-facing skills, AGENTS.md, CLAUDE.md, and linked docs with precise behavioral instructions.'
---

# Writing for agents

Deliver a compact instruction system whose steps, authority, and completion
criteria are unambiguous. Treat skills, AGENTS.md, CLAUDE.md, and their linked
documents as one system. Preserve required proof and permissions while removing
redundant generic self-check scaffolding.

For skill work, load `model-writing-guides` and
[SKILL-MECHANICS.md](SKILL-MECHANICS.md) before writing. Produce all supported
complete variants with equivalent outcomes, permissions, exact commands, and
evidence. Retain [upstream-license.md](references/upstream-license.md).

Give each meaning one owner. Group its definition, rules, and caveats together.
Keep ordered steps and reference needed by every path inline; disclose conditional/
advanced material one hop from SKILL.md. References may link only to their own
SKILL.md among `skills/` files, never another reference. Keep SKILL.md within
500 lines and every-turn skills in one file. Extra files cost model returns.

Pointers are retrieval contracts: front-load the familiar leading word, name the
material and every distinct triggering branch, collapse synonyms, and omit
identity the target already carries. Balance context load (tokens/attention every
turn) against cognitive load (human memory of available documents). Use automatic
retrieval for reliable cases, human judgment where it matters.

End each step with a clear, demanding completion criterion. Sharpen what must
be proved or accounted for before adding process. If observed rushing persists
and a sharper criterion cannot solve it, place later steps behind a real context
boundary. Do not add a verifier round where the completion gate already proves
the same thing.

Use familiar anchors such as tight, frontier, and red. Repeat the token rather
than the definition. Prefer positive behavior; keep hard prohibitions paired
with the allowed alternative. Proportion the saved instructions as well as chat.

Prune lines failing relevance, single ownership, or behavioral effect beyond the
model default. Scripts/config/layout/`--help` already own cheap mechanical facts;
cache only costly lookups, unwritten conventions, reasons, and gotchas. Remove
stale or duplicate instructions instead of layering more prose over them.
