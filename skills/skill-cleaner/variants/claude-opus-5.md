---
name: skill-cleaner
description: "Audit agent skills: loaded roots, duplicate skills, unused skills, prompt-budget costs, compact descriptions."
metadata:
  source: https://github.com/steipete/agent-scripts
  source-path: skills/skill-cleaner
  upstream-review-revision: 0e8ca002fc1dd76ae84c71f8d24dfd1ac7096ff5
  upstream-review-date: "2026-09-06"
  license: MIT
---

# Skill cleaner

Produce an evidence-backed inventory and cleanup recommendations for loaded skill roots, duplicates, usage, and prompt-budget pressure. This is suggest-first; edit or remove only when the user requests it.

Use the installed `skill-cleaner` command. Read `--help` for supported options rather than a separate command guide:

```bash
skill-cleaner --help
skill-cleaner --months 3
```

## Interpret the evidence

- Separate the live model-visible inventory from filesystem fallback. `--no-live` forces fallback; `--root <path> --root-only` limits the scan to supplied roots. For another harness, supply its roots and use its local usage evidence.
- Read budget pressure alongside roots, enabled state, description candidates, duplicates, and unused candidates. Budget figures estimate Codex's 2% allocation using `ceil(utf8_bytes / 4)`; check the reported model and context source, and use `--context-tokens` for an exact context-size override.
- Duplicate names alone do not justify deletion. Compare bodies and ownership; symlinked roots and file reads are realpath-deduped.
- Missing recent usage is not proof of disuse. Default logs cover recent Codex history and sessions, not archives unless `--deep-logs` is used. Evidence comes from user messages and tool-call arguments, not developer catalogs.

## Apply only requested cleanup

Verify the kept duplicate exists and is loaded. Prefer the harness-provided copy when it covers the same behavior, but retain repository skills that encode project policy or live operations. Do not delete ignored or untracked directories without naming the destination or confirming they are disposable.

Preserve description trigger nouns—product, tool, action, object—and exclusions. Generated shorter descriptions remain manual rewrite candidates until behavioral tests establish equivalent triggering. Group authorized changes by descriptions, deletions, or configuration; commit only when separately authorized.

Keep chat and saved reports focused on the useful inventory, supporting evidence, limits, and proposed decisions. Do not add optional worker rounds, installation changes, or unrelated prompt-writing work.
