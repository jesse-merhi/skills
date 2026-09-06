---
name: to-spec
description: 'Turn a resolved conversation into an Obsidian spec with testing seams and PR delivery shape.'
metadata:
  sources: |
    - adapted from [skills/engineering/to-spec](https://github.com/mattpocock/skills/tree/6654f6b60cd9d5be8b54c6fafe44346dabeb3b76/skills/engineering/to-spec) — recorded upstream review.
---

# To spec

Turn settled discussion and current project evidence into an implementable Obsidian spec.

Read the repo, glossary, relevant ADRs, and related Obsidian notes before writing the spec. Name the existing functions, service methods, or routes that tests should call. Prefer the highest stable interface that proves the behavior, using as few test entry points as practical. For example, test order creation through the existing service method rather than testing each helper separately.

Use one PR for a cohesive change. Prefer a stack for dependent parts and separate PRs for independent work. Confirm a proposed stack with the user before publishing; use the installed `gh stack` tool for its delivery and discover commands with `gh stack --help`.

Write and name the Obsidian spec.

If the vault, path, or write access is unavailable, stop and tell the user.

For UI work, apply [Frontend spec](references/frontend-spec.md) before publication. Planning does not launch another validation pass.

## References

- [Note template](references/note-template.md): Use to write and name the Obsidian spec.
