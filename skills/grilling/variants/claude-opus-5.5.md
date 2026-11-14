---
name: grilling
description: 'Stress-test a plan, decision, or idea through relentless questions, optionally grounded in code, docs and Obsidian notes.'
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

Wait for answers, update the tree, and repeat. For blocking environmental facts, send a bounded background subagent and continue with independent questions. Do not silently decide a branch.

Use `Agent` with `subagent_type: "investigator"`. Supply its objective, worktree and revision or source, scope, constraints, acceptance criteria, and evidence. Keep synthesis here. If unavailable, report it and investigate locally.

When no questions remain, every branch is visited, and no assumption is silently decided, summarize the understanding and wait for user confirmation.

## Ground it in project evidence

When the plan touches a repository or notes, ground the questions in current evidence before asking, without reopening settled decisions:

```sh
skill-collect-context --repo <checkout> --query "<topic>"
```

The read-only helper finds the checkout, documents, code and configured Obsidian notes; use `--vault <path>` for another vault or `--limit` for more matches. Read relevant files and supplied notes; paths are not conclusions. If vault access fails, use an available connector or disclose the gap.

Check claims against code. Identify actors, domain terms, state changes, outcomes, invariants, overloaded names and contradictions before asking. Use concrete scenarios to test feasibility, failure cases, surprising dependencies, existing ADRs, vague acceptance criteria and the first useful delivery slice. For UI plans, establish audience, design direction, important states and viewports, and rendered proof. Divide a plan only when one session is impractical.

Return the tightened plan, gaps and next questions with the inspected paths and the claims or contradictions they support. Use [ADR guidance](references/adr-format.md) to decide whether to offer an ADR and to write one after acceptance.
