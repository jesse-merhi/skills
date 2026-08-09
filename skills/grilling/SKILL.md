---
name: grilling
description: 'Grill the user relentlessly about a plan, decision, or idea. Use when the user wants to stress-test their thinking or uses a grill trigger phrase.'
---

# Grilling

Interview the user relentlessly until you reach a shared understanding. Map the
subject as a design tree: every decision branches into the decisions that hang
off it.

Work the tree in rounds. The frontier is every decision whose prerequisites are
already settled: the questions you can ask now without guessing at answers you
have not heard yet. Ask the whole frontier in one numbered round and give your
recommended answer for every question. Then wait for the user's answers before
continuing.

Format every question as:

```markdown
❓ **Q1** - **<question title>**: <question body or choices>

➡️ <recommended answer>
```

Each answer reshapes the tree. Recompute the frontier after every round. A
question that depends on another question still open in this round belongs to a
later round.

Finding facts is your job. When a frontier question needs a fact from the
environment, dispatch a background subagent to find it. Keep asking the rest of
the frontier while that exploration runs; only questions downstream of the
unsettled fact wait. Decisions belong to the user: put each one to them and wait
for their answer.

The session is done when the frontier is empty: every branch has been visited
and nothing is left silently assumed. Do not act on the result until the user
confirms you have reached a shared understanding.
