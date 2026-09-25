# Spec note template

Publish to `Specs/YYYY-MM-DD-short-outcome.md`, following an existing project-specific vault folder when present.

```md
# Spec: <Outcome>

Status: Draft
Type: Spec
Created: <YYYY-MM-DD>

## Outcome
<Briefly describe the user/system outcome.>

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
- <behavior or reachable failure to prove, nearest existing coverage, and any gap>
- <agreed caller-facing seam or seams at the lowest level that proves the behavior>
- <test level or prior-art test path when known; include a real cross-boundary journey when needed>
- <for frontend UI work: required mobile/desktop screenshots, interactions, layout checks, or traces>
- <what does not need dedicated coverage>

## PR Delivery
- Shape: Single PR | Stack | Separate PRs/stacks | Open question
- Review groups, in dependency order when stacked:
  1. <logical review unit>. Depends on <group or None>; proves <reviewer-visible outcome>
- Boundary rule: <why these changes belong together or need separate review>
- Keep independent groups out of a linear stack; do not turn every acceptance criterion into its own PR.
- PR gates: before readiness or merge, apply the Review gate and Sign-off gate from `AGENTS.md` to each PR. The Review gate must establish applicable evidence for the exact current candidate; Sign-off persists for the PR across later candidates.

## Open Questions
- <decision still needed>

## Technical Notes
- <known constraints, code paths, or dependencies>
- <implementation sequencing notes that should become phase-gated slices>

## Related
- [[related note]]
```
