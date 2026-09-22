---
name: feedback-hardening
description: 'Immediately hand off feedback from tasks and reviews to a fresh session to solve.'
---

# Feedback hardening

Immediately use [handoff](../handoff/SKILL.md) to open a fresh full session for the feedback follow-up. Leave diagnosis, recommendations and repairs to that session.

In the new session's launch prompt, @mention the original session and say `solve`:

```text
@<original session> solve
```

Use the actual session mention when supported; otherwise include its verified link or ID. This is a reference in the new session's prompt, not a message sent back to the original session.

Set the handoff objective to solving the workflow problems and corrections evidenced in the original session. Include observations already available. The new session reads that context, makes and verifies authorized improvements, and reports directly to the user. Existing permissions carry over without granting broader repair, installation or publication authority. If no useful change is supported, report that and finish.

Once the launch is confirmed, the original session resumes or closes its existing task without waiting for the feedback work. Hand off once per source task; the receiving session finishes this follow-up without invoking feedback-hardening again. Findings-only workers include observations in their existing report and leave the handoff to their coordinator.
