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

- Limit: the greater of **150 production changed lines** and **30% of baseline
  production changed lines**. The review CLI exposes no flag that lets the agent
  raise either bound.
- The floor exists because a percentage alone starves small reviews: a 40-line
  baseline yields a 12-line allowance, too tight for one honest fix. A review
  that changed production code gets at least the floor, and the percentage
  governs again once 30% of the baseline exceeds it.
- A baseline with no production changes keeps a zero allowance, so it must ask
  before it touches production code at all. This covers less than it sounds
  like: everything that is not a test path or a recognized lockfile counts as
  production, so a Markdown-only or asset-only branch has a nonzero baseline and
  carries the full floor. Only an all-test or all-lockfile diff gets zero.
- The floor is deliberately flat rather than scaled to baseline size, so a
  one-line production baseline carries the full floor. This is an accepted
  trade-off: the floor exists to give a small review workable room, and sizing
  it to the diff would reintroduce the starvation it was added to fix. Three
  consequences follow, and none is a defect to patch. A one-line change such as
  a version bump carries the full allowance. A docs-only branch does too.
  Authorizing a single production line in an all-test review re-measures the
  baseline above zero and grants the floor from then on. In every case the
  growth still passes every other gate, and growth past the floor returns to
  the user.
- Every budget keeps the allowance computed when it was created, and only
  `scope-authorize` recomputes it. Reading a budget never rewrites it, so the
  stored allowance stays the bound the review was actually held to and keeps
  agreeing with the recorded status and event trail. One consequence: a budget
  created before a change to this rule keeps the older allowance until it is
  re-authorized. That case fails safe, because the older allowance is the
  tighter one and the review stops to ask.
- Production changed lines are additions plus deletions from Git numstat. Each
  changed binary production file counts as one line-equivalent.
- Test paths and recognized dependency lockfiles do not count toward the limit;
  the CLI reports their changed lines separately. Test paths are files under
  `test`, `tests`, `__tests__`, or `__snapshots__`, plus `*.test.*` and
  `*.spec.*`. Recognized lockfiles are encoded in the CLI and include the npm,
  pnpm, Yarn, Bun, Cargo, Ruby, PHP, Python Poetry, and uv lockfiles.
- Calculate `floor_lines = baseline_production_lines > 0 ? 150 : 0`, then
  `allowed_growth = max(floor_lines, floor(baseline_production_lines *
  limit_percent / 100))`. Stay within `baseline + allowed_growth` with no new
  binary path; added text paths are informational.
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
- `scope-complete` re-measures and blocks when the tree is outside the budget,
  but it detects drift only by that same allowance. Known gap: work that appears
  between the final `scope-check` and `scope-complete` closes as clean if it
  stays inside the allowance, and the floor makes that tolerance wider than the
  percentage alone did. Treat a clean close as evidence about the tree the final
  check measured, not proof that nothing changed afterwards. A drift gate that
  compares tree identity belongs in its own change.
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
