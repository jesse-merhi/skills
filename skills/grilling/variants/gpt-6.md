---
name: grilling
description: 'Stress-test a plan, decision, or idea through relentless questions, optionally grounded in code, docs and Obsidian notes.'
metadata:
  sources: |
    - adapted from [skills/productivity/grilling](https://github.com/mattpocock/skills/tree/6654f6b60cd9d5be8b54c6fafe44346dabeb3b76/skills/productivity/grilling) — recorded upstream review.
---

# Grilling

Map the full decision tree and get the user's confirmation before acting. Investigate facts yourself; every decision remains the user's, even with a confident recommendation.

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

Use `spawn_agent` with `agent_type: "investigator"`. Supply its objective, worktree and revision or source, scope, constraints, acceptance criteria, and evidence. Keep question sequencing and synthesis here. If unavailable, report it and investigate locally.

Finish questioning only when the frontier is empty, every branch is visited and no assumption is silently decided. Ask the user to confirm the shared understanding before acting.

## Ground it in project evidence

When the plan touches a repository or notes, ground the questions in current evidence before asking, without reopening settled decisions:

```sh
skill-collect-context --repo <checkout> --query "<topic>"
```

The read-only helper finds the checkout, documents, code and configured Obsidian notes; use `--vault <path>` for another vault or `--limit` for more matches. Read relevant files and supplied notes; paths are not conclusions. If vault access fails, use an available connector or disclose the gap.

Check claims against code. Identify actors, domain terms, state changes, outcomes, invariants, overloaded names and contradictions before asking. Use concrete scenarios to test feasibility, failure cases, surprising dependencies, existing ADRs, vague acceptance criteria and the first useful delivery slice. For UI plans, establish audience, design direction, important states and viewports, and rendered proof. Divide a plan only when one session is impractical.

Return the tightened plan, gaps and next questions with the inspected paths and the claims or contradictions they support. Use [ADR guidance](references/adr-format.md) to decide whether to offer an ADR and to write one after acceptance.
