---
name: pr-rubbish-audit
description: 'Audit PR diffs for unrelated artifacts, noisy comments, deletions, generated drift, and stray refactors.'
---

# PR rubbish audit

Separate necessary feature work from unrelated artifacts, churn, and accidental
removal. Resolve routine classifications from the target and hunk evidence,
while preserving real behavior, tests, docs, and compatibility.

## Establish the intended change

Identify feature intent, PR/head, and base, usually `origin/main`. Ask only when
unclear intent prevents safe classification. Capture `git diff --name-status`,
`git diff --stat`, and the largest additions/deletions. Classify every file using
[classifications.md](references/classifications.md), then compare suspicious
hunks to the old implementation with `git diff origin/main -- <file>` and
`git show origin/main:<file>`, adjusted to the actual base.

Apply [rubbish-signals.md](references/rubbish-signals.md). Do not discard behavior
without evidence it is unnecessary. Prefer removing unrelated behavior-preserving
refactors. An adjacent bug fix must be necessary or named as extra scope.
Intentional removals need tests of absence only for a current compatibility,
privacy, migration, or security contract.

## Match action to authority

Write the cleanup plan first: retained/reverted hunks and reasons, tests/docs
to add or restore, and validation. A read-only audit stops at that plan. An
already-authorized cleanup proceeds without turning the plan into another approval
gate. Make surgical changes and preserve unrelated user edits.

## Verify the actual cleanup

Run focused tests, available typecheck/lint/format gates, and a final diff/stat
check. If a wrapper deadlocks or cannot run, use its constituent commands and
report the caveat. Use [output.md](references/output.md) for reporting and
subagent-splitting guidance. Finish with a coherent diff, not a smaller one at
the expense of required behavior.
