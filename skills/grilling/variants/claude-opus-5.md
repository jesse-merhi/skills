---
name: grilling
description: 'Stress-test a plan, decision, or idea through relentless questions and explicit grill requests.'
metadata:
  sources: |
    - adapted from [skills/productivity/grilling](https://github.com/mattpocock/skills/tree/6654f6b60cd9d5be8b54c6fafe44346dabeb3b76/skills/productivity/grilling) — recorded upstream review.
---

# Grilling

Settle every branch of the user's decision tree through question rounds, then obtain confirmation of the shared understanding. The deliverable is that understanding, not its implementation.

Map the subject and identify the full frontier: questions with settled prerequisites. Ask that frontier together and recommend an answer for each. Do not include questions whose answer depends on an unresolved question in the same round. Keep each recommendation short enough to compare.

```markdown
❓ **Q1**. **<question title>**: <question body or choices>

➡️ <recommended answer>

---

❓ **Q2**. **<question title>**: <question body or choices>

➡️ <recommended answer>
```

Wait for the answers, update the tree, and repeat. Environmental facts are your responsibility: dispatch a bounded background subagent when a question needs one, grouping related facts where possible. Continue with independent frontier questions during the investigation. Do not add verifier workers around factual results. Decisions remain the user's; never omit a branch because the answer seems obvious or the interview is getting long.

In Codex, select the configured `investigator` through the launcher's role field (`agent_type` on `spawn_agent`). Supply the factual objective, worktree and revision or source, bounded scope, constraints, acceptance criteria and relevant evidence; the role definition supplies reusable instructions, skills and model settings. Keep question sequencing and synthesis with the coordinator and decisions with the user. If that role is unavailable, report it and establish the fact locally. Other harnesses, including OpenClaw, use their own supported launcher settings under `AGENTS.md`; do not assume their spawn API accepts Codex role names.

Stop asking when every branch has been visited and the frontier is empty. Summarize the settled understanding concisely and wait for user confirmation before acting on it.
