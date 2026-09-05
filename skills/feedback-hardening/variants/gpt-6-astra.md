---
name: feedback-hardening
description: "Prevent recurrence when user corrections or self-detected mistakes expose reusable agent failures; excludes ordinary debugging and one-off preferences."
---

# Feedback hardening

Find the owning cause of a reusable agent mistake, obtain approval for a bound repair, and carry that repair through verification. Continue ordinary task work where existing authority permits it. Do not treat correction of the immediate result as approval for new systemic controls.

## 1. Establish the invariant and baseline

Start from evidence, whether a user correction or your own discovery: what agent action violated a rule that should hold across tasks, sessions, repositories, or users? Ordinary debugging, expected review findings, typos, changed objectives, factual clarifications, vague criticism, and preferences for a single deliverable do not qualify unless they expose that reusable invariant.

Once the evidence qualifies, the source coordinator proceeds to the recommendation workflow without waiting for the user to name this skill. Before closing the task, start that workflow or report its concrete blocker. Reading the skill or finishing the immediate repair alone does not fulfill this obligation. Use the active-workflow, queue, and worker-role rules below to avoid duplicate or nested workflows. Keep authorized task-local work moving while arranging the recommendation.

Acknowledge feedback briefly and make authorized task-local repairs. Capture a redacted statement of observed behavior, desired invariant, evidence, affected surface, task state, permissions, and likely Git or managed target.

Require a clean Git target before the first recommendation. Record immutable canonical worktree root, absolute `--git-common-dir`, baseline `HEAD`, and evidence of clean index, tracked tree, and untracked scope. Report a dirty initial target as a blocker rather than treating its changes as yours.

Keep approved implementation state distinct from that baseline. Its checkpoint contains phase, evidence/recommendation IDs, approval, selected option, frozen scope, current `HEAD`, exact status, a reproducible state checksum with command and hash algorithm, validation, and next action. Managed targets use the same separation between original revision or ETag and current approved state.

One source conversation owns one active workflow. New same-invariant evidence refreshes it; distinct direct or relayed invariants wait in a queue. Proceed once the invariant is observable and the immediate task can safely continue.

## 2. Commission an independent recommendation

Keep coordination in the source conversation. Use exactly one cold, no-history native worker: `spawn_agent` with `fork_turns: "none"` in Codex; isolated context without transcript fork in OpenClaw; the equivalent elsewhere. Its authority ends at recommendation.

The redacted brief must include opaque workflow ID, evidence version, failure/invariant/evidence, coordinator-owned constraints, immutable target baseline, and current checkpoint or explicit absence. Set `role: feedback-hardening-recommendation` and `authority: recommendation-only`; omit coordinator approvals. Tell the worker to load `$feedback-hardening`, begin at step 3, and return a closed envelope with:

- workflow ID, evidence version, target identity, reproducible state checksum;
- outcome and no-mutation attestation;
- recommendation ID and options for `recommended`, proposed target and evidence for `retargeted`, or actionable blocker for `blocked`.

Use enforced read-only execution where available; otherwise disclose that the restriction is instruction-only. Prohibit edits, PR creation/updates, external posting, and implementation delegation. Never give this worker approval or mutation authority or reuse it for implementation.

Retain the child handle. Complete useful independent work before event-waiting. Only its host-authenticated terminal `Completed` result can supply the recommendation. Match every envelope field and require a true no-mutation attestation; interim messages and malformed results do not qualify. An authenticated terminal failure still needs to be surfaced when there is no model-authored envelope.

On timeout, inspect only the retained handle. Recover an authenticated terminal result or report the exact delivery/worker blocker. For abandonment or unrecoverable delivery, require harness-supported terminalization followed by authenticated settled status before slot release. Codex V2 interruption is not terminalization. If no terminal event is available, keep the slot and report an unreleasable blocker. Do not search other sessions for substitutes.

### Carry state across a handoff

Settle the recommendation worker before moving to another full session; handles are coordinator-local unless the harness proves otherwise. Never transfer an unresolved worker or release its slot through handoff.

Refresh the current checkpoint after authorized work. Carry exact workflow/evidence IDs, immutable baseline, authenticated recommendation, and checkpoint or explicit absence in the handoff's current state, evidence, blockers, suggested skills, and next concrete actions. Include `feedback-hardening` among suggested skills.

The successor must revalidate baseline and current checkpoint and decide the next action within recorded authority. Matching state proves continuity only, not approval. Intentionally dirty changes within frozen scope remain valid. Base drift, checkpoint mismatch, out-of-scope change, or new evidence requires a fresh recommendation under step 4. The source retains ownership until a harness-delivered successor acknowledgement verifies adoption; unverified adoption leaves an active transfer blocker.

## 3. Resolve the cause at its owner

As the recommendation worker, reconstruct the failure and locate the producer or lifecycle owner. Consider credible prevention options from strongest to weakest:

1. Eliminate the invalid choice through architecture, data structures, types, schemas, APIs, ownership, or lifecycle.
2. Enforce the invariant through a focused test, lint rule, type/schema check, CI gate, or deterministic verifier.
3. Encode necessary judgment in the narrowest existing skill or scoped instruction.
4. Depend on human review only when stronger enforcement does not fit.

Choose one lead recommendation from the evidence. Describe each credible option's mechanism, owner, surfaces, prevented recurrence, proof, scope, material risks, and why stronger layers are unsuitable. Prefer existing mechanisms and address the invariant, not just the user's wording or one example.

If investigation changes the target or evidence, return `retargeted` instead of recommending against the old state. The coordinator updates evidence version and target state, then obtains a fresh recommendation. Report a contributing existing skill without repairing it or delegating further. Once the worker terminates, the coordinator applies harness-owned skill-repair policy and `writing-for-agents`; higher-priority policy wins. Disclose any immediate repair and keep additional systemic work pending approval.

Return the required closed envelope with the ranked brief bound to final evidence version and state.

## 4. Bind approval to the repair

Check the envelope against exact current state; mismatch means a fresh recommendation. Present ranked options and freeze recommendation ID, selected option, evidence version, final target identity/state, and complete mutation scope/mechanism. Wait for explicit approval of a named option.

That approval covers reversible changes on the frozen target. It does not extend to later evidence or bypass separate gates for public writes, publication, merges, deployment, destructive actions, protected schema/protocol changes, spending, or access expansion. If declined, record `declined`, omit implementation, settle the worker, release the slot, and offer the next queued invariant.

Implement approved work through the target's normal workflow, including required implementation workers. Keep the recommendation worker retired. Before Git mutations, match immutable root, common directory, and baseline `HEAD`, then match current state to the bound checkpoint. Initial state must be clean; refreshed recommendations may bind intentionally dirty approved implementation. Keep all operations in the designated worktree and frozen scope and refresh the checkpoint after changes. Managed surfaces bind original revision/ETag and current approved state, using the appropriate revision as a conditional-write precondition.

A pre-action mismatch, base drift, out-of-scope change, new same-invariant evidence, or retargeting invalidates approval and calls for a fresh recommendation. Authorized in-scope changes update only the checkpoint; distinct invariants queue separately. Implementation workers discovering qualifying evidence stop affected mutation and report to the source coordinator without starting nested workflows.

Carry the approved repair through verification. Stop for a concrete permission, state, or product blocker that cannot be resolved within the bound authority.

## 5. Close with evidence

Report in the source conversation: original behavior/root cause, approved option and owning prevention layer, changed files/checks/skills/rules, before-and-after proof, remaining authority needs or recurrence risks, and the recommendation brief or worker link.

Record `completed`, `declined`, `failed`, or `abandoned`. Release the slot only when the recommendation result is resolved and all implementation workers are settled, then offer the next queued invariant. Make the verified outcome or terminal non-implementation reason clear.
