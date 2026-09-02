# Expensive suite optimisation

Use this workflow when a portfolio audit aims to reduce test runtime, runner
cost, or the wall-clock duration of a parallel suite. Performance pressure does
not lower the ownership bar: first preserve one executable owner for every
retained risk, then optimise how those owners are expressed and scheduled.

## Freeze a comparable baseline

Before editing, record the exact baseline test or flow set and the command,
discovery boundary, selection rules, shard count, retry policy, setup and cache
behavior, timing source, and relevant runner environment. Record the resulting
candidate set separately while holding the other conditions constant. If the
planner or shard count also changes, report that as a separate comparison so
portfolio savings remain attributable.

Prefer observed elapsed durations from representative runs. A maintained
duration inventory is acceptable for fast, repeatable modelling when compared
states use the same inventory, fallback for unknown tests, and runner execution
model.
Label modelled results as modelled; do not present them as observed wall time.
State limitations instead of inventing timings when reliable data is absent.

Record the metrics the environment can support:

- discovered files or flows and expanded test cases;
- total test work, calculated as the sum of test durations;
- per-shard loads under the actual planner, shard count, and runner execution
  model;
- parallel critical path, using observed per-shard elapsed time or a
  runner-aware model that includes intra-shard concurrency and setup; and
- observed or billable runner-minutes when available, including setup overhead
  if the runner charges or materially delays each shard.

Do not substitute the maximum sum of test durations for the critical path
unless each shard executes its tests sequentially.

File count, test count, and lines deleted describe portfolio size but do not
prove a runtime improvement.

## Reduce the owned portfolio

Use this section when portfolio reduction is in scope. For scheduling-only work,
preserve the test set and continue to **Balance parallel work**.

Build the ownership map in [portfolio.md](portfolio.md), then remove equivalent
duplicate journeys, ownerless assertions, and presentation or wiring checks
that protect no stable contract. Consolidate distinct owners when they can
share setup without hiding which regression each case protects. Remove
test-only routes, fixtures, helpers, selectors, and duration entries that have
no retained executable caller.

After each cohesive reduction batch, re-run the ownership challenge. Account
explicitly for every retained high-risk branch and valuable golden journey;
runtime savings do not substitute for a replacement owner when one is required.

## Balance parallel work

Optimise sharding only when parallel wall-clock duration is part of the goal
and the additional runner usage or cost is acceptable within the user's scope.
An unsharded suite is not by itself a reason to introduce sharding.

Prefer the repository's existing runner, selector, timing source, and CI
orchestration over a competing scheduler. When independent tests run
sequentially within each shard, have useful duration estimates, and the
existing tooling has no suitable balancing primitive, longest-processing-time
greedy assignment is a simple baseline:

1. sort tests from longest to shortest, with a deterministic tie-break;
2. assign each test to the currently lightest shard; and
3. report every resulting shard load and their maximum.

For concurrent execution within a shard, use the runner's native balancing or
a model of its worker concurrency instead of treating the shard as a serial
queue.

Compare scheduling changes with the same test set. Compare portfolio changes
with the same planner and shard count. This separates cheaper coverage from
better distribution and prevents a lower total duration from concealing one
overloaded shard.

## Validate and stop

Run the suite's discovery or configuration validation, the tests for changed
selectors and helpers, and every affected shard or equivalent full-suite gate.
Run typecheck or lint when shared contracts or test infrastructure changed.
Re-measure the final state with the baseline method when practical.

For portfolio reduction, stop at the portfolio fixed point: a fresh ownership
pass finds no equivalent duplicate owner, ownerless test or infrastructure, or
lower-cost proof level that can be removed, consolidated, or moved without
losing a promised regression. Completion also requires every retained risk to
have its named owner and the final validation to pass. Require comparable
measurement when practical; otherwise report the available portfolio counts
and the timing limitation.

For scheduling-only work, stop when the preserved test set is fully assigned,
the changed planner and configuration pass, and comparable measurement shows
the resulting distribution. Do not use an arbitrary percentage target;
remaining runtime alone is not evidence that coverage is disposable or that a
more complex scheduler is justified. Report infrastructure or product-
testability costs that remain outside the requested optimisation as separate
follow-up work.

Report the available raw before and after values, deltas, timing source, and
whether each figure is observed or modelled. Include percentages only for
comparable measures. For parallel suites, include shard loads and both total
test work and critical-path change when the timing evidence supports them;
either number alone can hide the cost that matters to maintainers.
