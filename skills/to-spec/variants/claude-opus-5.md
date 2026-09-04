---
name: to-spec
description: 'Turn a resolved conversation into an Obsidian spec with testing seams and PR delivery shape.'
---

# To spec

Outcome: turn the settled conversation and current codebase evidence into an
implementable spec. Synthesize what is already known; do not restart the
interview.

Publish specs to Obsidian. If the vault is unavailable or the target path is
unclear, return the Markdown body and proposed `Specs/` path.

## Workflow

Keep one implementable spec at the requested scope. Preserve all required sections and evidence, but remove filler and copied conversation; do not reopen settled decisions or expand into an unrequested implementation project.

1. Explore the repo to understand the current state of the codebase, if you
   have not already. Use the project's glossary vocabulary throughout the spec,
   and respect ADRs or Obsidian decisions in the area you are touching.
2. Search/read related Obsidian specs, issues, and notes when available so
   terminology, prior decisions, and folder conventions match the vault.
3. Sketch out the seams at which the feature will be tested. Existing seams
   should be preferred to new ones. Use the highest seam possible. If new seams
   are needed, propose them at the highest point you can. The fewer seams across
   the codebase, the better; the ideal number is one.
4. Check with the user that these seams match their expectations when the seam
   choice is not already settled.
5. For frontend UI work, capture the design direction and rendered validation
   bar from [frontend-spec.md](references/frontend-spec.md) before publishing.
6. Choose the PR delivery shape before implementation. Keep one cohesive review
   unit in one PR. When the outcome needs two or more independently reviewable
   units on a strict dependency path, load `gh-stack` and record the logical
   groups bottom-to-top. Keep independent work in standalone PRs or separate
   stacks. If the shape was not settled in the conversation, record it as an
   open question instead of inventing an order.
7. Write the spec using [note-template.md](references/note-template.md).
8. Publish to Obsidian `Specs/` using [naming.md](references/naming.md). If
   write access is missing, return the Markdown body and proposed path.
9. Do not write specs into the product repo unless the user explicitly asks for
   repo-local docs.
10. Avoid brittle file-path inventories and code snippets. Exception: if a
   prototype produced a snippet that encodes a decision more precisely than
   prose can, inline the decision-rich part and name or link the prototype.

## Context pointers

- Use [note-template.md](references/note-template.md) for the spec note body.
- Use [frontend-spec.md](references/frontend-spec.md) for rendered UI design and
  validation requirements.
- Use [naming.md](references/naming.md) for vault-relative note paths.
