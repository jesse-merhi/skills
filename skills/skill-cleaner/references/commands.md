# Commands

Run the analyzer from this skill directory or repo root:

```bash
skills/skill-cleaner/scripts/skill-cleaner --months 3
```

Useful variants:

```bash
skills/skill-cleaner/scripts/skill-cleaner --no-logs
skills/skill-cleaner/scripts/skill-cleaner --months 6 --max-log-mb 800 --deep-logs
skills/skill-cleaner/scripts/skill-cleaner --model <model> --context-tokens <tokens> --budget-percent 2 --no-logs
skills/skill-cleaner/scripts/skill-cleaner --root ~/archived-skills --no-logs
skills/skill-cleaner/scripts/skill-cleaner --root ./skills --root-only --no-logs
skills/skill-cleaner/scripts/skill-cleaner --no-live --no-logs
```

The default command asks Codex for its live model-visible inventory and resolves
the current model from Codex configuration/cache. Use
`--no-live` when Codex is unavailable, and `--root-only` for a deterministic
audit of only the supplied roots.
