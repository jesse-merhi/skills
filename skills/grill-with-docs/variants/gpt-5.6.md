---
name: grill-with-docs
description: 'Ground a plan in code and Obsidian notes, then question its decisions.'
metadata:
  sources: |
    - adapted from [skills/engineering/grill-with-docs](https://github.com/mattpocock/skills/tree/6654f6b60cd9d5be8b54c6fafe44346dabeb3b76/skills/engineering/grill-with-docs) — recorded upstream review.
---

# Grill with docs

Use current project evidence to support a `grilling` interview, not to restart settled decisions.

```sh
skill-collect-context --repo <checkout> --query "<topic>"
```

The read-only helper identifies the Git checkout, repository documents, matching code, and notes in the configured Obsidian vault. Use `--vault <path>` for another vault and `--limit` for more matches. It returns paths, not conclusions; read the relevant files and user-supplied notes. Missing vault access is reported explicitly—use an available connector or disclose the gap.

Check claims against actual code. Extract the actors, domain terms, state changes, outcomes, and implied invariants. Flag overloaded names and contradictions before building questions on them.

Load `grilling` for the interview. Use concrete scenarios. Pressure-test feasibility, failure cases, surprising dependencies, existing ADRs, vague acceptance criteria, and the first useful piece of delivery.

For UI plans, establish audience, design direction, important states/viewports, and the rendered proof needed. Divide a plan only when its scope or unresolved decisions make one session impractical.

Return the tightened plan, remaining gaps, and next questions. Stop once the user confirms it is clear enough to execute. Use the [ADR guidance](references/adr-format.md) to decide whether to offer one and to write it after acceptance.
