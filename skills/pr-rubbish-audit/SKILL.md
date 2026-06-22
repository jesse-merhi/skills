---
name: pr-rubbish-audit
description: 'Audit messy PR or branch diffs for unrelated rubbish: branch-history artifacts, noisy comments, accidental deletions, generated drift, and unneeded refactors.'
---

# PR Rubbish Audit

Audit the diff for coherence, not minimalism. The goal is **no rubbish in the PR**, not reduced functionality. Keep real behavior, tests, docs, and compatibility that the feature needs.

## Workflow

1. Establish the intended feature and base.
   - Identify the PR/head branch and base branch, usually `origin/main`.
   - Ask only if the feature intent is unclear enough that you cannot classify hunks safely.
   - Capture `git diff --name-status`, `git diff --stat`, and the largest add/delete files.

2. Classify every changed file.
   Use these labels:
   - `required`: implements the feature or preserves existing behavior the feature touches.
   - `required-test`: validates the feature or a verified reachable regression risk introduced by the feature.
   - `required-docs`: public behavior/config/API changed, so docs or generated docs must change.
   - `suspicious`: possibly unrelated; inspect before keeping.
   - `rubbish`: unrelated churn, branch-history artifact, stale TODO/comment, speculative API, unused helper, low-value test, accidental generated/lockfile drift.
   - `dangerous-removal`: removed existing behavior, test, mock, cleanup/dispose path, validation, auth, route handling, or compatibility without a feature reason.

3. Inspect hunks, not just files.
   For each suspicious file, compare old and new code. Prefer `git diff origin/main -- <file>` plus targeted reads from `git show origin/main:<file>`.

4. Preserve behavior unless proven unnecessary.
   Do not remove functionality just to shrink the diff. If a hunk might be behavior-preserving refactor but does not help the feature, prefer reverting it. If a hunk fixes a real adjacent bug, keep it only when it is necessary for the feature or explicitly call it out as extra scope.
   When the feature intentionally removes behavior, do not require tests that
   only prove the old behavior is gone unless a current compatibility, privacy,
   migration, or security contract requires that absence.

5. Produce a cleanup plan before editing.
   List:
   - files/hunks to keep and why
   - files/hunks to revert and why
   - tests/docs to add or restore
   - validation to run

6. Apply focused cleanup.
   Revert hunks surgically. Never reset the whole worktree. Do not touch unrelated dirty user changes.

7. Validate.
   Run focused tests for changed behavior, typecheck/lint/format gates available in the repo, and a final diff/stat check. If a repo wrapper deadlocks or cannot run, run its constituent commands and state the caveat.

## Rubbish Signals

Look hard at:

- Removed tests or mocks with no replacement.
- New tests that only prove intentionally removed behavior, fields, callbacks,
  routes, screens, or modes stay gone, with no current compatibility, privacy,
  migration, or security contract.
- New tests for additions where the test cannot catch a verified reachable
  product, API, data, security, or workflow regression.
- New regression tests that do not show a real failing path through current
  code, contracts, data, permissions, or user flows. Security vulnerabilities,
  auth bypasses, data loss, and migration corruption are valid targets when the
  path is real.
- Frontend tests that only assert incidental UI copy, headings, placeholders,
  button text, or marketing text without proving behavior, state, permissions,
  submitted data, rendered data, routing, or a stable accessibility contract.
- Removed cleanup/dispose/abort/timeout/no-route handling.
- Helper renames that silently drop fields.
- New “deprecated”, “backwards compatible”, “regression”, or TODO comments referring only to branch-local history, not `main`.
- Comment duplication between types, tests, and implementation.
- Inline import rewrites or mock timing changes unrelated to the feature.
- Log-level changes, copy changes, or style churn not required by behavior.
- Public type fields that are not populated by runtime code.
- UI changes that broaden behavior beyond the feature.
- Generated docs/schema/hash changes without source changes.
- `package.json`, lockfile, tarball, patch, vendored, or dependency drift.
- New generic helpers whose only current use is narrow.
- Trivial pass-through helpers that only rename a single function call or
  one-line expression without encoding a policy boundary, type boundary, or
  repeated domain concept.
- Lazy-loading or inline `import(...)` type references added only to avoid a
  normal static import, unless they protect a real runtime boundary or cycle.

## Required Output Shape

When reporting the audit, include:

- `Kept`: concise list of feature-critical surfaces.
- `Removed/restored`: exact files or hunks cleaned up.
- `Risks checked`: dangerous-removal categories inspected.
- `Validation`: commands run and pass/fail result.
- `Remaining caveats`: only real residual risk, not generic uncertainty.

For large diffs, use a table:

| File | Classification | Keep | Rubbish / Risk | Action |
|---|---|---|---|---|

## Subagents

If the user explicitly asks for subagents or parallel reviewers, split by subsystem:

- agent/runtime/session
- plugin API/types/hooks
- gateway/protocol/approval
- UI/rendering/controllers
- docs/config/tests

Ask each subagent to classify every changed file in its scope against the feature intent and to flag unrelated churn or dangerous removals. Do not ask them to edit files unless write scopes are disjoint and explicitly assigned.
