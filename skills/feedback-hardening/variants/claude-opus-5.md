---
name: feedback-hardening
description: "Prevent recurrence when user corrections or self-detected mistakes expose reusable agent failures; excludes ordinary debugging and one-off preferences."
---

# Feedback hardening

Produce one approved, evidence-backed systemic repair for one reusable agent failure. The source conversation owns coordination and approval. Keep recommendations read-only and implementation inside a frozen target and scope.

## 1. Define the failure and state

Qualify evidence from a user correction or self-detected action against a reusable invariant across tasks, sessions, repositories, or users. Treat typos, expected review findings, ordinary debugging, changed objectives, factual clarification, vague criticism, and one-deliverable preferences as task-local unless they expose such an invariant.

The source coordinator must start the recommendation workflow for qualifying evidence or report its concrete blocker before closing the task. Reading this skill or finishing the local repair alone is insufficient; no explicit skill invocation is needed. Follow the active-workflow, queue, and worker-role rules below rather than adding duplicate or nested workflows. Keep authorized task-local work moving while arranging the recommendation.

Acknowledge the feedback briefly; repair the immediate result under existing task authority only. Capture redacted observed behavior, desired invariant, concrete evidence, affected surface, current task state/permissions, and likely Git or host-managed target.

The first recommendation requires a clean Git target. Freeze canonical worktree root, absolute `--git-common-dir`, `HEAD`, and evidence of clean index, tracked tree, and untracked scope. A dirty initial target is a visible blocker. Never overwrite that baseline with implementation progress.

Track approved work in a separate checkpoint containing phase, evidence/recommendation IDs, approval, selected option, frozen scope, current `HEAD`, exact status, reproducible state checksum with command and hash algorithm, validation, and next action. Managed surfaces likewise distinguish original revision/ETag from current approved state.

Keep one active workflow per source conversation. Refresh it for same-invariant evidence; queue distinct direct or relayed invariants. This phase ends with an observable invariant and an immediate task safe to continue.

## 2. Run the bounded recommendation phase

Spawn exactly one cold native worker, without conversation history: Codex `spawn_agent` with `fork_turns: "none"`, OpenClaw isolated no-transcript-fork context, or the current harness's equivalent. Do not add a verifier team or reuse this worker for implementation.

Its compact redacted brief contains:

- opaque workflow ID, evidence version, failure, invariant, evidence, and coordinator-owned constraints;
- immutable baseline and current checkpoint or explicit absence;
- `role: feedback-hardening-recommendation`, `authority: recommendation-only`, no coordinator approvals;
- instruction to load `$feedback-hardening` and start at step 3;
- closed result envelope requirements: workflow ID, evidence version, target identity, reproducible state checksum, outcome, no-mutation attestation. Require recommendation ID/options for `recommended`, proposed target/evidence for `retargeted`, and an actionable blocker for `blocked`.

Use harness-enforced read-only operation when available. Otherwise explicitly identify the instruction-only restriction and prohibit file edits, PR creation/updates, external posts, and delegated implementation. The worker never receives approval or mutation authority.

Keep its child handle. Do independent task work, then use an event-driven wait. Accept a recommendation only from the retained handle's host-authenticated terminal `Completed` event. Check all required fields against the brief and require a true no-mutation attestation. Fail closed on missing or mismatched data; interim messages do not count. Surface authenticated terminal failure even without a model-authored envelope.

After timeout, inspect only this handle and recover its authenticated terminal result or report the exact worker/delivery blocker. Abandonment or unrecoverable delivery requires supported terminalization and authenticated settled status before slot release. Codex V2 interruption is not terminalization. Without a terminal event, keep the slot and report an unreleasable blocker. Do not search unrelated sessions.

### Handoff boundary

Settle the recommendation worker before full-session transfer. Handles remain coordinator-local unless the harness proves otherwise. Handoff does not transfer unresolved workers or release their slots.

Refresh the checkpoint after authorized work. Carry workflow/evidence IDs, immutable baseline, authenticated recommendation, and current checkpoint or explicit absence in the handoff's current state, evidence, blockers, suggested skills, and next concrete actions. Suggest `feedback-hardening`.

The successor revalidates baseline and compares current state to the checkpoint before choosing its next action. Exact match proves state integrity only; it does not infer approval, replace judgment, or expand authority. Expected dirty work within frozen scope is valid. Base drift, checkpoint mismatch, out-of-scope changes, or new evidence requires a fresh recommendation under step 4. Keep source ownership until a harness-delivered successor acknowledgement verifies adoption; otherwise report the transfer blocker and retain the active workflow.

## 3. Compare prevention options

The recommendation worker reconstructs the failure and locates its producer or lifecycle owner. Discover credible options before ranking them; use this preference order:

1. Eliminate the invalid choice through architecture, data structures, types, schemas, APIs, ownership, or lifecycle design.
2. Enforce the invariant with a focused test, lint rule, type/schema check, CI gate, or deterministic verifier.
3. Capture necessary judgment in the narrowest existing skill or scoped agent instruction.
4. Use human review only when stronger enforcement is unsuitable.

Lead with one recommendation. For every credible option state mechanism, owner, affected surfaces, recurrence prevented, proof plan, scope, material risks, and why stronger layers do not fit. Reuse existing abstractions and skills. Avoid hardcoding only the user's wording or the specific example. Keep the brief and any saved artifact concise without omitting these decision fields.

If evidence or target changes, return `retargeted`; the coordinator updates evidence version and target state and obtains a fresh recommendation. Do not recommend against stale context. If an existing skill contributed, report it without edits or nested delegation. After termination, the coordinator applies harness-owned skill-repair policy and `writing-for-agents`. Higher-priority policy takes precedence; disclose immediate repairs and leave additional systemic changes pending approval.

Return the required closed envelope, bound to final evidence version and state.

## 4. Approve and execute the exact scope

Validate the envelope and exact current target state. Refresh the recommendation on mismatch. Present ranked options and freeze recommendation ID, selected option, evidence version, final target identity/state, and complete mutation scope/mechanism before requesting explicit approval of a named option.

Approval covers reversible changes to the frozen target only. It does not transfer to later evidence or bypass separate gates for public writes, publication, merges, deployment, destructive actions, protected schema/protocol changes, spending, or access expansion. If declined, record `declined`, skip implementation, settle the worker, release the slot, and offer the next queued invariant.

Implement through the target's normal workflow. Use its required implementation workers, never the retired recommendation worker. Before Git edits, match immutable root, common directory, and baseline `HEAD`, then current state against the bound checkpoint. Initial state is clean; a refreshed recommendation may bind intentionally dirty approved work. Root operations in the designated worktree, stay inside frozen scope, and refresh the checkpoint after authorized changes. For managed targets, bind original revision/ETag plus current approved state and use the appropriate revision as the conditional-write precondition.

Pre-action mismatch, base drift, out-of-scope changes, new same-invariant evidence, or retargeting invalidates approval and requires a fresh recommendation. Authorized in-scope changes update the checkpoint without another recommendation. Distinct invariants queue separately. Implementation workers discovering qualifying evidence stop affected mutation and report to the source coordinator; they do not start nested hardening workflows.

Verify the approved repair as part of execution. Finish with the repair proved or the exact permission, state, or product blocker; do not add an unrelated closing review pass.

## 5. Close and release

In the source conversation, give the original behavior/root cause, approved option and owner/prevention layer, changed files/checks/skills/rules, before-and-after evidence, remaining authority requests or recurrence risks, and the recommendation brief or worker link.

Record `completed`, `declined`, `failed`, or `abandoned`. Release the slot only after the recommendation result is resolved and every implementation worker is settled. Offer the next queued invariant. Report meaningful results or blockers, not unchanged worker progress.
