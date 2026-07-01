# Commands

Run the analyzer from this skill directory or repo root:

```bash
npx --yes tsx@4.22.4 skills/skill-cleaner/scripts/skill-cleaner.ts --months 3
```

Useful variants:

```bash
npx --yes tsx@4.22.4 skills/skill-cleaner/scripts/skill-cleaner.ts --no-logs
npx --yes tsx@4.22.4 skills/skill-cleaner/scripts/skill-cleaner.ts --months 6 --max-log-mb 800 --deep-logs
npx --yes tsx@4.22.4 skills/skill-cleaner/scripts/skill-cleaner.ts --context-tokens 272000 --budget-percent 2 --no-logs
npx --yes tsx@4.22.4 skills/skill-cleaner/scripts/skill-cleaner.ts --root ~/archived-skills --no-logs
```
