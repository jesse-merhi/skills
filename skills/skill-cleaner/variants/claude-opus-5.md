---
name: skill-cleaner
description: "Audit agent skills: loaded roots, duplicate skills, unused skills, prompt-budget costs, compact descriptions."
---

# Skill cleaner

Audit the currently loaded skill roots, duplicates, usage, and prompt cost
without removing anything outside the user's explicit authority. Open with the
analyzer scope in one short line. Update only when configuration evidence
changes the inventory or a removal decision needs the user.

Return a focused inventory and cleanup recommendations, not a second prose
report beside analyzer output. Save an artifact only if the user requests one,
and keep it to the evidence and proposed actions. Use the analyzer plus current
configuration checks below; do not rerun a generic audit. Keep this inspection
in the current session without agents.

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
