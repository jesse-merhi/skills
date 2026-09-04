---
name: skill-cleaner
description: "Audit agent skills: loaded roots, duplicate skills, unused skills, prompt-budget costs, compact descriptions."
---

# Skill cleaner

Establish which skills are loaded, where prompt budget is spent, and which
cleanup decisions are supported. Use available configuration and logs to resolve
routine inventory questions without asking the user to investigate them.

## Build the evidence

From the repository root run the command below, or resolve the equivalent script
path from this skill directory:

```bash
skills/skill-cleaner/scripts/skill-cleaner --months 3
```

Consult [commands.md](references/commands.md) for variants,
[report-guide.md](references/report-guide.md) for reading order, and
[analyzer-notes.md](references/analyzer-notes.md) for limits of budget, root,
duplicate, and usage heuristics. Distinguish an unused candidate from proven
safe removal.

## Separate recommendations from authorized cleanup

An audit produces recommendations. Editing or removal requires a user request.
When already authorized, apply [cleanup-policy.md](references/cleanup-policy.md)
and establish that the kept copy exists and is loaded before deleting its
duplicate. For ignored or untracked directories, name the destination or obtain
confirmation that they are disposable.

A shorter description must retain product, tool, action, and object trigger
nouns and exclusions. Generated text remains a manual rewrite candidate until
behavioral tests show that trigger meaning survives. Validate the changed
selection or cleanup behavior without expanding into unrelated skill rewrites.

Return the inventory and concrete decisions supported by it. This Effect
analyzer adapts MIT-licensed [`steipete/agent-scripts`](https://github.com/steipete/agent-scripts);
retain [the upstream license](references/upstream-license.md) on redistribution.
