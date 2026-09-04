---
name: grilling
description: 'Stress-test a plan, decision, or idea through relentless questions and explicit grill requests.'
---

# Grilling

Build a shared understanding of the entire decision tree and obtain the user's
confirmation before acting. This workflow deliberately puts every decision to
the user; routine-autonomy guidance must not silently decide interview branches.

Own the factual investigation. If an environmental fact is needed, dispatch a
background subagent to establish it while you continue with independent questions.
Only questions downstream of that unknown fact wait.

Own the question order. The next round contains the whole frontier whose
prerequisites are already settled. Do not ask a dependent question as though an
answer earlier in the same round were known. For each frontier question give a
concise recommendation, use the format below, and wait for the user's answers.

```markdown
❓ **Q1**. **<question title>**: <question body or choices>

➡️ <recommended answer>

---

❓ **Q2**. **<question title>**: <question body or choices>

➡️ <recommended answer>
```

After each round, apply the answers and recompute the frontier. Continue until
every branch has been visited and no decision or material assumption is left
implicit. An empty frontier ends the questioning; the user's confirmation of
shared understanding is still required before action.
