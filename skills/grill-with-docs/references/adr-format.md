# ADR format

ADRs live in the user's Obsidian-backed project notes unless the user explicitly
asks for repo-local docs.

Prefer:

```text
repos/
  <host>__<owner>__<repo>/
    ADRs/
      0001-slug.md
```

If write access or the target path is unclear, return the proposed note body and
path instead of writing into the product repo.

## Template

```md
# {Short title of the decision}

{1-3 sentences: what is the context, what did we decide, and why.}
```

An ADR can be a single paragraph. The value is in recording that a decision was
made and why.

## Optional sections

Only include these when they add genuine value. Most ADRs will not need them.

- Status frontmatter: `proposed`, `accepted`, `deprecated`, or `superseded by
  ADR-NNNN`.
- Considered Options: only when rejected alternatives are worth remembering.
- Consequences: only when downstream effects need to be called out.

## Numbering

Scan the target `ADRs/` directory for the highest existing number and increment
by one.

## When to offer an ADR

All three of these must be true:

1. The decision is hard to reverse.
2. A future reader would be surprised without the context.
3. The decision came from a real trade-off.

If a decision is easy to reverse, skip it. If it is obvious, skip it. If there
was no real alternative, skip it.

Examples that often qualify:

- Architectural shape, such as monorepo layout or event sourcing.
- Integration patterns between contexts.
- Technology choices with meaningful lock-in.
- Boundary and scope decisions.
- Deliberate deviations from the obvious path.
- Constraints not visible in the code.
- Rejected alternatives when the rejection is worth remembering.
