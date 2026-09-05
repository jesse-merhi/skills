---
name: pr-rubbish-audit
description: 'Audit PR diffs for unrelated artifacts, noisy comments, deletions, generated drift, and stray refactors.'
---

# PR rubbish audit

Audit the diff for coherence, not minimalism. The goal is **no rubbish in the
PR**, not reduced functionality. Keep real behavior, tests, docs, and
compatibility that the feature needs.

## Workflow

1. Establish the intended feature and base.
   - Identify the PR/head branch and base branch, usually `origin/main`.
   - Ask only if the feature intent is unclear enough that you cannot classify
     hunks safely.
   - Capture `git diff --name-status`, `git diff --stat`, and the largest
     add/delete files.
2. Classify every changed file using
   [classifications.md](references/classifications.md).
3. Inspect hunks, not just files. For each suspicious file, compare old and new
   code. Prefer `git diff origin/main -- <file>` plus targeted reads from
   `git show origin/main:<file>`.
4. Preserve behavior unless proven unnecessary. Use
   [rubbish-signals.md](references/rubbish-signals.md) for common risks.
5. Produce a cleanup plan before editing:
   - files/hunks to keep and why
   - files/hunks to revert and why
   - tests/docs to add or restore
   - validation to run
6. Stop after the cleanup plan unless the user authorized implementation.
   When authorized, apply focused cleanup surgically without touching unrelated
   user changes.
7. After authorized edits, validate with focused tests, typecheck/lint/format gates
   available in the repo, and a final diff/stat check. If a repo wrapper
   deadlocks or cannot run, run its constituent commands and state the caveat.
8. Report using [output.md](references/output.md).

## Required judgment

- Do not remove functionality just to shrink the diff.
- If a hunk might be behavior-preserving refactor but does not help the feature,
  prefer reverting it.
- If a hunk fixes a real adjacent bug, keep it only when it is necessary for the
  feature or explicitly call it out as extra scope.
- When the feature intentionally removes behavior, do not require tests that
  only prove the old behavior is gone unless a current compatibility, privacy,
  migration, or security contract requires that absence.

## Context pointers

- Use [classifications.md](references/classifications.md) for required,
  suspicious, rubbish, and dangerous-removal labels.
- Use [rubbish-signals.md](references/rubbish-signals.md) for hunk-level smells
  and dangerous-removal checks.
- Use [output.md](references/output.md) for required report shape and subagent
  splitting.
