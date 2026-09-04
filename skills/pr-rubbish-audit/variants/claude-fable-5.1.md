---
name: pr-rubbish-audit
description: 'Audit PR diffs for unrelated artifacts, noisy comments, deletions, generated drift, and stray refactors.'
---

# PR rubbish audit

Audit the whole intended diff for coherence. Do not remove required functionality,
tests, documentation, or compatibility just to make the PR smaller.

1. Establish feature intent, head, and direct base, usually `origin/main`.
   Ask only if intent is too unclear for safe classification. Capture
   `git diff --name-status`, `git diff --stat`, and the largest added/deleted files.
2. Classify every file with [classifications.md](references/classifications.md).
   Batch independent file and provenance checks.
3. Inspect suspicious hunks against old code. Use
   `git diff origin/main -- <file>` and targeted `git show origin/main:<file>`,
   replacing the base when appropriate. Apply
   [rubbish-signals.md](references/rubbish-signals.md); a suspicious filename
   alone does not prove the hunk is rubbish.
4. Preserve necessary behavior. Prefer reverting an unrelated behavior-preserving
   refactor. Keep an adjacent bug fix only if the feature needs it, or identify
   it explicitly as extra scope. For intentionally removed behavior, require
   absence tests only for a current compatibility, privacy, migration, or security contract.
5. Produce a cleanup plan before editing: what stays and why, what reverts and
   why, tests/docs to add or restore, and validation. Stop at the plan unless
   implementation is authorized. Then edit surgically without disturbing unrelated
   user changes.
6. Run focused tests, available typecheck/lint/format gates, and a final diff/stat
   check after edits. If a wrapper deadlocks or is unavailable, run constituent
   commands and state the limitation.
7. Follow [output.md](references/output.md) for the report and any subagent
   splitting. During long work, report meaningful evidence or direction changes.
