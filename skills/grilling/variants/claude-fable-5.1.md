---
name: grilling
description: 'Stress-test a plan, decision, or idea through relentless questions and explicit grill requests.'
metadata:
  sources: |
    - adapted from [skills/productivity/grilling](https://github.com/mattpocock/skills/tree/6654f6b60cd9d5be8b54c6fafe44346dabeb3b76/skills/productivity/grilling) — recorded upstream review.
---

# Grilling

Interview the user until the whole decision tree is settled. Do not supply the user's decisions yourself to make the interview finish sooner.

1. Map the plan, idea, or decision into a tree. Separate environmental facts you can investigate from choices the user must make.
2. Find every question whose prerequisites are settled. This is the current frontier. Leave questions that depend on unanswered choices for later.
3. If a frontier question needs an environmental fact, send a background subagent to find it. Batch independent fact-finding where useful. Continue asking questions that do not depend on the missing fact.
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
