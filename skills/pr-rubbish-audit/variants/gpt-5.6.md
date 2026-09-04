---
name: pr-rubbish-audit
description: 'Audit PR diffs for unrelated artifacts, noisy comments, deletions, generated drift, and stray refactors.'
---

# PR rubbish audit

Assess whether the PR is coherent and free of unrelated artifacts, noisy churn,
and accidental deletion. Preserve behavior, tests, docs, and compatibility the
feature needs; shrinking the diff is not the objective.

Identify feature intent, head, and base, usually `origin/main`. Ask only when
intent is too unclear to classify safely. Capture `git diff --name-status`,
`git diff --stat`, and the largest additions/deletions. Classify every changed
file with [classifications.md](references/classifications.md), then inspect
suspicious hunks against the old code. Prefer `git diff origin/main -- <file>`
and targeted `git show origin/main:<file>` reads, substituting the actual base.

Apply [rubbish-signals.md](references/rubbish-signals.md). Preserve behavior until
shown unnecessary. Prefer reverting unrelated behavior-preserving refactors.
Keep an adjacent bug fix only if required for the feature or explicitly flag it
as extra scope. Intentional behavior removal needs absence tests only when a
current compatibility, privacy, migration, or security contract requires them.

Before edits, present a plan: keep/revert hunks and reasons, tests/docs to add or
restore, and validation. Stop there unless implementation was authorized. If it
was, make focused surgical edits while preserving unrelated user changes.

Validate authorized edits with focused tests, available typecheck/lint/format
gates, and a final diff/stat check. If a wrapper deadlocks or cannot run, execute
its constituent commands and disclose the caveat. Report via
[output.md](references/output.md), which also defines subagent splitting.
