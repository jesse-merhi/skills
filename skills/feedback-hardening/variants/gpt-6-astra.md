---
name: feedback-hardening
description: "Evidence-backed user corrections or self-detected mistakes revealing reusable agent failures: delegate one systemic-fix recommendation, get approval, then implement it."
---

# Feedback hardening

Outcome: turn evidence of one reusable agent failure into one approved,
verifiable systemic repair without derailing the current task.

## 1. Qualify and capture the failure

Use this workflow when:

- the user corrects how the agent worked and the evidence reveals a missing
  reusable guard or a failure likely to recur; or
- the agent independently finds that its action violated a reusable invariant
  across tasks, sessions, repositories, or users.

Handle trivial typos, expected review findings, ordinary debugging discoveries,
changed objectives, factual clarifications, vague criticism, and one-deliverable
preferences in the current task unless they expose that reusable invariant.

Acknowledge user feedback briefly. Repair the immediate user-facing result only
when existing task authority allows it. Capture and redact:

- the observed behavior and desired invariant;
- concrete evidence and affected surface;
- current task state and permissions;
- the likely Git repository or host-managed target.

Before the first recommendation, require a clean Git target and record an
immutable baseline: its canonical worktree root, absolute `--git-common-dir`,
`HEAD`, and evidence that the index, tracked tree, and untracked scope were
clean. A dirty target is a visible blocker. Once approved implementation begins,
keep that baseline and record the current implementation checkpoint separately:
phase, evidence and recommendation IDs, approval state, selected option, frozen
scope, current `HEAD`, exact status, a state checksum with the command and hash
algorithm used to produce it, validation, and next action. For managed targets,
use the same split between the original revision or ETag and the current
approved state.

Keep one active hardening workflow per source conversation. Same-invariant
evidence refreshes it; a distinct direct or relayed invariant waits until the
active workflow closes. This step is complete when the immediate task is safe
to continue and the failure is stated as an observable invariant.

## 2. Delegate one recommendation

The source conversation remains the coordinator. Spawn one cold native
subagent, or the harness's equivalent isolated worker, solely to produce the
recommendation. In Codex, use `spawn_agent` with
`fork_turns: "none"`; in OpenClaw, use isolated context without a
transcript fork; elsewhere, use the harness's no-history equivalent.

Give it a compact redacted brief containing:

- an opaque workflow ID and evidence version;
- the captured failure, invariant, evidence, and coordinator-owned constraints;
- the immutable target baseline and current implementation checkpoint or its
  explicit absence;
- `role: feedback-hardening-recommendation`;
- `authority: recommendation-only`, with no coordinator approvals;
- an instruction to load `$feedback-hardening`, start at step 3, and return a
  closed envelope with the workflow ID, evidence version, target identity,
  reproducible state checksum, outcome, and no-mutation attestation.
  `recommended` requires a recommendation ID and options; `retargeted` requires
  the proposed target and evidence; `blocked` requires the actionable blocker.

The recommendation phase makes no state changes. Use a harness-enforced
read-only profile when available. Otherwise state that this is an
instruction-only boundary and tell the worker not to edit files, create or
update pull requests, post externally, or delegate implementation.

Retain the returned child handle. While the worker prepares the recommendation,
complete independently authorized task-local work, then use the harness's
event-driven wait or yield mechanism. Accept a brief only with the
retained handle's host-authenticated terminal `Completed` event, never
an interim message. Fail closed unless every required envelope field matches
and the no-mutation attestation is true. Surface a host-authenticated terminal
failure even when it lacks model-authored fields.

After a wait timeout, inspect only the retained handle. Recover and authenticate
its terminal result when available; otherwise report the exact delivery or
worker blocker. On abandonment or unrecoverable delivery failure, use a
harness-supported terminalization mechanism and wait for authenticated settled
status before releasing the slot. Codex V2 interruption is not terminalization;
without a terminal event, report an unreleasable blocker and keep the slot.
Do not search unrelated sessions. The recommendation worker never receives
approval or mutation authority and is never reused for implementation.

This step is complete when the coordinator has one authenticated recommendation
brief, or the user sees the actionable launch or delivery blocker.

### Hand off an active workflow

Settle the retained recommendation worker before handing the source
conversation to another full session. Worker handles are coordinator-local
unless the harness proves otherwise, so do not transfer an unresolved worker or
release its execution slot through a handoff.

Carry the workflow ID and evidence version, immutable target baseline,
authenticated recommendation, and current implementation checkpoint or its
explicit absence in the handoff document's current state, evidence, blockers,
suggested skills, and next concrete actions sections. Name
`feedback-hardening` as a suggested skill.

The successor revalidates the baseline, compares the current repository state
with the checkpoint, and decides how to continue the recorded next action. An
exact checkpoint match proves only that the carried state is intact; it does
not replace the successor's judgment, infer approval, or widen authority.
Expected changes inside the frozen scope remain valid when the worktree is
dirty. Base drift, a checkpoint mismatch, out-of-scope changes, or new evidence
requires a fresh recommendation under step 4. Refresh the checkpoint after
authorized work before another handoff.

The source coordinator retains ownership until a harness-delivered successor
acknowledgement verifies adoption. If adoption cannot be verified, report the
transfer blocker and keep the workflow active.

## 3. Recommend the systemic fix

The recommendation worker reconstructs the failure, locates the producer or
lifecycle owner, and ranks credible prevention options:

1. eliminate the invalid choice through architecture, data structures, types,
   schemas, APIs, ownership, or lifecycle design;
2. enforce the invariant with a focused test, lint rule, type or schema check,
   CI gate, or deterministic verifier;
3. encode reusable judgment in the narrowest existing skill or scoped agent
   instruction;
4. rely on human review only when stronger enforcement is unsuitable.

Lead with one recommendation. For each credible option, state its mechanism,
owner and affected surfaces, recurrence prevented, proof plan, implementation
scope, material risks, and why stronger layers are unsuitable. Prefer existing
abstractions and skills over parallel mechanisms. Avoid hardcoding the user's
wording or reported example.

If the investigation identifies a different target or changed evidence, return
that fact instead of recommending against stale context. The coordinator updates
the evidence version and target state, then runs a fresh recommendation.

When an existing skill caused or failed to prevent the behavior, report it to
the coordinator without repair or nested delegation. The coordinator applies
the harness-owned skill-repair policy and `writing-for-agents` after the worker
terminates. Higher-priority harness policy wins; disclose any immediate repair
and keep additional systemic work pending approval.

This step is complete when the coordinator receives a ranked brief tied to the
final evidence version and target state.

## 4. Approve and implement

Validate the closed envelope and require its target state to equal the current
target exactly; otherwise run a fresh recommendation. Present the ranked brief.
Before requesting approval, freeze:

- the recommendation ID and selected option;
- the evidence version;
- the final target identity and state;
- the complete mutation scope and mechanism.

Wait for explicit approval of a named option. Approval covers only reversible
changes on the frozen, bound target. It does not carry to later evidence or bypass gates
for public writes, publication, merges, deployment, destructive actions,
protected schema or protocol changes, spending, or access expansion.
If the user declines, skip implementation, record `declined`, release the slot
after worker settlement, and offer the next queued invariant.

After approval, the source coordinator implements through the target
repository's or mechanism's normal workflow. It may use implementation workers
required by that workflow, but the recommendation worker remains retired.

For Git, require the immutable root, `--git-common-dir`, and baseline `HEAD` to
match, then require the current state to equal the recommendation's bound
checkpoint before editing. The initial checkpoint is clean; a refreshed
recommendation during approved implementation may bind an intentionally dirty
checkpoint. Continue only within the frozen scope, root every operation in that
worktree, and refresh the checkpoint after authorized changes. For a
host-managed surface, bind both the original revision or ETag and the current
approved state, and use the appropriate revision as a conditional-write
precondition.

Any pre-action mismatch, base drift, out-of-scope change, new same-invariant
evidence, or retargeting invalidates approval and returns to a fresh
recommendation. Changes made within the frozen scope update the implementation
checkpoint without requiring another recommendation. A distinct invariant
queues for later without changing the approved work.

Implementation workers that find qualifying evidence stop affected mutation
and report it directly to the source coordinator. They do not start another
feedback-hardening workflow.

This step is complete when the approved repair is implemented and verified, or
the exact permission, state, or product blocker is visible.

## 5. Close the workflow

Return to the source conversation and report:

- the original behavior and root cause;
- the approved option, owner, and prevention layer;
- files, checks, skills, or rules changed;
- before-and-after evidence;
- remaining authorization requests or recurrence risks;
- the recommendation brief or worker link.

Record `completed`, `declined`, `failed`, or
`abandoned`, release the active slot, and offer the next queued
invariant. Do not release a slot while its recommendation result is unresolved
or an implementation worker is still running.

This step is complete when the user can verify the outcome and why the same
intervention should no longer be necessary, or sees the terminal
non-implementation result.
