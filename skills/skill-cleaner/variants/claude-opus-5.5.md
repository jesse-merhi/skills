---
name: skill-cleaner
description: 'Use when asked to audit, prune or budget installed agent skills.'
metadata:
  source: https://github.com/steipete/agent-scripts
  source-path: skills/skill-cleaner
  upstream-review-revision: 168f22313cecc5c173421d1b3a8c1911812c0d2a
  upstream-review-date: "2026-11-22"
  license: MIT
---

# Skill cleaner

Inventory loaded skill roots, duplicates, usage and prompt-budget pressure. Recommend cleanup; edit or remove only when requested.

Use the installed command and its help:

```bash
skill-cleaner --help
skill-cleaner --months 3
```

## Interpret the evidence

- Separate the live model-visible inventory from filesystem fallback. `--no-live` forces fallback; `--root <path> --root-only` limits the scan to supplied roots. For another harness, supply its roots and use its local usage evidence.
- Read budget pressure with roots, enabled state, description candidates, duplicates and unused candidates. Estimates use Codex's 2% allocation and `ceil(utf8_bytes / 4)`; check the model and context source, or use `--context-tokens` for an exact override.
- Duplicate names alone do not justify deletion. Compare bodies and ownership; symlinked roots and file reads are realpath-deduped.
- Missing recent usage is not proof of disuse. Default logs cover recent Codex history and sessions, not archives unless `--deep-logs` is used. Evidence comes from user messages and tool-call arguments, not developer catalogs.

## Apply only requested cleanup

Verify the kept duplicate exists and is loaded. Prefer the harness-provided copy when it covers the same behavior, but retain repository skills that encode project policy or live operations. Do not delete ignored or untracked directories without naming the destination or confirming they are disposable.

Preserve description trigger nouns—product, tool, action, object—and exclusions. Generated shorter descriptions remain manual rewrite candidates until independent agent exercises establish equivalent triggering. Group authorized changes by descriptions, deletions, or configuration; commit only when separately authorized.

Report the useful inventory, supporting evidence, limits, and proposed decisions.
