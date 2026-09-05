---
name: to-spec
description: 'Turn a resolved conversation into an Obsidian spec with testing seams and PR delivery shape.'
---

# To spec

Make the existing conversation executable as a spec. Use settled decisions and
repo evidence immediately; ask only about choices this workflow still requires
the user to settle.

## Establish the design

Read the relevant code, glossary, ADRs, and related Obsidian material. Preserve
local terminology and decisions. Choose existing testing interfaces where
possible, favor the highest stable seam, and minimize seams. Reuse an agreed
choice; otherwise ask whether the proposed seams meet the user's expectations.
For UI work, resolve the design and rendered-proof requirements through
[frontend-spec.md](references/frontend-spec.md).

## Write the plan

Use [note-template.md](references/note-template.md). Record one PR for a cohesive
review unit, a `gh-stack` chain for multiple genuinely dependent groups, and
separate PRs or stacks for independent paths. An unsettled delivery shape stays
an open question; it is not permission to manufacture dependencies.

Include meaningful acceptance criteria and decisions. Prefer durable behavioral
descriptions to file inventories or code snippets. A linked prototype excerpt
may remain when it expresses a decision more accurately than prose.

## Deliver it

Publish under Obsidian `Specs/` using [naming.md](references/naming.md). When the
vault, target path, or write permission is missing, return the finished Markdown
and a proposed path. Do not create repo-local specs without an explicit request.
Keep the handoff concise and distinguish completed decisions from open ones.
