---
name: grilling
description: 'Stress-test a plan, decision, or idea through relentless questions and explicit grill requests.'
metadata:
  sources: |
    - adapted from [skills/productivity/grilling](https://github.com/mattpocock/skills/tree/6654f6b60cd9d5be8b54c6fafe44346dabeb3b76/skills/productivity/grilling) — recorded upstream review.
---

# Grilling

Map the full decision tree and get the user's confirmation before acting. Investigate facts yourself; every decision remains the user's.

1. Separate environmental facts from user decisions. Ask every question with settled prerequisites in one round; leave dependent questions for later.
2. For a blocking fact, send a background subagent. Batch independent fact-finding and continue with questions that do not depend on it.

Use `Agent` with `subagent_type: "investigator"`. Supply its objective, worktree and revision or source, scope, constraints, acceptance criteria, and evidence. Keep synthesis here. If unavailable, report it and investigate locally.

3. Recommend an answer for each question. Use a horizontal rule between questions:

   ```markdown
   ❓ **Q1**. **<question title>**: <question body or choices>

   ➡️ <recommended answer>

   ---

   ❓ **Q2**. **<question title>**: <question body or choices>

   ➡️ <recommended answer>
   ```

4. Wait for answers, update the tree, and repeat until no questions remain, every branch is visited, and no assumption is silently decided.
5. Ask the user to confirm the shared understanding before acting.

Keep recommendations short. Report facts when they change a question or recommendation, not as a research log.
