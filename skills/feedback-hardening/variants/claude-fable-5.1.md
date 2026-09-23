---
name: feedback-hardening
description: 'Decide whether observed workflow problems warrant a separate feedback task, then hand off useful work.'
---

# Feedback hardening

Assess the observations already available before creating a task. Hand off when they identify an unresolved workflow problem worth separate investigation or repair, with a concrete objective and expected benefit. A completed review, user correction or failed check does not by itself justify another task. If existing guidance already covers the issue and following it resolves the problem, or the current task already owns the repair, continue without a feedback handoff. A useful investigation need not have a confirmed fix before it starts.

When a handoff is warranted, use [handoff](../handoff/SKILL.md) to open a separate full session dedicated to that objective. The original task keeps its own work and delivery; it supplies the existing evidence and launches the feedback task without doing that investigation first.

Explain the follow-up in the original task's launch update: name the agent behavior or workflow issue being examined and say that the original work remains there. Give the new task a descriptive title identifying it as a feedback follow-up and naming that behavior. For a warranted follow-up about unsupported restart advice, review the diagnostic method; leave the missing-model investigation in the original task.

Use `detect-handoff-surface --relationship aside` for this separate objective. For repository changes, start from the owning repository's normal PR base in a separate branch and worktree, with a separate PR when publication is authorized. Treat the original checkout, branch and PR as read-only context; keep its unfinished work and delivery plan with the original task. Carry this separation into the brief and launch prompt.

Write a self-contained launch prompt explaining what triggered the follow-up, the agent behavior or workflow to improve, and the original objective retained elsewhere. Describe uncertainty about the workflow issue or proposed fix without inventing a fault. Reference the original session with its actual @mention when supported, otherwise its verified link or ID. The reference supplies context; the prompt must identify the feedback objective rather than leave `solve` to imply the original task's objective.

End every launch prompt with an instruction to explain, in the receiving task's first user-facing reply, why this feedback task exists and which work stays in the original task. Include this instruction even when the launch is queued or the proposed fix is still uncertain.

Include observations already available and the user's applicable authorization. The feedback task owns investigation, recommendations, authorized repairs, verification, permission questions and reporting to the user in its own session. The handoff grants no broader repair, installation or publication permission. Finish the supported repair and verification within existing authority. When only a recommendation is authorized, identify a concrete proposed change. Keep the investigation and changes focused on the observed feedback. If no useful change is supported, say so briefly and finish.

The receiving task investigates the workflow using the supplied evidence and any needed context; it does not take over or duplicate the original investigation. Report directly in chat unless a saved report is requested or materially useful. In the final response, distinguish what was changed, what was recommended, and any remaining decision; do not imply that reviewing the workflow resolved the original task.

After launch, report the new task's descriptive link or observed launch status in the original session, then continue or close the original work. A queued or failed launch stays reported as such; preserve the brief without delaying the main task or doing the feedback work there. Do not monitor, review or integrate feedback work from the original task. Feedback findings, questions, failures and completion never gate its delivery.

Hand off once per source task; the receiving session finishes this follow-up without invoking feedback-hardening again. Findings-only workers include observations in their existing report and leave the launch to their coordinator.
