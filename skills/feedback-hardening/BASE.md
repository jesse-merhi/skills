---
name: feedback-hardening
description: 'Immediately move feedback into a separate task that runs independently of the original task.'
---

# Feedback hardening

Immediately use [handoff](../handoff/SKILL.md) to open a separate full session for feedback. The original task supplies context and launches it, but keeps its own work and delivery.

Use `detect-handoff-surface --relationship aside`. For repository changes, start from the owning repository's normal PR base in a separate branch and worktree; use a separate PR only when publication is authorized. Treat the original checkout, branch, and PR as read-only context, and state that boundary in the brief and launch prompt.

In the new session's launch prompt, @mention the original session and say `solve`:

```text
@<original session> solve
```

Use the actual mention if supported, otherwise its verified link or ID. Put it in the new prompt, not a message to the original session.

The brief should include observed workflow problems and corrections. The new task owns investigation, recommendations, repairs, verification, permission questions, and user reporting. Carry only existing applicable authority: handoff grants no new repair, installation, or publication permission. If evidence supports no useful change, report that there and finish.

In the original session, report only the new task's link or observed launch status, then continue or close. For a queued or failed launch, preserve the brief and report that status. Do not do, monitor, review, or integrate feedback work there; its outcome never gates original delivery.

Hand off once per source task. The receiving session does not invoke feedback-hardening again. Findings-only workers report observations; their coordinator launches the follow-up.
