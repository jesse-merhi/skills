---
name: to-spec
description: 'Turn a resolved conversation into an Obsidian spec with testing seams and PR delivery shape.'
---

# To spec

Turn settled discussion and current project evidence into an implementable
Obsidian spec. Preserve decisions already made rather than restarting the
interview.

Ground the spec in the repo, glossary, relevant ADRs, and related Obsidian notes.
Identify the testing seams: prefer existing seams, the highest stable interface,
and as few seams as practical. If those decisions are unsettled, confirm them
with the user. For UI work, apply
[frontend-spec.md](references/frontend-spec.md) before publication.

Record the delivery shape before implementation: one cohesive review unit in
one PR; `gh-stack` for two or more review groups on a strict dependency path;
separate PRs or stacks for independent work. Preserve the agreed shape. If it
was not settled, record an open question instead of inventing dependencies.

Write with [note-template.md](references/note-template.md) and publish under
Obsidian `Specs/` using [naming.md](references/naming.md). If the vault, path, or
write access is unavailable, return the Markdown and proposed path. Repo-local
spec files require an explicit request.

Keep decisions and observable acceptance criteria. Omit brittle file inventories
and ordinary code samples; retain a prototype excerpt only when it conveys a
decision more precisely than prose, with a link to its source.
