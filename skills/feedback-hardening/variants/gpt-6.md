---
name: feedback-hardening
description: 'Decide whether observed workflow problems warrant a separate feedback task, then hand off useful work.'
---

# Feedback hardening

Hand off an unresolved workflow problem only when separate investigation or repair offers a concrete objective and expected benefit. A review, correction or failed check alone is insufficient. Continue here when following existing guidance resolves the problem or this task owns the repair. Investigation need not start with a confirmed fix.

When warranted, use [handoff](../handoff/SKILL.md) to launch a separate full session with available evidence, without investigating first. In the original task's launch update, name the behavior or workflow issue and say the original work stays there. Title the new task as a feedback follow-up naming that behavior. For unsupported restart advice, examine the diagnostic method; leave the missing-model investigation in the original task.

Use `detect-handoff-surface --relationship aside`. For repository changes, start from the owning repository's normal PR base in a separate branch and worktree; use a separate PR only when publication is authorized. Treat the original checkout, branch and PR as read-only context. State this separation in the brief and launch prompt.

Write a self-contained launch prompt with the trigger, feedback objective, available observations, uncertainty and original objective retained elsewhere. Do not invent a fault or let `solve` imply the original objective. Reference the original session with its actual @mention when supported, otherwise its verified link or ID. Include an explicit instruction in every launch prompt for the receiving task to explain in its first user-facing reply why it exists and which work stays in the original task, including queued launches and uncertain fixes.

The receiving task owns investigation, recommendations, authorized repairs, verification, permission questions and reporting. Keep its work focused on the observed feedback; do not take over or duplicate the original investigation. Carry only existing applicable authority: handoff grants no new repair, installation or publication permission. Finish supported repairs and verification without asking again for granted permission. When only a recommendation is authorized, identify a concrete proposed change. If no useful change is supported, say so and finish.

Report directly in chat unless a saved report is requested or materially useful. Distinguish changes, recommendations and remaining decisions in the final response; reviewing the workflow does not resolve the original task.

After launch, the original task reports the descriptive link or observed launch status, then continues or closes. For a queued or failed launch, preserve the brief and report that status. Do not do, monitor, review or integrate feedback work there; its outcome never gates original delivery.

Hand off once per source task. The receiving session does not invoke feedback-hardening again. Findings-only workers report observations; their coordinator launches the follow-up.
