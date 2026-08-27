# Budgets

## Wall-clock budget

- Default: **8 hours per review run**, measured from `review_started`.
- Check before starting each review cycle.
- When the budget has expired, stop fixing and report honestly: findings
  recorded, remaining findings triaged, and a handoff summary of what is still
  open.
- Do not keep looping past the budget because a clean streak is almost met.
- A machine-local override may set a different budget value for one machine. It
  must name a value; "no budget" is not a valid override.

## Diff-growth budget

- Limit: exactly **30% of baseline human-authored changed LOC**. Human-authored
  LOC includes production and test lines. The review CLI exposes no flag that
  lets the agent raise the percentage and applies no absolute floor.
- Every budget keeps the allowance computed when it was created, and only
  `scope-authorize` recomputes it. Reading a budget never rewrites it, so the
  stored allowance stays the bound the review was actually held to and keeps
  agreeing with the recorded status and event trail. An unfinished budget from
  the retired production-only metric becomes `rebaseline-required`; resume it
  only through an explicitly authorized `scope-authorize`. Completed legacy
  budgets retain their historical metric and output.
- Production and test changed lines are additions plus deletions from Git
  numstat. Test paths are files under
  `test`, `tests`, `__tests__`, or `__snapshots__`, plus `*.test.*` and
  `*.spec.*`.
- Recognized dependency lockfiles are generated and excluded from the limit;
  the CLI reports their changed lines separately. Recognized lockfiles are
  encoded in the CLI and include npm, pnpm, Yarn, Bun, Cargo, Ruby, PHP, Python
  Poetry, and uv lockfiles.
- Calculate `baseline_total = baseline_production_lines +
  baseline_test_lines`, then `allowed_growth = floor(baseline_total *
  limit_percent / 100)`. Stay within `baseline_total + allowed_growth` with no
  new binary human-authored path. Added text paths are informational; any new
  production or test binary requires authorization because LOC cannot measure
  its size.
- Resolve `review_findings_bin` from the installed `code-review` skill directory as
  required by `review-guardrails`. Persist the baseline with
  `"$review_findings_bin" scope-start`. Run `"$review_findings_bin" scope-check` after
  every accepted fix and before another
  review invocation. The command measures committed, staged, unstaged, and
  untracked files against the frozen base commit. Keep the SQLite database
  outside the reviewed repository.
- A blocked check exits non-zero and prints the measured overage, new
  human-authored paths, completed findings, requested reason, and the required
  user consult.
  Stop the review immediately and present that information to the user.
- `scope-complete` re-measures and blocks when the tree is outside the budget,
  but it detects drift only by that same allowance. Known gap: work that appears
  between the final `scope-check` and `scope-complete` closes as clean if it
  stays inside the allowance. Treat a clean close as evidence about the tree
  the final check measured, not proof that nothing changed afterwards. A drift
  gate that compares tree identity belongs in its own change.
- Resume only after explicit user authorization. Record their words and the new
  scope with `"$review_findings_bin" scope-authorize`; this creates a new baseline and
  restarts the current review phase. If authorization is denied, revert the
  over-budget fix, defer the finding, and restore a passing scope check.
- After the full review is clean, run a final passing check and
  `"$review_findings_bin" scope-complete`. Until then, another `scope-start` on the same
  repository and branch is rejected even if the caller changes the target label.
- Past the time budget, stop and record the expiry in the loop report. Keep
  unanswered consult and investigate findings open. Use `deferred` only for
  explicitly accepted residual risk or an explicit owner decision.
- When the honest answer is that the PR should be split, say so plainly.
