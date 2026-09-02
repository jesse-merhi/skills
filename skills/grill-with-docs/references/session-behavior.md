# Session behavior

## Challenge against the glossary

When the user uses a term that conflicts with existing language in `CONTEXT.md`,
call it out immediately.

Example:

```text
Your glossary defines "cancellation" as a whole-order action, but this
plan seems to allow cancelling one line item. Which meaning should we
use here?
```

## Sharpen fuzzy language

When the user uses vague or overloaded terms, propose a precise term.

Example:

```text
You are saying "account". Do you mean the Customer, the User, or the
workspace? Those are different concepts in this repo.
```

## Discuss concrete scenarios

Stress-test domain relationships with specific scenarios. Invent edge cases
that force clear boundaries between concepts, states, and ownership.

## Cross-reference with code

When the user states how something works, check whether the code agrees. If you
find a contradiction, surface it as the next question.

Example:

```text
The code only cancels whole Orders, but the plan describes partial
cancellation. Should the plan change, or is the code missing a required
state?
```

## Check UI readiness

When the plan changes user-facing frontend UI, make the design and review bar
explicit before calling the plan ready:

- Name the audience, product or brand register, mode, tone, structure, existing
  tokens, anti-references, interaction intent, and likely visual risk. Use
  `design` in production-UI or interaction mode when implementation guidance is
  needed.
- Ask which states and viewports must be proven: mobile, tablet, desktop,
  loading, empty, error, disabled, overflow, long text, and dense data states
  when relevant.
- Treat `frontend-ui-validation` as required review proof for rendered UI
  changes.
- The plan should name screenshots or layout-audit output that will prove text
  does not clip, wrap badly, overflow, or overlap.
- If the feature will go through `code-review`, call out that UI changes need
  the rendered validation pass before the review can be called clean.

## Update context inline

When a project-specific term is resolved, update the external project context
`CONTEXT.md` right away using `references/context-format.md`.

`CONTEXT.md` is a glossary. Keep implementation details, specs, scratch notes,
and implementation decisions out of it.

Do not create or edit product-repo `CONTEXT.md`, `CONTEXT-MAP.md`, or
`docs/adr/` files unless the user explicitly asks for repo-local docs. Prefer
the user's Obsidian-backed project notes when available. If write access or the
target path is unclear, return the note body and proposed Obsidian path.

## Offer ADRs sparingly

Offer to create an ADR only when all three are true:

1. The decision is hard to reverse.
2. A future reader would be surprised without the context.
3. The decision came from a real trade-off.

If any of those is missing, skip the ADR. Use `references/adr-format.md`.
