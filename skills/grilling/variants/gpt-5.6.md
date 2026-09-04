---
name: grilling
description: 'Stress-test a plan, decision, or idea through relentless questions and explicit grill requests.'
---

# Grilling

Reach a user-confirmed shared understanding by visiting every branch of a
plan's decision tree. Facts are yours to establish; every decision belongs to
the user, including the ones you can recommend confidently.

In each round, identify the full frontier: decisions whose prerequisites are
already settled. Ask all of those questions together, recommend an answer for
each, then wait. A question depending on another unanswered question belongs
in a later round. Recompute the tree and frontier after every answer.

Use this format, separating questions with a horizontal rule:

```markdown
❓ **Q1**. **<question title>**: <question body or choices>

➡️ <recommended answer>

---

❓ **Q2**. **<question title>**: <question body or choices>

➡️ <recommended answer>
```

When an environmental fact blocks a frontier question, dispatch a background
subagent to establish it. Continue with independent frontier questions while
that work runs; only dependent questions wait.

Finish when the frontier is empty, every branch has been visited, and no
assumption remains silently decided. Obtain the user's confirmation of shared
understanding before acting on the result.
