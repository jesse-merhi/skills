# Questions and moves

## Questions

- Can a future change be made near the concept it changes?
- Does the module expose a small interface over meaningful internal complexity,
  or does every caller need to understand its internals?
- Are domain decisions centralized, or copied across call sites?
- Do dependencies point from policy to detail, or has detail leaked upward into
  core workflow code?
- Are names carrying domain meaning, or just restating mechanics?
- Can the behavior be tested without constructing the whole app?
- Is the pain real in this codebase, or only a preference?

## Useful moves

- Move policy decisions closer to the domain boundary.
- Split orchestration from pure transformation when that improves testability.
- Introduce a type or discriminated union when it removes impossible states.
- Collapse shallow pass-through wrappers that add vocabulary without hiding
  complexity.
- Prefer one deep module over several thin files that must be opened together to
  understand one concept.
- If a decision should be remembered, propose an Obsidian note instead of a
  product-repo ADR.
