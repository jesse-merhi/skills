# Review phase rules

## Validation

Run focused commands after each fix to check the affected behavior. Keep the
review and finding-fix loop local. After both review phases are clean, run the
full local validation selected during setup once against the final tree. Prefer
package scripts for tests, typecheck, lint, build, UI/E2E, migrations, security,
or generated-artifact checks. If required validation cannot run, stop honestly
with the blocker or residual risk.

## Target handling

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

## Run handling

- Run the review helper through the `wait-efficiently` Codex shell-wait pattern.
  If a wait deadline expires while the helper is still running, resume the same
  cell rather than restarting the review.
- Long reviews may print heartbeat lines such as
  `review still running: ... elapsed=... pid=...`; treat those as progress, not
  as a reason to return to the model.
- For review subagents, use the event-driven wait mechanism described by
  `wait-efficiently`. Wait up to 15 minutes for the first mailbox update; the
  wait returns as soon as the reviewer sends an update or finishes. Continue
  waiting after non-terminal updates. Inspect only after two consecutive
  timeouts or an explicit error. Do not pair normal waits with status-list
  calls.
- Do not kill a quiet review just because it has been silent for a few minutes.
  Inspect only after missed heartbeats, an obviously failed subprocess, or a
  review that has run past the expected long-review window.
- If tests and review run in parallel and either causes edits, rerun affected
  tests and rerun both review phases on the changed target.
- Review panels are opt-in. Use extra reviewers only when requested or when risk
  justifies the cost.
- Prefer read-only tools and web search during review when dependency behavior
  matters.

## Finding handling

- Treat native and cold reviewer output as candidates. Before editing code,
  require `finding-discipline`'s recorded likelihood-impact risk rating for a
  runtime candidate, or its maintenance and present-cost evidence for a
  maintenance candidate. Then require contract evidence for a runtime finding,
  plus root cause and intervention justification for either kind. Require a
  recommended repair before a patch, deferral, or approved consultation.
  Require the CLI's derived disposition in either case;
  only runtime findings receive severity. Record `--handling fix` for current
  in-scope work, `consult` for an owner decision, `follow-up` for real work
  outside this review, or `reject` when a candidate fails a named actionability
  gate.
- Before editing an accepted finding, apply `review-guardrails`' systemic-finding
  stop. Bring the user durable architecture options instead of applying a local
  Band-Aid.
- Apply `review-guardrails`' autonomous fix bar after all three
  `finding-discipline` gates and
  before editing. A valid review observation is not automatically worth
  permanent production code, compatibility behavior, or tests.
- Reapply `reducing-cognitive-load`'s plausibility and proxy tests to every
  guard, fallback, normalization, and helper introduced by a review fix. Remove
  defenses without a current producer, supported contract, observed failure, or
  boundary condition before the next review pass.
- If an accepted finding shows a repeated bug class, inspect sibling instances
  in the current review scope before fixing. Fix the scoped pattern at once when
  practical, but stop at touched flows, owner boundaries, or clear follow-up
  territory.
- Classify each finding as:
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
- Reject unsupported edge cases. Record residual risk only when reachability and
  impact are proven and the current change deliberately leaves the risk
  unresolved.
- Prefer the smallest durable repair at the boundary that owns the problem.
- Choose verification after the repair passes. Do not add a test merely because
  a regression occurred; require a reachable stable contract at the lowest
  practical layer. Prefer rendered UI proof for visual defects unless stable
  behavior or state is worth automating.

## Hard stops

- Treat a non-zero `"$review_findings_bin" scope-check` as an immediate stop.
  Present a plain-language scope request according to `review-guardrails`, and
  do not run another review, apply another fix, or reset the baseline without
  explicit authorization.
- Never switch or override the review model. Retry transient capacity failures
  with the same command/model.
- Do not rerun review only to get nicer wording. The second clean confirmation
  exists to reduce missed findings, not to polish the final report.
- Do not downgrade either phase's clean stop condition because the first pass
  looks obviously clean.
- If tests, validation, or `review-until-clean` cause edits during Phase 1,
  rerun affected validation and return to Phase 1 before entering Phase 2. If
  `cold-pr-review-until-clean` causes edits during Phase 2, rerun affected
  validation and stay in Phase 2 with a fresh cold reviewer.
- Do not push just to review. Push only when the user requested publish, ship,
  PR update, another GitHub mutation, or the PR closeout step grants its one
  final push after both review phases and full local validation are clean.
- Do not start, dispatch, rerun, or monitor remote CI while findings remain.
  The final reviewed push starts the CI stage.
