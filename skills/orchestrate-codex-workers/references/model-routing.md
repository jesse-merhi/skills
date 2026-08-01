# Model Routing

Use a sliding judgment. Route according to how much uncontained judgment the
work requires and how reliably the result can be checked, not according to a
fixed list of task categories.

## Working Trade-off

| Tier | Strength | Cost and speed | Default role |
| --- | --- | --- | --- |
| Sol Extra High | Best judgment under ambiguity and broad context | Highest relative cost | Oracle, specification, architecture, review |
| Terra Max | Strong implementation with better economics | Middle tier | Default native implementer and Luna supervisor |
| Luna Max | Capable when direction is exact; most sensitive to missing context | Lowest relative cost and fastest throughput | Optional independent worker |

For local planning, treat the user's rough Sol `10/10` intelligence and cost,
and Luna `6–7/10` intelligence with `1/10` cost, as a heuristic rather than a
published benchmark. Treat “Luna Max is comparable to an older GPT-5.4 Extra
High” as a hypothesis to test. Do not repeat these ratings in worker prompts;
they help the parent manage risk but do not help the worker perform.

## Routing Dimensions

Consider these dimensions together:

- **Ambiguity:** How many product, architecture, or debugging decisions remain?
- **Blast radius:** How costly is a subtly wrong result?
- **Contract completeness:** Can the prompt name the behavior, boundaries, and
  invariants without relying on unstated context?
- **Coupling:** Can the worker own a clean slice without racing other edits?
- **Validation strength:** Will tests, types, builds, or observable checks catch
  the plausible mistakes?
- **Recovery cost:** Can the result be reviewed, corrected, or discarded
  cheaply?

Keep work with Sol when ambiguity or blast radius dominates. Route
implementation to Terra by default. Let Terra select Luna when the contract is
complete, ownership is bounded, validation is decisive, and recovery is cheap.

Any task category can land at any tier. A precise production change with a
strong regression test may be a good Luna assignment. A short read-only task
that requires architectural interpretation may belong with Terra or Sol.

## Luna Cutoff

Before creating a Luna task, Terra must be able to answer yes to all of these:

1. Can I state one bounded outcome and the decisions already made?
2. Can I give the minimum relevant files, symbols, and invariants?
3. Can I grant exclusive ownership or isolate the work in a worktree?
4. Can I name validation that would expose the likely bad implementations?
5. Can I inspect and integrate the result more cheaply than doing it myself?

If the contract becomes longer or harder to reason about than the work, keep
the work in Terra. If Luna fails because the contract was incomplete, improve
the contract once; if judgment remains the blocker, Terra owns the correction.
