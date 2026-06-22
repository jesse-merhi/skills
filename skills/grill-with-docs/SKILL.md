---
name: grill-with-docs
description: 'Challenge plans, PRDs, implementation ideas, or architecture decisions against repo docs, code, glossary, ADRs, project context, and open questions.'
---

# Grill With Docs

Interview the user relentlessly about every aspect of the plan until
you reach shared understanding. Walk down each branch of the design
tree, resolving dependent decisions one by one. For each question,
provide your recommended answer.

Ask questions one at a time and wait for feedback before continuing.
If a question can be answered by exploring the codebase, docs, or
project context, explore first and bring the evidence back instead of
asking.

## Workflow

1. Locate project context before judging or questioning the plan:
   - `AGENTS.md`, `CLAUDE.md`, `README.md`, `CONTEXT.md`
   - `CONTEXT-MAP.md` for multi-context repos
   - `docs/`, `docs/adr/`, `docs/agents/`, `docs/prds/`
   - user-provided project notes when available
   - domain notes in Obsidian when the user points at them or the
     Obsidian MCP is available
   - nearby code and tests when the plan mentions concrete modules
2. Extract the plan's nouns and verbs:
   - product concepts
   - system names
   - state transitions
   - user-visible outcomes
   - implied invariants
3. Compare those terms against existing docs and code. Prefer existing
   vocabulary. Flag invented terms, overloaded names, and domain gaps.
4. Grill the plan with concrete one-at-a-time questions:
   - Which existing decision or ADR does this rely on?
   - Which code path proves the plan is implementable?
   - What behavior is the first vertical slice?
   - What assumption would make the plan fail?
   - Which acceptance criterion is still vague or untestable?
   - If the plan changes rendered UI, what design direction, viewport
     states, and `frontend-ui-validation` proof will review require?
5. Continue until the plan is clear enough to execute, then return
   either:
   - a tightened plan with the assumptions and first slice made clear
   - a short set of blockers/questions if the plan is not ready

## During The Session

### Challenge Against The Glossary

When the user uses a term that conflicts with existing language in
`CONTEXT.md`, call it out immediately.

Example:

```text
Your glossary defines "cancellation" as a whole-order action, but this
plan seems to allow cancelling one line item. Which meaning should we
use here?
```

### Sharpen Fuzzy Language

When the user uses vague or overloaded terms, propose a precise term.

Example:

```text
You are saying "account". Do you mean the Customer, the User, or the
workspace? Those are different concepts in this repo.
```

### Discuss Concrete Scenarios

Stress-test domain relationships with specific scenarios. Invent edge
cases that force clear boundaries between concepts, states, and
ownership.

### Cross-Reference With Code

When the user states how something works, check whether the code agrees.
If you find a contradiction, surface it as the next question.

Example:

```text
The code only cancels whole Orders, but the plan describes partial
cancellation. Should the plan change, or is the code missing a required
state?
```

### Check UI Readiness

When the plan changes user-facing frontend UI, make the design and review
bar explicit before calling the plan ready:

- Use `impeccable` to name the audience/register, mode, tone,
  structure, tokens, anti-references, and likely visual risk.
- Ask which states and viewports must be proven: mobile, tablet,
  desktop, loading, empty, error, disabled, overflow, long text, and
  dense data states when relevant.
- Treat `frontend-ui-validation` as required review proof for rendered UI
  changes. The plan should name screenshots or layout-audit output that
  will prove text does not clip, wrap badly, overflow, or overlap.
- If the feature will go through `code-review`, call out that UI changes
  need the rendered validation pass before the review can be called
  clean.

### Update CONTEXT.md Inline

When a project-specific term is resolved, update the external project
context `CONTEXT.md` right away. Use
[CONTEXT-FORMAT.md](./CONTEXT-FORMAT.md).

`CONTEXT.md` is a glossary. Keep implementation details, specs,
scratch notes, and implementation decisions out of it.

Do not create or edit product-repo `CONTEXT.md`, `CONTEXT-MAP.md`, or
`docs/adr/` files unless the user explicitly asks for repo-local docs.
Prefer the user's Obsidian-backed project notes when available. If write
access or the target path is unclear, return the note body and proposed
Obsidian path.

### Offer ADRs Sparingly

Offer to create an ADR only when all three are true:

1. The decision is hard to reverse.
2. A future reader would be surprised without the context.
3. The decision came from a real trade-off.

If any of those is missing, skip the ADR. Use
[ADR-FORMAT.md](./ADR-FORMAT.md).

## Output Shape

Prefer short sections:

- `Grounding`: docs/code/notes inspected
- `What Holds Up`: parts supported by evidence
- `Gaps`: unclear terms, missing decisions, weak assumptions
- `Tightened Plan`: revised plan or first slice
- `Next Question`: the single question the user should answer next

When the plan is ready, stop asking and give the tightened plan.
