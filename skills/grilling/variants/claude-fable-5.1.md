---
name: grilling
description: 'Stress-test a plan, decision, or idea through relentless questions and explicit grill requests.'
metadata:
  sources: |
    - adapted from [skills/productivity/grilling](https://github.com/mattpocock/skills/tree/6654f6b60cd9d5be8b54c6fafe44346dabeb3b76/skills/productivity/grilling) — recorded upstream review.
---

# Grilling

Interview the user until the decision tree is settled. Do not make the user's decisions just to finish sooner.

1. Map the plan, idea, or decision into a tree. Separate environmental facts you can investigate from choices the user must make.
2. Find every question whose prerequisites are settled. This is the current frontier. Leave questions that depend on unanswered choices for later.
3. If a frontier question needs an environmental fact, send a background subagent to find it. Batch independent fact-finding where useful. Continue asking questions that do not depend on the missing fact.

In Codex, select the configured `investigator` through the launcher's role field (`agent_type` on `spawn_agent`). Supply the factual objective, worktree and revision or source, bounded scope, constraints, acceptance criteria and relevant evidence; the role definition supplies reusable instructions, skills and model settings. Keep question sequencing and synthesis with the coordinator and decisions with the user. If that role is unavailable, report it and establish the fact locally.

In Claude Code, invoke the native `Agent` tool with `subagent_type: "investigator"` when the optional named definition is available. Put the same bounded factual assignment in `prompt`; the definition owns reusable role instructions. Use it only when independent fact-finding can unblock a frontier question. Keep question sequencing and synthesis with the coordinator and decisions with the user. If the definition is unavailable, report it and establish the fact locally.

Other harnesses, including OpenClaw, use their own supported launcher settings under `AGENTS.md`; do not assume their spawn API accepts Codex or Claude role names.
4. Ask the whole available frontier in one numbered round. Give a recommended answer for every question. Use a horizontal rule between questions:

   ```markdown
   ❓ **Q1**. **<question title>**: <question body or choices>

   ➡️ <recommended answer>

   ---

   ❓ **Q2**. **<question title>**: <question body or choices>

   ➡️ <recommended answer>
   ```

5. Wait for the user's answers. Apply them to the tree and recompute the frontier. Repeat until every branch has been visited and none remains open.
6. Ask the user to confirm the resulting shared understanding. Do not act on the plan before that confirmation.

Keep recommendations clear and short. Report fact-finding results when they change the questions or recommendations, not as a running research log.
