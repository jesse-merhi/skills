---
name: pr-rubbish-audit
description: 'Audit PR diffs for unrelated artifacts, noisy comments, deletions, generated drift, and stray refactors.'
---

# PR rubbish audit

Return evidence-backed classifications and a focused cleanup plan for the PR.
With implementation authority, apply the plan and prove the resulting diff.
Preserve required behavior, tests, docs, and compatibility; minimal diff size is
not the goal.

Resolve feature intent, head, and base, usually `origin/main`, asking only if
intent is too unclear to classify safely. Capture `git diff --name-status`,
`git diff --stat`, and largest additions/deletions. Use
[classifications.md](references/classifications.md) for every changed file.
Inspect suspicious hunks before filtering genuine rubbish, comparing old/new code
with `git diff origin/main -- <file>` and `git show origin/main:<file>` or the
actual base. Apply [rubbish-signals.md](references/rubbish-signals.md).

A necessary behavior stays. Prefer reverting unrelated behavior-preserving
refactors; an adjacent bug fix needs feature necessity or explicit extra-scope
disclosure. Do not demand old-behavior-is-gone tests unless a current compatibility,
privacy, migration, or security contract requires absence.

Plan the retained/reverted hunks and reasons, added/restored tests/docs, and
validation before editing. Stop at the plan for read-only requests. Authorized
cleanup stays surgical and preserves unrelated user changes.

Completion after edits includes focused tests, available typecheck/lint/format
gates, and the final diff/stat check. If a wrapper cannot run or deadlocks, run
its constituent commands and disclose the caveat. Follow
[output.md](references/output.md) for reporting and bounded subagent splitting;
do not start unsolicited reviewers or an unrelated diff-shrinking campaign.
