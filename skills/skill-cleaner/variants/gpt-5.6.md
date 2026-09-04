---
name: skill-cleaner
description: "Audit agent skills: loaded roots, duplicate skills, unused skills, prompt-budget costs, compact descriptions."
---

# Skill cleaner

Produce an evidence-backed inventory and cleanup recommendations for loaded
skill roots, duplicates, usage, and prompt-budget pressure. This is suggest-first;
edit or remove only when the user requests it.

Run the analyzer from the repository root, or resolve its equivalent path from
this skill directory:

```bash
skills/skill-cleaner/scripts/skill-cleaner --months 3
```

Use [commands.md](references/commands.md) for command variants and
[report-guide.md](references/report-guide.md) for report order. Interpret budget,
roots, duplicates, and usage through [analyzer-notes.md](references/analyzer-notes.md);
heuristics are cleanup candidates, not proof that a skill is disposable.

Before authorized edits, apply [cleanup-policy.md](references/cleanup-policy.md).
Verify the kept duplicate exists and is loaded. Preserve description trigger
nouns—product, tool, action, object—and exclusions. Generated descriptions stay
manual rewrite candidates until behavioral tests establish that meaning survives.
Do not delete ignored or untracked skill directories without naming the destination
or confirming they are disposable.

Report the useful inventory, supporting evidence, and proposed decisions.
Preserve [the upstream license](references/upstream-license.md) when redistributing
this Effect adaptation of the MIT-licensed analyzer from
[`steipete/agent-scripts`](https://github.com/steipete/agent-scripts).
