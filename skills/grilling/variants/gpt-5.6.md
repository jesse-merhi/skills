---
name: grilling
description: 'Stress-test a plan, decision, or idea through relentless questions and explicit grill requests.'
metadata:
  sources: |
    - adapted from [skills/productivity/grilling](https://github.com/mattpocock/skills/tree/6654f6b60cd9d5be8b54c6fafe44346dabeb3b76/skills/productivity/grilling) — recorded upstream review.
---

# Grilling

Reach a user-confirmed shared understanding by visiting every branch of the plan's decision tree. Establish facts yourself; the user makes every decision, even when you have a confident recommendation.

In each round, identify the full frontier: decisions whose prerequisites are already settled. Ask all of those questions together, recommend an answer for each, then wait. A question depending on another unanswered question belongs in a later round. Recompute the tree and frontier after every answer.

Use this format, separating questions with a horizontal rule:

```markdown
❓ **Q1**. **<question title>**: <question body or choices>

➡️ <recommended answer>

---

❓ **Q2**. **<question title>**: <question body or choices>

➡️ <recommended answer>
```

When an environmental fact blocks a frontier question, dispatch a background subagent to establish it. Continue with independent frontier questions while that work runs; only dependent questions wait.

In Codex, select the configured `investigator` through the launcher's role field (`agent_type` on `spawn_agent`). Supply the factual objective, worktree and revision or source, bounded scope, constraints, acceptance criteria and relevant evidence; the role definition supplies reusable instructions, skills and model settings. Keep question sequencing and synthesis with the coordinator and decisions with the user. If that role is unavailable, report it and establish the fact locally.

In Claude Code, invoke the native `Agent` tool with `subagent_type: "investigator"` when the optional named definition is available. Put the same bounded factual assignment in `prompt`; the definition owns reusable role instructions. Use it only when independent fact-finding can unblock a frontier question. Keep question sequencing and synthesis with the coordinator and decisions with the user. If the definition is unavailable, report it and establish the fact locally.

Other harnesses, including OpenClaw, use their own supported launcher settings under `AGENTS.md`; do not assume their spawn API accepts Codex or Claude role names.

Finish when the frontier is empty, every branch has been visited, and no assumption remains silently decided. Obtain the user's confirmation of shared understanding before acting on the result.
