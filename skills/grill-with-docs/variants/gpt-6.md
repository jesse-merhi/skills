---
name: grill-with-docs
description: 'Ground a plan in code and Obsidian notes, then question its decisions.'
metadata:
  sources: |
    - adapted from [skills/engineering/grill-with-docs](https://github.com/mattpocock/skills/tree/6654f6b60cd9d5be8b54c6fafe44346dabeb3b76/skills/engineering/grill-with-docs) — recorded upstream review.
---

# Grill with docs

Ground a `grilling` interview in current project evidence without reopening settled decisions.

```sh
skill-collect-context --repo <checkout> --query "<topic>"
```

The read-only helper finds the checkout, documents, code, and configured Obsidian notes. Use `--vault <path>` for another vault or `--limit` for more matches. Read relevant files and user-supplied notes; paths are not conclusions. If vault access fails, use an available connector or disclose the gap.

Check claims against code. Identify actors, domain terms, state changes, outcomes, invariants, overloaded names, and contradictions before asking questions.

Load `grilling`. Use concrete scenarios to test feasibility, failure cases, surprising dependencies, existing ADRs, vague acceptance criteria, and the first useful delivery slice.

For UI plans, establish audience, design direction, important states and viewports, and rendered proof. Divide a plan only when one session is impractical.

Return the tightened plan, gaps, and next questions, with inspected paths and supported claims or contradictions. Stop when the user confirms it is ready to execute. Use [ADR guidance](references/adr-format.md) to decide whether to offer an ADR and to write one after acceptance.
