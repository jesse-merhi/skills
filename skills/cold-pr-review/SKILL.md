---
name: cold-pr-review
description: 'Run an independent cold review of a PR, branch, or major feature using changed-flow mapping, relevant review lenses, and finding-discipline.'
---

# Cold PR Review

Run an independent review subagent with zero implementation context. The reviewer sees only the work product, not your reasoning, decisions, or prior findings. This avoids anchoring bias where knowing WHY a decision was made prevents questioning WHETHER it was correct.

## When to Use

- After completing a feature branch before merging
- After multiple iterative review/fix cycles (reviewer fatigue)
- When you suspect you've become too close to the code to evaluate it objectively
- When `code-review` needs an independent correctness pass after mapping
  and specialized review lenses

## The Pattern

Dispatch a separate reviewer subagent by default. The cold review loses
most of its value if the same agent that implemented or prepared the
change also performs the review in the same context.

Use the harness's subagent mechanism:

- **Codex:** use `spawn_agent` with a tightly scoped review prompt.
- **Claude Code:** use the `Task` tool with a code-reviewer or general
  reviewer subagent.
- **Other harnesses:** use the closest available isolated reviewer
  agent/workspace.

Only fall back to a self-review when the harness truly cannot dispatch a
separate agent. If you must fall back, say so explicitly and start a
fresh review pass after deliberately discarding the implementation
rationale.

Give the reviewer ONLY:

- What to review (PR number, file path, or git range)
- A neutral review checklist

Do NOT give it:
- Your reasoning or design decisions
- What was already reviewed or fixed
- What issues were found previously
- Context about the implementation approach
- Whether CI is passing

## Neutral Checklist

Give the reviewer enough structure to be effective without leaking prior
rationale:

- Start with `review-surface-map`: identify changed flows, entrypoints,
  contracts, state, side effects, risk surfaces, and validation targets.
- Apply `supply-chain-security-pass` when CI, dependencies, lockfiles,
  permissions, secrets, release, generated/vendor, or code-execution surfaces
  changed.
- Apply `frontend-ui-validation` expectations when rendered UI changed; the
  reviewer may request browser validation if screenshots or computed styles
  would materially affect confidence.
- Apply `pr-rubbish-audit` expectations to look for unrelated churn, dangerous
  removals, generated drift, stale branch-history comments, and unneeded
  refactors.
- Apply `typescript-discipline` expectations. If TypeScript production code,
  shared types, schemas, API/client contracts, exported helpers, typed React,
  casts, `any`, `unknown`, or ts-ignore comments changed, type-boundary and
  contract problems are actionable findings.
- Apply `improve-codebase-architecture` for boundary, dependency direction,
  ownership, and refactor-shape risks.
- Apply `reducing-cognitive-load` for dense, clever, stringly typed, weakly
  typed, over-abstracted, or hard-to-maintain code.
- Use `finding-discipline`: report only concrete actionable findings tied to
  changed lines or contracts, not style nits or vague risks.

## Prompt Template

```
Review PR #<number> on this repository. Run `gh pr view <number>`
and `gh pr diff <number>` to understand what it does. Read any files
you need for context. First map the changed flows, entrypoints,
contracts, side effects, and validation targets. Check for unrelated
diff rubbish, architecture issues, cognitive load, and React state
ownership issues. Check TypeScript type boundaries, API/client contracts,
schemas, casts, `any`, `unknown`, and ts-ignore usage when TypeScript changed.
Apply security and UI lenses when the diff touches those surfaces. Report only
concrete actionable findings tied to changed code or contracts, then give a
merge verdict.
```

Add domain-specific checklist items only when they are neutral and visible from
the review target, such as "check GitHub Actions expression correctness" or
"walk through the role-permission matrix." Do not include prior findings,
fixes attempted, or desired verdicts.

## Why It Works

When you implement code and review it yourself (or guide a reviewer with context), you anchor on your decisions. A reviewer who knows "we decided to always use --changed" won't question whether that decision is correct. A cold reviewer encountering the code for the first time evaluates it on its own merits and catches:

- Logical contradictions (safety mechanism that doesn't actually fire)
- Unnecessary dependencies (serialization that adds latency for no reason)
- Implicit assumptions that aren't documented
- Edge cases the implementer considered and dismissed too quickly

## Common Mistakes

| Mistake | Why it matters |
|---------|----------------|
| Including "two reviews already passed" | Primes the reviewer to assume code is good |
| Describing your design rationale | Prevents the reviewer from questioning the design |
| Listing issues you already fixed | Anchors reviewer on those areas, missing new ones |
| Saying "CI is passing" | Signals correctness, reduces scrutiny |
| Reviewing in the same context instead of dispatching a subagent | Preserves the implementer's blind spots |
