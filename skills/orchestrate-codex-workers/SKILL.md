---
name: orchestrate-codex-workers
description: 'Delegate reasonably sized repository implementation to Luna Max or Terra Max while Sol supplies a concise opinionated brief, steers important decisions, and performs targeted review. Load before planning or implementing repository changes so tiny edits stay local and non-trivial execution uses cheaper workers without exhaustive Sol planning.'
---

# Orchestrate Codex Workers

Apply this skill as the routing layer around repository and domain skills. Once
a request clearly requires non-trivial implementation, delegate the execution
to Luna or Terra when coordination is cheaper than doing the edit in Sol. Keep
Sol focused on important decisions, strong opinions, steering, integration,
and final judgment. Do not have Sol write a second implementation in prose.

Respect an explicit user request to use a different model, work without
delegation, or stop at a plan. If a required model or tool is unavailable, use
the nearest capable tier and report the fallback rather than inventing the
requested topology.

## Target Topology

```text
Sol Extra High: oracle, important decisions, steering, targeted final review
├── Luna Max: preferred bounded implementer in an independent Codex task
├── Terra Max: judgment-heavy native implementer; native depth ends here
│   └── Luna Max: optional independent Codex task
└── Fresh Sol High: optional read-only independent audit by exception
```

Only the Sol root invokes native subagent tools. Explicitly select Terra with
Max reasoning for every native worker. Prefer a direct independent Luna Max
Codex task for bounded work with strong validation. Use Terra when execution
needs more continuing judgment, native shared-workspace coordination, or
valuable parallel decomposition. Sol or Terra may create Luna tasks. Luna does
not delegate further.

## Delegation Break-even

Keep work in Sol when writing the brief, coordinating the worker, reviewing its
diff, and validating it would cost more than the edit itself. A normal five-line
change should remain in Sol. A tiny high-risk change also remains in Sol because
it needs judgment rather than implementation capacity.

For a reasonably sized implementation, prefer delegation when Sol can state the
outcome, important constraints, and validation without designing every edit.
Do not require a complete implementation plan before dispatch. The worker owns
ordinary code-level choices inside the brief's boundaries.

Prefer Luna when the outcome is bounded and validation can expose likely bad
implementations. Prefer Terra when the task benefits from more autonomous
judgment or native parallel work. When the comparison with direct Sol is close,
choose the path that minimizes Sol's expected implementation and review effort.

## Active Oracle Supervision

Treat Terra and Luna as capable but untrusted implementers. Sol remains the
active guide throughout delegated work, not only the author of the first prompt
and reviewer of the final diff.

- Give each worker Sol's concise opinionated brief: the outcome, important
  decisions, preferred direction, relevant repository patterns, constraints,
  likely failure modes, and decisive validation.
- Do not prescribe ordinary implementation details that the worker can resolve
  cheaply from the repository. Add step-by-step direction only for a fragile or
  non-obvious part where the guidance materially reduces risk.
- Define direction checkpoints in the worker contract. Have the worker send a
  mailbox event when it needs a decision, reaches a material discovery or
  failure, proposes a scope or approach change, or completes its assignment.
- After dispatching a native Terra worker, call
  `wait_agent({timeout_ms: 3600000})`. Worker messages, completion, and new user
  input wake Sol immediately; the one-hour timeout is only a recovery boundary
  for a possibly stalled or lost worker. Never use shorter recurring timeouts
  to monitor healthy progress. If the runtime rejects one hour, use its longest
  supported bounded timeout.
- On a mailbox event, inspect the reported evidence and any relevant shared
  diff. When Sol sees a mistaken assumption, repeated unproductive work, or a
  better path, steer the worker immediately with concrete reasoning and an
  updated approach.
- On a timeout without new evidence, inspect worker state once to diagnose a
  stall, missed event, or failure. Resume the event wait when the worker is
  healthy. Reserve manual status listing for that recovery branch.
- Have Terra actively supervise Luna tasks it creates and surface material
  pivots or repeated failures to Sol. Sol may steer Terra or Luna whenever its
  guidance is likely to save time or improve correctness.
- Continue in the same worker context when correcting direction. Do not wait
  passively for completion once evidence shows the worker is wandering.

Let correct, deterministic progress remain quiet. Spend Sol turns on worker
events, concrete evidence, steering, integration, and review.

## Opinionated Worker Brief

Give the worker enough senior guidance to avoid predictable wrong turns without
making Sol pre-implement the change.

- State one observable outcome and the smallest useful starting context.
- State Sol's opinions on architecture, repository patterns, public behavior,
  invariants, risky areas, and alternatives that should not be pursued.
- Name acceptance criteria and validation that expose likely mistakes.
- Let the worker inspect the bounded area and choose ordinary implementation
  details. Do not require exact file-by-file stages or intermediate states when
  they add no safety.
- Name only consequential pause points: a failed required check, contradictory
  repository evidence, a missing decision, or a proposed change of approach.
  Have Luna request attention with evidence at those gates. Routine correct
  execution remains quiet.
- Require Luna to run every specified validation before completion. A claim of
  completion without evidence is not acceptable.
- Keep corrections in the same Luna task while its context remains useful.
  Archive it after accepting or rejecting the result.

## Workflow

1. Frame the important parts before delegation.
   - Read the applicable repository instructions and domain skills.
   - Resolve consequential ambiguity or ask the user when it cannot be resolved
     safely.
   - Define observable acceptance criteria, owned scope, constraints, and exact
     validation.
   - Stop once the worker has enough direction to proceed safely. Do not turn
     this step into a full implementation plan.

2. Choose the worker tier.
   - Read [model-routing.md](references/model-routing.md).
   - Keep tiny work in Sol when delegation overhead exceeds implementation.
   - Keep architecture, cross-cutting trade-offs, risky debugging calls, and
     final review with Sol.
   - For reasonably sized bounded implementation, prefer direct Luna Max when
     validation is decisive and recovery is cheap.
   - Use one or more Terra Max native workers when continuing judgment, native
     shared-workspace coordination, or disjoint parallel ownership makes Terra
     a better implementer.
   - Let each Terra worker decide whether Luna improves its assigned scope.
     Terra applies the same coordination-cost test to that Luna task.

3. Dispatch a concise opinionated brief.
   - Read [worker-contract.md](references/worker-contract.md) before writing a
     Terra or Luna prompt.
   - Give the worker relevant context, decisions, boundaries, invariants, Sol's
     important opinions, acceptance criteria, validation, and return shape.
   - Keep design and unresolved judgment with the assigning agent.
   - Include detailed steps only for fragile or non-obvious parts. Leave normal
     implementation choices to the worker.
   - Complete this step when the worker can proceed without guessing about
     consequential decisions.

4. Supervise implementation.
   - If Sol or Terra selects Luna, read
     [session-lifecycle.md](references/session-lifecycle.md) and follow the full
     create, wait, integrate, validate, and archive lifecycle.
   - Have Terra implement its scope in the native shared workspace when its
     routing criteria fit better than Luna.
   - Wait on Terra's mailbox events with `wait_agent({timeout_ms: 3600000})`.
     Treat a timeout as the recovery branch, not a recurring progress
     checkpoint.
   - Make the Luna task's creator responsible for its prompt, decisions,
     integration, independent validation, and archival.
   - Have Sol inspect meaningful progress and proactively steer mistaken
     assumptions, direction changes, repeated failures, or unnecessary scope.
   - Continue corrections in the same worker or task while its context is
     useful. Supply failing evidence and the expected behavior, not a vague
     request to try again.
   - Complete this step when every worker has returned a result or a diagnosed
     blocker, and every Sol intervention is tied to a worker event or concrete
     evidence.

5. Integrate and verify independently.
   - Inspect the net diff and high-risk flows; confirm ownership and invariants.
     Review proportionately instead of re-deriving every ordinary edit.
   - Re-run the specified validation in the integration workspace. Treat a
     worker's reported result as evidence, not proof.
   - Send material defects back to the worker that owns them when practical.
     Keep a correction in Sol only when that correction independently falls
     below the delegation break-even gate. If it changes behavior or needs new
     regression coverage across more than one tightly local site, prefer the
     worker that already owns the implementation context.

6. Close with oracle review.
   - Have the active root Sol review the integrated behavior and highest-risk
     contracts in its existing context. During review, keep material code and
     regression fixes with the owning Luna or Terra worker; root Sol retains
     judgment rather than becoming a second implementer.
   - After a worker repair, have root Sol rerun the failing evidence and resume
     its targeted review. Escalate Luna work to Terra after a repeated material
     miss instead of starting an unbounded repair loop.
   - Use a fresh independent Sol High reviewer only when independence is worth
     its cold-context cost: high blast radius, weak validation, material worker
     drift, compromised root impartiality, or an explicit cold-review request.
     Read [review-lifecycle.md](references/review-lifecycle.md) for that branch.
   - Have root Sol compare the final evidence with the original acceptance
     criteria and retain the accept, escalate, or rethink decision.
   - Run the repository's final relevant verification and confirm every
     independent implementation and review task is archived, including failed,
     cancelled, or abandoned tasks.
   - Report the implemented behavior, validation, worker fallbacks, and any
     residual risk.

## Completion Criteria

- The root retained specification, integration, and final judgment.
- Tiny changes stayed in Sol; reasonably sized implementation was delegated
  when coordination cost less than direct execution.
- Every worker received a concise opinionated brief rather than an unnecessary
  full implementation plan.
- Luna was preferred for bounded work; Terra owned work needing more autonomous
  judgment or native coordination.
- Sol supplied an approach and promptly corrected every observed worker drift,
  material pivot, or repeated failure.
- Every native worker used Terra Max and no Terra worker spawned a native child.
- Every Luna task used Max reasoning, received an opinionated brief, and was
  integrated, independently validated, and archived by its creator.
- The integration agent independently validated accepted worker changes.
- Root Sol reviewed substantial delegated work without absorbing material
  implementation fixes. When independence justified a fresh Sol High audit,
  its reviewer remained read-only and its findings returned to the owning
  implementer.
- Root Sol judged the integrated result against observable acceptance criteria.
