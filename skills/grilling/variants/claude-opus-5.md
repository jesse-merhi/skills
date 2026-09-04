---
name: grilling
description: 'Stress-test a plan, decision, or idea through relentless questions and explicit grill requests.'
---

# Grilling

Settle every branch of the user's decision tree through question rounds, then
obtain confirmation of shared understanding. The deliverable is the settled
understanding, not implementation of it.

Map the subject and identify the full frontier: questions with settled
prerequisites. Ask that frontier together and recommend an answer for each.
Do not include questions whose answer depends on an unresolved question in the
same round. Keep each recommendation short enough to compare.

```markdown
❓ **Q1**. **<question title>**: <question body or choices>

➡️ <recommended answer>

---

❓ **Q2**. **<question title>**: <question body or choices>

➡️ <recommended answer>
```

Wait for the answers, update the tree, and repeat. Environmental facts are your
responsibility: dispatch a bounded background subagent when a question needs
one, grouping related facts where possible. Continue with independent frontier
questions during the investigation. Do not add verifier workers around factual
results. Decisions remain the user's; never omit a branch because the answer
seems obvious or the interview is getting long.

Stop asking when every branch has been visited and the frontier is empty.
Summarize the settled understanding concisely and wait for user confirmation
before acting on it.
