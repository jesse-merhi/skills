---
name: to-tickets
description: 'Turn a plan or spec into Obsidian tickets.'
metadata:
  sources: |
    - adapted from [skills/engineering/to-tickets](https://github.com/mattpocock/skills/tree/6654f6b60cd9d5be8b54c6fafe44346dabeb3b76/skills/engineering/to-tickets) — recorded upstream review.
---

# To tickets

Convert the settled plan into thin, end-to-end tickets.

Read the supplied spec or note in full and use conversation context, relevant code, glossary, ADRs, and existing project decisions.

## PR delivery groups

Tickets organize implementation; PR groups organize review. Do not assume one ticket equals one PR or that every ticket blocker becomes a PR base.

1. Group tickets that form one cohesive, independently verifiable review unit.
2. Collapse ticket edges inside each group, then derive dependencies between the remaining review groups.
3. Use one PR when only one review group remains.
4. Use a stack only when two or more review groups form a strict linear dependency path. Put foundations at the bottom and consumers above.
5. Use standalone PRs or separate stacks for independent or forked paths.

Every review group must name the outcome a reviewer can accept independently. If grouping tickets would make the PR too broad, or a group cannot stay green against its direct base, split or reorder the groups before asking for approval.

Show the tickets and PR groups for approval before writing. Use the installed `gh stack` tool when delivering an approved stack; discover commands with `gh stack --help`.

Write approved notes under `Issues/YYYY-MM-DD-short-outcome.md`, or the vault's existing spec-specific folder. Each ticket should explain its scope, prerequisites, needed work, and how to verify the outcome.

Without write access, return the Markdown bodies and proposed paths. Do not alter or close the parent spec unless asked.

For UI tickets, apply [Ticket design](references/ticket-design.md). Reuse existing evidence when it still covers the requested behavior; planning does not launch another validation pass.

## References

- [Ticket design](references/ticket-design.md): Read to understand how to make the tickets.
- [Note template](references/note-template.md): Use when writing approved notes.
