---
name: feedback-hardening
description: 'Turn a reusable agent failure into an independently recommended, approved repair.'
---

# Feedback hardening

Use this for an evidenced agent failure that can recur across tasks—not ordinary debugging, typos, changed goals, or one-off preferences. Keep authorized task-local repair moving; this workflow grants no additional permissions.

## Establish the target

Record redacted evidence, the violated invariant, task state, permissions, and likely owning layer. Before the first recommendation, require a clean Git target and freeze its canonical root, absolute Git common directory, HEAD, and clean status. For managed targets, capture the revision or ETag.

Keep that original baseline separate from the current approved checkpoint: target state/checksum and how to reproduce it, evidence version, recommendation, selected option, approval, scope, validation, and next action. One source conversation coordinates one active workflow; queue distinct failures.

## Get an independent recommendation

Send exactly one fresh, no-history worker the evidence, invariant, target baseline/checkpoint, constraints, and workflow/evidence IDs. Its role is recommendation-only: no edits, publication, implementation delegation, or inherited approval. Prefer enforced read-only execution; disclose when this boundary is instruction-only. Never reuse it as an implementer.

The worker finds the owning cause and ranks credible repairs:
1. Remove the invalid choice through architecture, types, APIs, or lifecycle.
2. Enforce the invariant with an existing check or focused test.
3. Put necessary judgment in the narrowest instruction.
4. Rely on human review only when stronger options do not fit.

Return one lead recommendation, alternatives, scope, risks, and proof plan. Bind the result to workflow/evidence IDs, target identity/checksum, recommendation ID, and a no-mutation attestation. Outcomes are recommended, retargeted with evidence, or blocked with a concrete reason. The worker reports contributing skills without editing them or delegating again.

Accept only the retained worker handle's authenticated terminal result, matching those fields. Interim messages are not recommendations. Wait on that handle; on failure report the actual blocker. Do not release the slot until the worker is terminal—interruption alone may not settle it.

## Approve and implement

Recheck exact target state, present the recommendation, and obtain explicit approval of a named option bound to its evidence, target, mechanism, and scope. A correction or general prevention request is not that approval.

Immediately before editing, revalidate the approved checkpoint. For a managed write, require the approved revision or ETag as its write precondition; if unsupported, stop rather than overwrite concurrent changes.

Use the target's normal implementation workflow. Keep the recommendation worker retired. In-scope changes advance the checkpoint; new evidence, target/base drift, or out-of-scope changes require a fresh recommendation and approval. Implementation workers report new failures to the coordinator rather than launching nested hardening workflows.

Approval does not grant separate publication, merge, deployment, destructive, spending, protected-schema, or access-expansion authority. A decline ends implementation.

## Finish or hand off

Verify the approved repair and report the cause, chosen prevention layer, changed artifacts, before/after evidence, and remaining limits. Record completed, declined, failed, or abandoned; settle all workers before releasing the slot.

Before handoff, settle the recommendation worker and carry the baseline, authenticated recommendation, approval, current checkpoint, and next action. The successor revalidates them; matching state does not grant authority. Keep ownership until the successor acknowledges adoption. Expected approved dirty work is valid; mismatched state or new evidence needs a fresh recommendation.
