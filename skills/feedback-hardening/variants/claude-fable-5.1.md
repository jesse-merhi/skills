---
name: feedback-hardening
description: "Prevent recurrence when user corrections or self-detected mistakes expose reusable agent failures; excludes ordinary debugging and one-off preferences."
---

# Feedback hardening

Use these five steps to repair a reusable agent failure. Keep the source conversation in charge. Immediate task repair and approval of a systemic change are separate decisions.

## 1. Record the failure and target

For qualifying evidence, the source coordinator must start the recommendation workflow or report its concrete blocker before closing the task. Do not wait for the user to name this skill. Reading it or completing the local repair alone is insufficient. Follow the active-workflow, queue, and worker-role rules below instead of starting duplicate or nested workflows. Continue authorized task-local work while arranging the recommendation.

1. Check the trigger. Use this workflow for an evidence-backed user correction or self-detected action that violates an invariant across tasks, sessions, repositories, or users. A typo, expected review finding, ordinary debugging discovery, changed objective, factual clarification, vague criticism, or preference for one deliverable stays task-local unless it exposes such an invariant.
2. Acknowledge user feedback briefly. Fix the immediate result only under existing task authority. Capture redacted observed behavior, desired invariant, concrete evidence, affected surface, task state, permissions, and likely Git or managed target.
3. Before the first recommendation, check that the Git target is clean. Record the canonical worktree root, absolute `--git-common-dir`, `HEAD`, and evidence that index, tracked files, and untracked scope are clean. Stop this workflow visibly if the initial target is dirty. Keep that baseline immutable.
4. Once approved implementation starts, record a separate checkpoint: phase; evidence and recommendation IDs; approval and selected option; frozen scope; current `HEAD`; exact status; state checksum with the command and hash algorithm that reproduce it; validation; and next action. For managed targets, retain the original revision or ETag separately from the current approved state.
5. Keep one active workflow per source conversation. Add same-invariant evidence to it. Queue distinct direct or relayed invariants until it closes.

Continue when the invariant is observable and the immediate task is safe to continue.

## 2. Dispatch and receive one recommendation

Spawn one cold recommendation-only worker. Use Codex `spawn_agent` with `fork_turns: "none"`, OpenClaw isolated context without a transcript fork, or another harness's no-history equivalent. Do not send conversation history or coordinator approvals.

Send these fields together:

- opaque workflow ID and evidence version;
- captured failure, invariant, evidence, and coordinator-owned constraints;
- immutable baseline and current implementation checkpoint, or an explicit statement that no checkpoint exists;
- `role: feedback-hardening-recommendation`;
- `authority: recommendation-only`;
- instruction to load `$feedback-hardening` and start at step 3;
- required closed response envelope: workflow ID, evidence version, target identity, reproducible state checksum, outcome, and no-mutation attestation. For `recommended`, require recommendation ID and options. For `retargeted`, require the new target and evidence. For `blocked`, require an actionable blocker.

Apply an enforced read-only profile if the harness supplies one. Otherwise label the boundary instruction-only. Prohibit file edits, PR creation or updates, external posts, and implementation delegation. Never grant this worker approval or mutation authority or reuse it for implementation.

Retain the child handle. Continue independent immediate work, then use the harness's event-driven wait. Accept the recommendation only after the retained handle emits a host-authenticated terminal `Completed` event. An interim message is not completion. Check all envelope fields and a true no-mutation attestation. Fail closed if any required field is missing or mismatched. Report host-authenticated terminal failure even if the worker supplied no envelope.

If waiting times out, inspect only that handle. Recover its authenticated terminal result if available; otherwise report the exact worker or delivery blocker. For abandonment or unrecoverable delivery, terminalize through a supported harness mechanism and wait for authenticated settled status before releasing the slot. Codex V2 interruption alone is not terminalization. If no terminal event is available, keep the slot and report an unreleasable blocker. Do not search unrelated sessions.

### If a full-session handoff is needed

1. Settle the recommendation worker first. Treat handles as coordinator-local unless the harness proves otherwise. Do not hand off unresolved work or use handoff to release its slot.
2. Refresh the checkpoint after authorized work. Preserve exact workflow/evidence IDs, baseline, authenticated recommendation, and current checkpoint or its absence. Put them in the handoff's current state, evidence, blockers, suggested skills, and next concrete actions. Suggest `feedback-hardening`.
3. Have the successor revalidate baseline and compare current state to the checkpoint. A match confirms carried state only; it does not grant approval, widen authority, or replace judgment. Expected dirty changes inside frozen scope are valid. Base drift, checkpoint mismatch, out-of-scope changes, or new evidence require a fresh recommendation under step 4.
4. Retain source ownership until a harness-delivered acknowledgement proves successor adoption. If adoption cannot be verified, keep the workflow active and report the transfer blocker.

## 3. Produce the recommendation

This step is for the recommendation-only worker. Reconstruct the failure, find its producer or lifecycle owner, and assess prevention in this order:

1. Eliminate the invalid choice through architecture, data structures, types, schemas, APIs, ownership, or lifecycle design.
2. Enforce the invariant with a focused test, lint rule, type or schema check, CI gate, or deterministic verifier.
3. Encode necessary judgment in the narrowest existing skill or scoped agent instruction.
4. Rely on human review only if stronger enforcement is unsuitable.

Lead with one recommendation. For each credible option, name the mechanism, owner, affected surfaces, recurrence prevented, proof plan, implementation scope, material risks, and why stronger layers are unsuitable. Prefer existing mechanisms. Do not hardcode only the user's phrasing or the reported example.

If the target or evidence changes, return `retargeted` with the new target and evidence. The coordinator must update the evidence version and target state and request a fresh recommendation. Do not recommend against stale context.

If an existing skill caused or failed to prevent the failure, report that fact. Do not edit it or delegate again. After this worker terminates, the coordinator applies the harness-owned skill-repair policy and `writing-for-agents`. Higher-priority harness policy wins; disclose any immediate repair and leave additional systemic work awaiting approval.

Return the closed envelope from step 2, with the ranked brief bound to the final evidence version and target state.

## 4. Get approval, then implement

1. Validate the envelope against exact current target state. Request a fresh recommendation if it does not match.
2. Present ranked options. Freeze recommendation ID, selected option, evidence version, final target identity/state, and the complete mutation scope and mechanism.
3. Wait for explicit approval of a named option. It authorizes reversible changes on the frozen target only. It does not carry to new evidence or bypass authority for public writes, publication, merges, deployment, destructive actions, protected schema/protocol changes, spending, or access expansion.
4. If declined, skip implementation, record `declined`, settle the worker, release the slot, and offer the next queued invariant.
5. If approved, implement through the target's normal workflow. Use implementation workers when that workflow requires them, but never reuse the recommendation worker.
6. Before Git edits, match immutable root, common directory, and baseline `HEAD`, then match current state to the bound checkpoint. The initial checkpoint is clean; a refreshed recommendation can bind intentionally dirty approved work. Run every operation in that worktree and within frozen scope. For managed targets, bind original revision/ETag and current approved state and use the appropriate revision for conditional writes.
7. Refresh the checkpoint after authorized in-scope changes. A pre-action mismatch, base drift, out-of-scope change, new evidence about this invariant, or retargeting invalidates approval and requires a fresh recommendation. A distinct invariant queues without changing the approved work.
8. Implementation workers that find qualifying evidence must stop affected mutation and report to the source coordinator, not launch nested hardening.

Finish this step with the approved repair implemented and verified, or a precise permission, state, or product blocker.

## 5. Report and settle

In the source conversation, report original behavior and root cause; approved option, owner, and prevention layer; changed files, checks, skills, or rules; before-and-after proof; remaining authority requests or recurrence risks; and the recommendation brief or worker link.

Record `completed`, `declined`, `failed`, or `abandoned`. Do not release the slot until the recommendation is resolved and implementation workers are settled. Then offer the next queued invariant. State the verified result or the reason no implementation occurred.
