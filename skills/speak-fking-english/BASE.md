---
name: speak-fking-english
description: 'Improve substantial writing, requested rewrites, or unclear explanations with concise, concrete language.'
metadata:
  sources: |
    - adapted from [skills/productivity/wait-what](https://github.com/mattpocock/skills/tree/6654f6b60cd9d5be8b54c6fafe44346dabeb3b76/skills/productivity/wait-what) — recorded upstream review.
    - adapted from [plugins/show-me/skills/show-me](https://github.com/humanlayer/skills/tree/3c2629142c5d437428269b1b722b08c0b87f574d/plugins/show-me/skills/show-me) — recorded upstream review.
    - adapted from [pstack/skills/unslop](https://github.com/cursor/plugins/tree/799151d91b6e12ee7dbd09f708eec108d7de9b3b/pstack/skills/unslop) — recorded upstream review.
---

# Speak fking English

Write so the reader understands the point on the first read. Choose the information they need before polishing the words. A short reply full of technical labels still makes them do the explaining.

Lead with the direct answer or result. For a fix, name what was going wrong and what happens now. For unfinished work, say what remains and what prevents it. Add the reader's next action only when one is needed.

Describe what people can do, see or experience. Explain the consequence before naming the mechanism. Keep a technical term when it helps this reader understand or act, and explain an unfamiliar one in ordinary words. Use exact commands, identifiers and quotations when needed; never alter their contents.

For example:

> **Stop offering edits that are not allowed**
>
> **Problem:** People can open editing screens for parts of a site that have already been turned off. The app also shows buttons for changes it won’t allow.
>
> **Fix:** Hide the unusable buttons. Old links now open the details page instead of an editing screen.

Use that level of explanation for final responses too. Select useful facts from the work instead of translating each implementation bullet. Leave out internal task names, hashes, receipt paths and workflow bookkeeping unless the reader needs them. Cut repetition, filler, generic openings, invented labels and offers to continue work already requested.

Show useful proof beside a claim about changed behavior: an actual capture, representative output, or focused actual source with plain annotations and marked omissions. Link longer evidence when useful. Attribute reused evidence; source and diagrams explain a mechanism without proving it ran. Keep required capture, checks, review and publication with their existing workflows.

Give routine passing checks at most one short sentence in the main reply, unless more detail is requested or required by the delivery workflow. Keep failures, missing proof, uncertainty, consequential risks and necessary rollout actions visible. Brevity must not make unfinished work sound complete or change meaning.

Use short connected paragraphs by default. Use lists for items that are easier to compare or follow in order. Problem/Fix labels and headings are optional; a simple answer may need one sentence. Preserve requested depth when the task needs it.

Read the opening on its own: can the reader tell what happened without knowing the code? Replace words they would have to decode, then remove sentences that add no useful information. Return the finished writing, not an edit log.
