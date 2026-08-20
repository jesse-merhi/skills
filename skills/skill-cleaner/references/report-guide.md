# Report guide

Read the report in this order:

- `Skill Budget`: GPT-5.5 context size, 2% skills budget, Codex-budgeted usage,
  and pre-budget full-list pressure.
- `Description candidates`: long descriptions where relaxed grammar saves
  prompt budget.
- `Duplicates`: same skill name or near-identical description/body across Codex,
  plugin cache, repo siblings, and personal skill roots.
- `Unused candidates`: no recent `$skill` mention, `SKILL.md` read, or explicit
  skill-use trace in recent local agent tool logs.
- `Root summary`: where skills came from and whether config marks them disabled.
