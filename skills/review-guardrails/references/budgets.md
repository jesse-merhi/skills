# Budgets

## Wall-Clock budget

- Default: **8 hours per review run**, measured from `review_started`.
- Check before starting each review cycle.
- When the budget has expired, stop fixing and report honestly: findings
  recorded, remaining findings triaged, and a handoff summary of what is still
  open.
- Do not keep looping past the budget because a clean streak is almost met.
- A machine-local override may set a different budget value for one machine. It
  must name a value; "no budget" is not a valid override.

## Diff-Growth budget

- Limit: exactly **30% of baseline production changed lines**. The review CLI
  exposes no flag that lets the agent raise this percentage.
- Production changed lines are additions plus deletions from Git numstat. Each
  changed binary production file counts as one line-equivalent.
- Test paths and recognized dependency lockfiles do not count toward the limit;
  the CLI reports their changed lines separately. Test paths are files under
  `test`, `tests`, `__tests__`, or `__snapshots__`, plus `*.test.*` and
  `*.spec.*`. Recognized lockfiles are encoded in the CLI and include the npm,
  pnpm, Yarn, Bun, Cargo, Ruby, PHP, Python Poetry, and uv lockfiles.
- Calculate `allowed_growth = floor(baseline_production_lines * limit_percent / 100)`.
  The review remains inside budget only when current production changed lines
  are no greater than `baseline + allowed_growth` and no new production path
  exists outside the frozen baseline file set.
- Resolve `review_findings_bin` from the installed `code-review` skill directory as
  required by `review-guardrails`. Persist the baseline with
  `"$review_findings_bin" scope-start`. Run `"$review_findings_bin" scope-check` after
  every accepted fix and before another
  review invocation. The command measures committed, staged, unstaged, and
  untracked files against the frozen base commit. Keep the SQLite database
  outside the reviewed repository.
- A blocked check exits non-zero and prints the measured overage, new production
  paths, completed findings, requested reason, and the required user consult.
  Stop the review immediately and present that information to the user.
- Resume only after explicit user authorization. Record their words and the new
  scope with `"$review_findings_bin" scope-authorize`; this creates a new baseline and
  restarts the current review phase. If authorization is denied, revert the
  over-budget fix, defer the finding, and restore a passing scope check.
- After the full review is clean, run a final passing check and
  `"$review_findings_bin" scope-complete`. Until then, another `scope-start` on the same
  repository and branch is rejected even if the caller changes the target label.
- Past the budget, remaining findings become `deferred` entries in the findings
  database or loop report.
- When the honest answer is that the PR should be split, say so plainly.
