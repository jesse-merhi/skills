# Model Routing

Use a sliding judgment. Route according to how much uncontained judgment the
work requires and how reliably the result can be checked, not according to a
fixed list of task categories. Apply the skill's delegation break-even gate
before choosing a worker tier.

## Working Trade-off

| Tier | Strength | Cost and speed | Default role |
| --- | --- | --- | --- |
| Sol Extra High | Best judgment under ambiguity and broad context | Highest relative cost | Default implementer, oracle, architecture, review |
| Luna Max | Capable when direction is exact; most sensitive to missing context | Lowest relative cost and fastest throughput | Preferred guided delegation exception |
| Terra Max | Strong implementation with better economics than Sol | Middle tier | Exceptional native implementer and optional Luna supervisor |

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

Start with Sol. Keep work there when ambiguity or blast radius dominates, or
when review would require Sol to reconstruct most implementation decisions.
When delegation clearly wins, prefer Luna if Sol can supply a complete ordered
walkthrough, ownership is bounded, validation is decisive, and recovery is
cheap. Use Terra only when implementation needs continuing judgment, native
shared-workspace integration, or valuable parallel decomposition that Luna
cannot provide. Terra applies the same cutoff before routing a bounded part of
its assignment to Luna.

Any task category can land at any tier. A precise production change with a
strong regression test may be a good Luna assignment. A short read-only task
that requires architectural interpretation may belong with Terra or Sol.

## Luna Cutoff

Before creating a Luna task, its Sol or Terra creator must be able to answer yes
to all of these:

1. Can I state one bounded outcome and the decisions already made?
2. Can I give an ordered walkthrough with exact files, symbols, invariants,
   expected intermediate states, and validation?
3. Can I grant exclusive ownership or isolate the work in a worktree?
4. Can I name validation that would expose the likely bad implementations?
5. Can I inspect and integrate the result more cheaply than doing it myself?

If the contract becomes longer or harder to reason about than the work, keep
the work with its current owner. If Luna fails because the contract was
incomplete, improve the walkthrough once. Escalate to Terra only when its
continuing judgment now provides a clear advantage over direct Sol.
