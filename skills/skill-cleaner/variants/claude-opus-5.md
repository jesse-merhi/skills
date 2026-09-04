---
name: skill-cleaner
description: "Audit agent skills: loaded roots, duplicate skills, unused skills, prompt-budget costs, compact descriptions."
---

# Skill cleaner

Deliver an analyzer-led inventory and a short set of evidence-backed cleanup
decisions. Cover loaded roots, prompt budget, duplicates, and usage. Suggest
first; only a user request authorizes editing or removal.

Run from the repository root, or resolve the corresponding path from this skill:

```bash
skills/skill-cleaner/scripts/skill-cleaner --months 3
```

Choose supported variants through [commands.md](references/commands.md). Follow
[report-guide.md](references/report-guide.md) when reading output and use
[analyzer-notes.md](references/analyzer-notes.md) to distinguish heuristic
candidates from proven waste. Keep both the chat report and any saved report
focused on decisions and the evidence needed to make them.

For requested cleanup, apply [cleanup-policy.md](references/cleanup-policy.md)
as part of accepting each change. Confirm the retained copy exists and is loaded
before deleting a duplicate. Preserve description trigger nouns for product,
tool, action, and object, plus exclusions. Treat generated descriptions as manual
rewrite candidates until behavioral tests establish equivalent triggering.
Ignored or untracked directories need a named destination or confirmation that
they are disposable before deletion.

Do not add an optional verification-agent fan-out or unrelated installation and
prompt-writing work. Preserve [the upstream license](references/upstream-license.md)
when redistributing this Effect adaptation of the MIT-licensed
[`steipete/agent-scripts`](https://github.com/steipete/agent-scripts) analyzer.
