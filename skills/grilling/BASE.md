---
name: grilling
description: 'Stress-test a plan, decision, or idea through relentless questions and explicit grill requests.'
metadata:
  sources: |
    - adapted from [skills/productivity/grilling](https://github.com/mattpocock/skills/tree/6654f6b60cd9d5be8b54c6fafe44346dabeb3b76/skills/productivity/grilling) — recorded upstream review.
---

# Grilling

Map the full decision tree and get the user's confirmation before acting. Investigate facts yourself; every decision remains the user's.

In each round, ask the full frontier—all questions whose prerequisites are settled—with a recommendation for each, then wait. Leave dependent questions for later rounds. Update the tree after each answer.

Use this format, separating questions with a horizontal rule:

```markdown
❓ **Q1**. **<question title>**: <question body or choices>

➡️ <recommended answer>

---

❓ **Q2**. **<question title>**: <question body or choices>

➡️ <recommended answer>
```

If an environmental fact blocks a question, send a background subagent to establish it while asking independent questions.

Use the configured investigator. Supply its objective, worktree and revision or source, scope, constraints, acceptance criteria, and evidence. Keep question sequencing and synthesis here; the user owns decisions. If unavailable, report it and investigate locally.

Finish questioning only when the frontier is empty, every branch is visited, and no assumption is silently decided. Ask the user to confirm the shared understanding before acting.
