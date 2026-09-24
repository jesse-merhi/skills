---
name: grilling
description: 'Stress-test a plan, decision, or idea through relentless questions and explicit grill requests.'
metadata:
  sources: |
    - adapted from [skills/productivity/grilling](https://github.com/mattpocock/skills/tree/6654f6b60cd9d5be8b54c6fafe44346dabeb3b76/skills/productivity/grilling) — recorded upstream review.
---

# Grilling

Map the full decision tree and get the user's confirmation before acting. Investigate facts yourself; every decision remains the user's. The deliverable is the shared understanding, not implementation.

Ask every question with settled prerequisites in one round, with a short recommendation for each. Leave dependent questions for later rounds.

```markdown
❓ **Q1**. **<question title>**: <question body or choices>

➡️ <recommended answer>

---

❓ **Q2**. **<question title>**: <question body or choices>

➡️ <recommended answer>
```

Wait for answers, update the tree, and repeat. For blocking environmental facts, send a bounded background subagent and continue with independent questions. Do not add verifier workers or silently decide a branch.

Use `Agent` with `subagent_type: "investigator"`. Supply its objective, worktree and revision or source, scope, constraints, acceptance criteria, and evidence. Keep synthesis here. If unavailable, report it and investigate locally.

When no questions remain, every branch is visited, and no assumption is silently decided, summarize the understanding and wait for user confirmation.
