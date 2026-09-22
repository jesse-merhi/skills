---
name: feedback-hardening
description: 'Immediately move feedback into a separate task that runs independently of the original task.'
---

# Feedback hardening

Immediately use [handoff](../handoff/SKILL.md) to open a separate full session dedicated to feedback. The original task keeps its own work and delivery; it only supplies context and launches the feedback task.

Use `detect-handoff-surface --relationship aside` for this separate objective. For repository changes, start from the owning repository's normal PR base in a separate branch and worktree, with a separate PR when publication is authorized. Treat the original checkout, branch and PR as read-only context; keep its unfinished work and delivery plan with the original task. Carry this separation into the brief and launch prompt.

In the new session's launch prompt, @mention the original session and say `solve`:

```text
@<original session> solve
```

Use the actual session mention when supported; otherwise include its verified link or ID. This is a reference in the new session's prompt, not a message sent back to the original session.

Set the handoff objective to solving the workflow problems and corrections evidenced in the original session. Include observations already available. The feedback task owns investigation, recommendations, repairs, verification, permission questions and reporting to the user in its own session. Carry only existing authority applicable to that feedback; the handoff grants no broader repair, installation or publication permission. If no useful change is supported, report that there and finish.

In the original session, report only the new task's link or observed launch status, then continue or close the original work. A queued or failed launch stays reported as such; preserve the brief without delaying the main task or doing the feedback work there. Do not monitor, review or integrate feedback work from the original task. Feedback findings, questions, failures and completion never gate its delivery.

Hand off once per source task; the receiving session finishes this follow-up without invoking feedback-hardening again. Findings-only workers include observations in their existing report and leave the launch to their coordinator.
