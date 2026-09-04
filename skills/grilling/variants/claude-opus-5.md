---
name: grilling
description: 'Stress-test a plan, decision, or idea through relentless questions and explicit grill requests.'
---

# Grilling

Ask the whole settled frontier with concise recommendations. Group related environmental facts in one bounded background assignment where possible; do not add verifier workers or continue asking after the decision tree is settled.

Outcome: reach a user-confirmed shared understanding with every decision branch
visited and no material assumption left implicit. Map the subject as a design
tree.

Work the tree in rounds. The frontier is every decision whose prerequisites are
already settled. Ask the questions you can ask now without guessing at answers
you have not heard yet. Ask the whole frontier in one numbered round and give
your recommended answer for every question. Then wait for the user's answers
before continuing.

Format each round with a horizontal rule between questions so the recommendations
do not run together:

```markdown
❓ **Q1**. **<question title>**: <question body or choices>

➡️ <recommended answer>

---

❓ **Q2**. **<question title>**: <question body or choices>

➡️ <recommended answer>
```

Each answer reshapes the tree. Recompute the frontier after every round. A
question that depends on another question still open in this round belongs to a
later round.

Finding facts is your job. When a frontier question needs a fact from the
environment, dispatch a background subagent to find it. Keep asking the rest of
the frontier while that exploration runs; only questions downstream of the
unsettled fact wait. Decisions belong to the user. Put each one to them and wait
for their answer.

The session is done when the frontier is empty. Every branch has been visited
and nothing is left silently assumed. Do not act on the result until the user
confirms you have reached a shared understanding.
