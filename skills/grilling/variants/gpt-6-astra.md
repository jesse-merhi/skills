---
name: grilling
description: 'Stress-test a plan, decision, or idea through relentless questions and explicit grill requests.'
metadata:
  sources: |
    - adapted from [skills/productivity/grilling](https://github.com/mattpocock/skills/tree/6654f6b60cd9d5be8b54c6fafe44346dabeb3b76/skills/productivity/grilling) — recorded upstream review.
---

# Grilling

Build a shared understanding of the entire decision tree and get the user's confirmation before acting. Every decision belongs to the user; routine-autonomy guidance must not silently decide an interview branch.

Own the factual investigation. If an environmental fact is needed, dispatch a background subagent to establish it while you continue with independent questions. Only questions downstream of that unknown fact wait.

In Codex, select the configured `investigator` through the launcher's role field (`agent_type` on `spawn_agent`). Supply the factual objective, worktree and revision or source, bounded scope, constraints, acceptance criteria and relevant evidence; the role definition supplies reusable instructions, skills and model settings. Keep question sequencing and synthesis with the coordinator and decisions with the user. If that role is unavailable, report it and establish the fact locally.

In Claude Code, invoke the native `Agent` tool with `subagent_type: "investigator"` when the optional named definition is available. Put the same bounded factual assignment in `prompt`; the definition owns reusable role instructions. Use it only when independent fact-finding can unblock a frontier question. Keep question sequencing and synthesis with the coordinator and decisions with the user. If the definition is unavailable, report it and establish the fact locally.

Other harnesses, including OpenClaw, use their own supported launcher settings under `AGENTS.md`; do not assume their spawn API accepts Codex or Claude role names.

Own the question order. The next round contains the whole frontier whose prerequisites are already settled. Do not ask a dependent question as though an answer earlier in the same round were known. For each frontier question give a concise recommendation, use the format below, and wait for the user's answers.

```markdown
❓ **Q1**. **<question title>**: <question body or choices>

➡️ <recommended answer>

---

❓ **Q2**. **<question title>**: <question body or choices>

➡️ <recommended answer>
```

After each round, apply the answers and recompute the frontier. Continue until every branch has been visited and no decision or material assumption is left implicit. An empty frontier ends the questioning; the user's confirmation of shared understanding is still required before action.
