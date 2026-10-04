# Expensive suites

Use this when test changes could materially affect execution cost or total workflow time (makespan), or when runtime optimization is requested. First apply the permanent-test value gate in [Writing Good Tests](../SKILL.md). Retire low-value proof before optimizing the remaining tests; preserve justified proof and explicitly required checks.

## Compare like with like

Before authorized edits, capture a baseline when practical. Record the exact revision, selected files/flows and expanded cases, command, discovery rules, shard count, retries, setup/cache behavior, runner environment, and timing source. Compare the candidate under the same controls except for the intended change.

Prefer observed representative durations. A maintained duration inventory can support modeling if both sides use the same inventory, unknown-test fallback, and runner model. Label modeled values; never present them as observed wall time. If reliable data is unavailable, state the limit rather than inventing timings.

Report the metrics the evidence supports:
- portfolio size: files/flows and expanded cases;
- total work: the sum of test durations;
- load per shard under the real planner and execution model;
- workflow makespan, including dependencies, non-shard stages, start offsets, runner capacity, queueing, worker concurrency, setup, and teardown;
- observed or billable runner-minutes, including relevant setup overhead.

The longest shard is not automatically the workflow's total time. Counts and deleted lines do not prove a speedup.

## Reduce duplicated work

Apply the retention, integration-first and coverage ownership policy in [Writing Good Tests](../SKILL.md). Also remove unused selectors and duration entries.

Recheck affected consequential failures and useful complete journeys when changed inputs invalidate their evidence or an unresolved proof question requires it. Preserve explicitly required checks. Speed alone does not justify removing valuable proof; deliberate retirement of low-value last coverage needs an honest no-test-needed decision, not an invented replacement.

## Balance only when scheduling is in scope

Prefer the repository's runner, selector, timing source, and CI orchestration. An unsharded suite alone does not justify adding shards or runner cost.

If tests are freely assignable, independent, and sequential on interchangeable shards, useful timings exist, and native tooling lacks a suitable primitive, a simple baseline is longest-processing-time greedy assignment: sort longest first with deterministic ties, assign each to the lightest shard, then report every load and its maximum. For concurrent workers within shards, use the runner's balancer or a concurrency-aware model instead.

Compare portfolio changes with the same planner and shard count. Compare scheduling changes with the same test set. If both change, show separate comparisons so their effects remain attributable.

## Validate within authority

Audit-only work inspects existing evidence and proportionate safe diagnostics; it does not launch a full suite merely for measurements. Measurement-only work may run the authorized measurements and their normal incidental cache/state writes, but must not edit tests or infrastructure.

After authorized edits, validate discovery/configuration, changed selectors and helpers, and every affected shard or an equivalent full-suite gate. Run typecheck and lint for changed shared contracts or infrastructure. Remeasure with the baseline method where practical.

For portfolio reduction, stop when every remaining scoped test has a justified value decision and no further deletion or consolidation is warranted. Outcomes that need permanent protection must retain effective passing proof; record deliberate low-value retirement as no-test-needed, even for the last owner. Complete explicitly required checks.

For scheduling changes, require complete assignment, passing planner/configuration checks, and a comparable distribution measurement. Apply both completion checks when both levers changed. Do not invent a percentage target; remaining runtime alone is not evidence of waste.

Return raw before/after values, deltas, timing sources, and observed versus modeled labels. Use percentages only for comparable measures. Include total work and critical-path change when supported; state measurement limits and separate out-of-scope infrastructure or testability costs.
