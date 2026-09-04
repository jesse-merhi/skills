---
name: skill-cleaner
description: "Audit agent skills: loaded roots, duplicate skills, unused skills, prompt-budget costs, compact descriptions."
---

# Skill cleaner

Audit the skills that are actually loaded and recommend focused cleanup.
Do not turn an inventory request into editing, deletion, or installation changes.

1. Run the analyzer from the repository root, or resolve the same script from
   this skill directory:

   ```bash
   skills/skill-cleaner/scripts/skill-cleaner --months 3
   ```

   See [commands.md](references/commands.md) for other supported commands.
2. Read the results in [report-guide.md](references/report-guide.md) order.
   Use [analyzer-notes.md](references/analyzer-notes.md) to interpret root,
   duplicate, usage, and budget heuristics. Batch independent configuration and
   usage checks. Verify unfamiliar or current harness behavior from installed
   configuration or source.
3. Present the useful inventory and recommendations. Treat no recent usage or
   a generated shorter description as a candidate for investigation, not a
   deletion instruction. During a long audit, report changed counts, ownership
   decisions, or blockers.
4. If the user requested changes, read [cleanup-policy.md](references/cleanup-policy.md)
   before applying them. Verify that every retained duplicate exists and is
   loaded. Preserve product, tool, action, and object trigger nouns plus exclusions.
   Test candidate descriptions behaviorally before treating them as equivalent.
   Do not delete ignored or untracked directories without naming the destination
   or confirming they are disposable.

The analyzer is an Effect adaptation of MIT-licensed
[`steipete/agent-scripts`](https://github.com/steipete/agent-scripts). Preserve
[its upstream license](references/upstream-license.md) when redistributing it.
