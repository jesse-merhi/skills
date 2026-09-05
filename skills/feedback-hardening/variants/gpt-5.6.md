---
name: feedback-hardening
description: "Prevent recurrence when user corrections or self-detected mistakes expose reusable agent failures; excludes ordinary debugging and one-off preferences."
---

# Feedback hardening

Turn one evidenced, reusable agent failure into an approved systemic repair. Keep the immediate task moving within its existing authority; the prevention workflow does not grant extra permissions.

## 1. Capture a reusable invariant

Start when a user correction or self-detected mistake shows an agent action violating an invariant that matters across tasks, sessions, repositories, or users. Handle typos, expected review findings, ordinary debugging, changed objectives, factual clarifications, vague criticism, and one-deliverable preferences locally unless they reveal that invariant.

For qualifying evidence, the source coordinator must start the recommendation workflow or report its concrete blocker before closing the task. Reading this skill or completing the local repair alone is insufficient; do not wait for the user to name the skill. Follow the active-workflow, queue, and worker-role rules below to avoid duplicate or nested workflows. Continue authorized task-local work while arranging the recommendation.

Acknowledge the correction briefly. Repair the immediate result only when already authorized. Record redacted evidence: observed behavior, desired invariant, affected surface, current task state and permissions, and the likely Git or host-managed target.

Before the first recommendation, require a clean Git target. Freeze its canonical worktree root, absolute `--git-common-dir`, `HEAD`, and evidence that index, tracked tree, and untracked scope are clean. A dirty initial target blocks the recommendation. Preserve this immutable baseline throughout the workflow.

Once approved work begins, track its current checkpoint separately: phase, evidence/recommendation IDs, approval, selected option, frozen scope, current `HEAD`, exact status, reproducible state checksum with its command and hash algorithm, validation, and next action. For managed targets, distinguish the original revision or ETag from the current approved state.

Maintain one active hardening workflow per source conversation. Refresh it for new evidence about the same invariant; queue distinct direct or relayed invariants. Proceed when the failure is an observable invariant and the immediate task is safe to continue.

## 2. Obtain one independent recommendation

The source conversation coordinates. Spawn exactly one cold native worker with no transcript history: Codex `spawn_agent` with `fork_turns: "none"`, isolated no-fork context in OpenClaw, or the current harness's equivalent. Give it this compact redacted brief:

- opaque workflow ID and evidence version;
- failure, invariant, evidence, and coordinator-owned constraints;
- immutable target baseline and current implementation checkpoint, or explicit absence;
- `role: feedback-hardening-recommendation` and `authority: recommendation-only`, without coordinator approvals;
- load `$feedback-hardening` and start at step 3;
- return a closed envelope containing workflow ID, evidence version, target identity, reproducible state checksum, outcome, and a no-mutation attestation. `recommended` also needs a recommendation ID and options; `retargeted` needs the proposed target and evidence; `blocked` needs an actionable blocker.

Use a harness-enforced read-only profile when available. Otherwise disclose the instruction-only boundary and prohibit edits, PR creation or updates, external posts, and delegated implementation. This worker never receives approval or mutation authority and is never reused as an implementer.

Retain its child handle. Do useful independent task work, then use the native event wait. Accept only that handle's host-authenticated terminal `Completed` result, never an interim message. Match every required envelope field and require a true no-mutation attestation; fail closed on mismatch. Surface authenticated terminal failures even without a model-authored envelope.

On timeout, inspect only the retained handle and recover its authenticated terminal result if available. Otherwise report the precise worker or delivery blocker. Abandonment or unrecoverable delivery requires harness-supported terminalization and authenticated settled status before releasing the slot. Codex V2 interruption does not terminalize a worker. Without a terminal event, retain the slot and report an unreleasable blocker. Do not search unrelated sessions.

### Transfer coordinator ownership

Settle the recommendation worker before handing off to another full session. Handles are coordinator-local unless the harness proves otherwise; a handoff cannot transfer unresolved work or release its slot.

Put workflow/evidence IDs, immutable baseline, authenticated recommendation, and current checkpoint or its absence in the handoff's current state, evidence, blockers, suggested skills, and next concrete actions. Suggest `feedback-hardening`. Refresh the checkpoint after authorized changes before each handoff.

The successor revalidates baseline and current checkpoint and applies its own judgment to the next action. A match proves intact state, not approval or broader authority. Expected dirty changes inside the frozen scope remain valid; base drift, mismatched state, out-of-scope changes, or new evidence require a fresh recommendation under step 4. The source owns the workflow until a harness-delivered successor acknowledgement verifies adoption. If none arrives, report the transfer blocker and retain ownership.

## 3. Recommend at the owning layer

As the recommendation-only worker, reconstruct the failure and find the producer or lifecycle owner. Rank credible options in this order:

1. Remove the invalid choice through architecture, data structures, types, schemas, APIs, ownership, or lifecycle design.
2. Enforce the invariant with a focused test, lint rule, type/schema check, CI gate, or deterministic verifier.
3. Put irreducible judgment in the narrowest existing skill or scoped instruction.
4. Use human review only when stronger layers are unsuitable.

Lead with one recommendation. For each credible option, explain mechanism, owner, affected surfaces, prevented recurrence, proof plan, implementation scope, material risks, and why stronger layers do not fit. Reuse existing mechanisms; do not encode only the user's wording or one reported example.

A different target or changed evidence requires `retargeted`, not a recommendation against stale state. The coordinator updates the evidence version and target state and requests a fresh recommendation. If an existing skill contributed, report it without edits or nested delegation. After the worker terminates, the coordinator applies the harness's skill-repair policy and `writing-for-agents`. Higher-priority harness policy wins; disclose any immediate repair and leave additional systemic changes pending approval.

Return the ranked brief in the required closed envelope, bound to the final evidence version and target state.

## 4. Approve a bound option and implement

Validate the envelope and exact current target state; any mismatch requires a fresh recommendation. Present the ranked options. Freeze the recommendation ID, selected option, evidence version, final target identity/state, and full mutation scope/mechanism before asking for explicit approval of a named option.

Approval covers reversible changes to that frozen target only. It does not survive later evidence or bypass separate authority for public writes, publication, merges, deployment, destructive actions, protected schema/protocol changes, spending, or access expansion. A decline skips implementation: record `declined`, settle the worker, release the slot, and offer the next queued invariant.

After approval, use the target's normal implementation workflow. Required implementation workers are allowed; the recommendation worker remains retired. For Git, verify immutable root, common directory, and baseline `HEAD`, then compare current state exactly with the bound checkpoint before editing. The initial checkpoint is clean; a refreshed recommendation may bind intentionally dirty approved work. Root every operation in the designated worktree, stay inside frozen scope, and update the checkpoint after authorized changes. For managed targets, bind original revision/ETag and current approved state and use the appropriate revision as a conditional-write precondition.

Pre-action mismatch, base drift, out-of-scope change, same-invariant new evidence, or retargeting invalidates approval: obtain a fresh recommendation. In-scope authorized changes only update the checkpoint. Distinct invariants queue separately. Implementation workers encountering qualifying evidence stop affected mutation and report to the source coordinator; they do not start nested hardening workflows.

Continue until the approved repair is verified or the exact permission, state, or product blocker is known.

## 5. Close in the source conversation

Report the original behavior and root cause, approved option and owner/prevention layer, changed files/checks/skills/rules, before-and-after proof, remaining authority or recurrence risks, and the recommendation brief or worker link.

Record `completed`, `declined`, `failed`, or `abandoned`. Release the active slot only after the recommendation is resolved and all implementation workers are settled. Offer the next queued invariant. The user should be able to verify the repair or understand the terminal non-implementation result.
