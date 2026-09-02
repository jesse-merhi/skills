---
name: skill-cleaner
description: "Audit agent skills: loaded roots, duplicate skills, unused skills, prompt-budget costs, compact descriptions."
---

# Skill cleaner

Complete the requested inventory or cleanup decision. Batch independent root,
metadata, and usage checks. During a long audit, report a changed count,
ownership decision, or blocker. Verify current harness behavior from installed
configuration or source. Keep any authorized removal to proven duplicate or
unused targets.

Use this when trimming skill prompt budget, finding duplicate skills, auditing
enabled/disabled skill roots, or deciding which skills/plugins to remove.

## Workflow

1. Run the analyzer from this skill directory or repo root:

   ```bash
   skills/skill-cleaner/scripts/skill-cleaner --months 3
   ```

2. Use [commands.md](references/commands.md) for useful variants.
3. Read the report in the order described by
   [report-guide.md](references/report-guide.md).
4. Before deleting or editing, apply the safety checks in
   [cleanup-policy.md](references/cleanup-policy.md).
5. Use [analyzer-notes.md](references/analyzer-notes.md) when interpreting
   budget, root, duplicate, and usage heuristics.

This is an Effect-based adaptation of the MIT-licensed analyzer maintained in
[`steipete/agent-scripts`](https://github.com/steipete/agent-scripts). Preserve
[the upstream license](references/upstream-license.md) when redistributing it.

## Required discipline

- Suggest first; edit only when the user asks.
- Verify the kept copy exists and is loaded before deleting duplicates.
- Preserve trigger nouns in descriptions: product, tool, action, object.
- Treat generated descriptions as manual rewrite candidates until tests prove
  that they preserve trigger meaning and exclusions.
- Do not delete ignored/untracked skill dirs without naming the destination or
  confirming they are disposable.

## Context pointers

- Use [commands.md](references/commands.md) for analyzer command variants.
- Use [report-guide.md](references/report-guide.md) for report reading order.
- Use [analyzer-notes.md](references/analyzer-notes.md) for how the script models
  Codex skill budget and usage.
- Use [cleanup-policy.md](references/cleanup-policy.md) before applying cleanup.
