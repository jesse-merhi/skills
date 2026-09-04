---
name: to-spec
description: 'Turn a resolved conversation into an Obsidian spec with testing seams and PR delivery shape.'
---

# To spec

Deliver one implementable spec for the settled feature, stored in Obsidian
`Specs/`. Cover the decisions and evidence the implementer needs without adding
an unsolicited redesign or a long background document.

## Inputs and user decisions

Use the conversation, relevant code, glossary, ADRs, and existing Obsidian notes.
Prefer existing testing seams at the highest stable interface and use as few
as practical. Confirm seams only when the choice remains unsettled. Apply
[frontend-spec.md](references/frontend-spec.md) for UI direction, states,
viewports, and the rendered proof expected during implementation and review.

## Spec contents

Follow [note-template.md](references/note-template.md). Preserve agreed PR shape:
one cohesive unit in one PR; a `gh-stack` chain for multiple review groups with
real sequential dependencies; separate PRs or stacks for independent work.
Leave unresolved delivery choices in open questions.

Keep the document proportionate. Include observable acceptance criteria and
necessary implementation decisions, not brittle path catalogs or routine code.
A linked prototype snippet may encode a decision that prose cannot express as
well.

## Destination

Use [naming.md](references/naming.md). If Obsidian, the destination, or write
access is unavailable, return the complete Markdown and proposed path. Product
repo files require the user's explicit request. End with the spec location and
remaining decisions; no extra document-verifier workflow is needed.
