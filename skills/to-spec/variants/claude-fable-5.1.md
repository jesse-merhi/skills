---
name: to-spec
description: 'Turn a resolved conversation into an Obsidian spec with testing seams and PR delivery shape.'
---

# To spec

Produce the spec from the decisions already settled in this conversation.
Do not interview the user again about resolved choices.

1. Read the relevant code, glossary, ADRs, and Obsidian specs or notes. Batch
   independent reads. Use the project's terminology and existing folder rules.
2. Propose testing seams from current interfaces. Prefer existing seams, the
   highest stable seam possible, and a small number of seams. Ask the user to
   confirm choices that have not already been agreed.
3. For a frontend feature, apply
   [frontend-spec.md](references/frontend-spec.md): capture design direction,
   important states and viewports, and the rendered proof expected during
   implementation and review.
4. Record the PR delivery shape. Keep one cohesive review unit together. Load
   `gh-stack` for a strict dependency chain of at least two review groups;
   independent paths belong in separate PRs or stacks. If delivery was not
   settled, list it as an open question rather than inventing an order.
5. Write the full spec with [note-template.md](references/note-template.md).
   Keep acceptance criteria concrete. Avoid path inventories and incidental
   code; a linked prototype excerpt is appropriate when it captures a decision
   more exactly than prose.
6. Publish to Obsidian `Specs/` following [naming.md](references/naming.md).
   If the vault, destination, or write access is unavailable, return the Markdown
   and proposed path. Write into the product repo only when explicitly asked.

Complete the available drafting work before raising an unresolved decision.
Report the resulting spec and any open questions in direct, readable language.
