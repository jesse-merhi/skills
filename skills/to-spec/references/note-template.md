# Spec Note Template

```md
# Spec: <Outcome>

Status: Draft
Type: Spec
Created: <YYYY-MM-DD>

## Outcome
<One or two sentences describing the user/system outcome.>

## Problem
<What pain or opportunity this addresses.>

## Scope
Included:
- <included behavior>

Excluded:
- <explicit non-goal>

## User Flow
1. <step>

## Acceptance Criteria
- <observable criterion>
- <for frontend UI work: viewport/state criterion that can be proven visually or by layout audit>

## Implementation Decisions
- <modules, interfaces, schema/API contracts, or sequencing decisions already agreed>
- <for frontend UI work: audience, mode, tone, structure, tokens, and likely visual risk>
- <avoid brittle file-path lists unless a path is necessary for execution>

## Testing Decisions
- <behavior to test through public interfaces>
- <agreed test seam or seams; prefer the highest existing seam that still gives stable feedback>
- <test level or prior-art test path when known>
- <for frontend UI work: required `frontend-ui-validation` evidence such as mobile/desktop screenshots, layout audit, console check, or trace>
- <what does not need dedicated coverage>

## PR Delivery
- Shape: Single PR | Stack | Separate PRs/stacks | Open question
- Review groups, in dependency order when stacked:
  1. <logical review unit> — depends on <group or None>; proves <reviewer-visible outcome>
- Boundary rule: <why these changes belong together or need separate review>
- Keep independent groups out of a linear stack; do not turn every acceptance criterion into its own PR.
- Human sign-off gate: after proof, review, validation, and CI pass, require a
  `jesse-merhi` thumbs-up (`+1`) reaction on every PR. The agent must never add
  or remove this reaction.

## Open Questions
- <decision still needed>

## Technical Notes
- <known constraints, code paths, or dependencies>
- <implementation sequencing notes that should become phase-gated slices>

## Related
- [[related note]]
```
