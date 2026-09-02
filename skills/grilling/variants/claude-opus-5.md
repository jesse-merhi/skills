---
name: grilling
description: 'Stress-test a plan, decision, or idea through relentless questions and explicit grill requests.'
---

# Grilling

Drive the decision tree through user-facing question rounds until every branch
is settled and confirmed. Start with the first frontier instead of a generic
opening update. Each numbered round is the interaction, so do not narrate
routine progress around it.

The final response is the user-confirmed shared understanding or the exact
unresolved frontier. Do not create a separate saved deliverable unless asked.
Environmental lookup should answer a live frontier question, not recheck a
settled answer. Dispatch background agents only for independent facts required
by the current frontier, and never for decisions or verification.

Interview the user relentlessly until you reach a shared understanding. Map the
subject as a design tree. Every decision branches into the decisions that hang
off it.

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
