# Review Phase Rules

## Validation

Run the commands identified during setup after each fix and after both review
phases are clean. Prefer package scripts for tests, typecheck, lint, build,
UI/E2E, migrations, security, or generated-artifact checks. If required
validation cannot run, stop honestly with the blocker or residual risk.

## Target Handling

- Default to whole PR/branch review. If the branch has committed PR changes and
  dirty local changes, review a temporary snapshot that includes both the branch
  diff and the dirty local overlay. A clean local-only review only proves there
  is no local patch; it does not prove the PR/branch is clean.
- Treat a whole-target snapshot as review input, not the working copy. If review
  finds a real bug from snapshot content, apply the accepted fix in the real
  checkout, run affected validation there, then rerun review. The next
  whole-target review must rebuild a fresh snapshot from the real checkout. Do
  not leave accepted fixes only inside the temporary worktree; the helper
  removes that worktree after review.
- Use local mode only when the requested target is the local patch by itself.
  Use branch mode only when the requested target is the committed branch by
  itself.

## Run Handling

- If the review helper is quiet, wait. Long reviews may print heartbeat lines
  such as `review still running: ... elapsed=... pid=...`; treat those as
  progress.
- Do not kill a quiet review just because it has been silent for a few minutes.
  Inspect only after missed heartbeats, an obviously failed subprocess, or a
  review that has run past the expected long-review window.
- If tests and review run in parallel and either causes edits, rerun affected
  tests and rerun both review phases on the changed target.
- Review panels are opt-in. Use extra reviewers only when requested or when risk
  justifies the cost.
- Prefer read-only tools and web search during review when dependency behavior
  matters.

## Finding Handling

- If an accepted finding shows a repeated bug class, inspect sibling instances
  in the current review scope before fixing. Fix the scoped pattern at once when
  practical, but stop at touched surfaces, owner boundaries, or clear follow-up
  territory.
- When structured review output is available, classify each finding as:
  `direct`, `induced`, `adjacent`, or `unrelated`. Direct findings point at
  changed files. Induced findings point at unchanged code that the change now
  exposes or calls. Adjacent findings are real nearby issues outside this PR's
  required fix. Unrelated findings are old issues that the change does not
  cause, expose, or worsen. Direct and induced findings block review; adjacent
  and unrelated findings are recorded but do not block unless the user
  explicitly expands scope.
- Verify accepted native-review findings by reading the real code path.
- Read dependency docs/source/types when findings depend on external behavior.
- Reject speculative edge cases, broad rewrites, and fixes that over-complicate
  the codebase.
- Prefer small fixes at the right ownership boundary.

## Hard Stops

- Never switch or override the review model. Retry transient capacity failures
  with the same command/model.
- Do not rerun review only to get nicer wording. The second clean confirmation
  exists to reduce missed findings, not to polish the final report.
- Do not downgrade either phase's clean stop condition because the first pass
  looks obviously clean.
- If tests, validation, `review-until-clean`, or
  `cold-pr-review-until-clean` cause edits, rerun affected validation and return
  to Phase 1 before declaring clean.
- Do not push just to review. Push only when the user requested publish, ship,
  PR update, another GitHub mutation, or the PR closeout step is running after
  both review phases and final validation are clean.
