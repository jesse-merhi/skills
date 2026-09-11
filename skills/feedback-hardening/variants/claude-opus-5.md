---
name: feedback-hardening
description: 'Turn a reusable agent failure into an independently recommended repair within the user’s authorized scope.'
---

# Feedback hardening

Use this for an evidenced agent failure that can recur across tasks—not ordinary debugging, typos, changed goals, or one-off preferences. Keep authorized task-local repair moving; this workflow grants no additional permissions.

For qualifying failures, the source coordinator must start the recommendation workflow or explain the blocker before closing, even when the immediate mistake is fixed.

## Establish the target

Record redacted evidence, the violated invariant, task state, permissions, and likely owning layer. Before the first recommendation, require a clean Git target and freeze its canonical root, absolute Git common directory, HEAD, and clean status. For managed targets, capture the revision or ETag.

Keep that original baseline separate from the current checkpoint. Track target state/checksum and how to reproduce it, evidence version, recommendation, chosen repair, authorizing user instruction, scope, validation, and next action. One source conversation coordinates one active workflow; queue distinct failures.

## Get an independent recommendation

Send exactly one fresh, no-history worker the evidence, invariant, target baseline/checkpoint, constraints, and workflow/evidence IDs. Its role is recommendation-only: no edits, publication, implementation delegation, or inherited approval. Prefer enforced read-only execution; disclose when this boundary is instruction-only. Never reuse it as an implementer.

The worker finds the owning cause and ranks credible repairs:
1. Remove the invalid choice through architecture, types, APIs, or lifecycle.
2. Enforce the invariant with an existing check or focused test.
3. Put necessary judgment in the narrowest instruction.
4. Rely on human review only when stronger options do not fit.

Return one lead recommendation, alternatives, scope, risks, and proof plan. Bind the result to workflow/evidence IDs, target identity/checksum, recommendation ID, and a no-mutation attestation. Outcomes are recommended, retargeted with evidence, or blocked with a concrete reason. The worker reports contributing skills without editing them or delegating again.

Accept only the retained worker handle's authenticated terminal result, matching those fields. Interim messages are not recommendations. Wait on that handle; on failure report the actual blocker. Do not release the slot until the worker is terminal—interruption alone may not settle it.

## Check scope and implement

Explain the recommended change and why it prevents the failure in plain English. Compare it with what the user has already asked you to fix and record the instruction that authorizes the work. If the repair fits that request and its permission boundaries, carry it through implementation and validation without asking again. The user does not need to select a named option or repeat permission in workflow-specific words.

Ask only when the repair needs additional authority or a material user decision. State what would change, why it is needed, and exactly what decision remains. Feedback alone or a request to investigate does not authorize broader changes. A request to fix a recurring failure can authorize its durable repair; use the requested outcome and scope to decide.

Immediately before editing, recheck the target against the recorded checkpoint and preserve concurrent work. For a managed write, use the authorized revision or ETag as its write precondition; if unsupported, stop rather than overwrite concurrent changes.

Use the target's normal implementation workflow. Keep the recommendation worker retired. In-scope changes advance the checkpoint. If new evidence or target changes invalidate the recommendation, get a fresh recommendation; this does not by itself cancel existing permission. Check the revised repair against the same scope rule. Implementation workers report new failures to the coordinator rather than launching nested hardening workflows.

Local repair authority does not grant publication, merge, deployment, installation, destructive actions, spending, protected-schema changes, access expansion, or messages to others. Obtain any separately required permission before those actions. A decline ends the declined work.

## Finish or hand off

Verify the repair and report the cause, chosen prevention layer, changed artifacts, before/after evidence, and remaining limits. Record completed, declined, failed, or abandoned; settle all workers before releasing the slot.

Before handoff, settle the recommendation worker and carry the baseline, authenticated recommendation, authorizing user instruction, current checkpoint, and next action. Include later user instructions that supersede an unanswered approval question; do not claim the old option was approved. The successor verifies the target and continues within that existing authority. Expected in-scope dirty work is valid; material changes that invalidate the recommendation need fresh advice under the scope rule above. Keep ownership until the successor acknowledges adoption.
