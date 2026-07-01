# Budgets

## Wall-Clock Budget

- Default: **8 hours per review run**, measured from `review_started`.
- Check before starting each review cycle.
- When the budget has expired, stop fixing and report honestly: findings
  recorded, remaining findings triaged, and a handoff summary of what is still
  open.
- Do not keep looping past the budget because a clean streak is almost met.
- A machine-local override may set a different budget value for one machine. It
  must name a value; "no budget" is not a valid override.

## Diff-Growth Budget

- Review fixes may grow the diff by about **30% of baseline lines**.
- New tests that prove a fixed bug do not count against the budget.
- Check after every fix batch by comparing `git diff --stat` of the current
  target against `baseline_diff`.
- A fix that would exceed the budget, or touch a file outside the mapped review
  surface, is never applied silently: it becomes a consult-queue item.
- Past the budget, remaining findings become `deferred` entries in the findings
  database or loop report.
- When the honest answer is that the PR should be split, say so plainly.
