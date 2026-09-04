---
name: html-explanations
description: 'Create standalone HTML for complex explanations, code walkthroughs, plans, reports, diagrams, or research.'
---

# HTML explanations

Make one complex question easier to understand in a local standalone HTML page.
Use for comparisons, code/architecture/bug explanations, PR walkthroughs,
plans/status/incidents/handoffs, research, lessons, and useful interactive demos.
Explaining a PR is not authority to review it.

Choose the reader's question and reasoning structure from
[html-effectiveness-patterns.md](references/html-effectiveness-patterns.md).
Use `assets/explanation-template.html` or the closest of seven
`assets/patterns/` structures, replace sample facts, and remove unhelpful sections.
Create one `.html` with inline CSS/JavaScript, no build or remote runtime dependency.
The pattern research is in [html-explanation-patterns.md](references/html-explanation-patterns.md).

## Page contract

Lead with the answer: headline, optional nonrepeating summary, then visual body.
The first viewport explains the decision/bug/concept without requiring code or
internal vocabulary. For explicit code/PR reading, reach the real changed flow
or code in that viewport after one concise outcome. Put dense mechanics, long
code, and caveats lower or in `<details>`. Use everyday terms before specialist
names and concrete task labels, files, functions, APIs, states, events, dates,
and decisions. Summary rows name the changed behavior/boundary or promised outcome
before test machinery; remove labels that merely restate their descriptions.

Keep primary prose around 70–75 characters per line. Prefer compact tables,
flows, timelines, comparisons, or consequence-revealing controls to long prose.
A short sequence is one ordered list with rows/separators; cards are for genuinely
independent concepts. Every section is optional: remove repeated summaries,
process narration, dashboards, metrics, and orientation unrelated to understanding.
Interaction must let the reader test a claim, change an assumption, inspect state,
or check understanding.

Use self-contained high-contrast syntax token markup/CSS or a small inline
highlighter, not remote scripts or colors on every identifier. Attach editorial
explanations between relevant code segments, visibly separate and labeled as
explanation, never disguised as source comments. Keep exact file/symbol evidence.
Reset inline-code background/border/padding/radius/font sizing in a dedicated
`pre code` rule so pill styles cannot leak into block code.

Reflow at 320 CSS pixels into one column without page-level horizontal scroll;
wide code/tables scroll internally. Status uses colour plus text/shape. Controls
need visible labels, keyboard support, focus, and comfortable touch targets.
Honor reduced motion and print styles that remove controls/decorations but retain
the argument. Keep pages containing local personal data/secrets local without
external fonts, scripts, analytics, or image URLs.

## Choose the useful shape and verify it

Use entrypoint→functions→state→result for code; options/matrix/recommendation for
comparison; definition/example/diagram for concepts; nodes/calls/ownership for
architecture; failure/evidence/cause/fix/proof for bugs; and appropriate phases,
blockers, decisions, or incident timeline for reports. PR/diff pages require
[pr-diff-walkthrough.md](references/pr-diff-walkthrough.md) and
`assets/patterns/annotated-diff.html` for the complete annotated direct-base diff.
Describe faithfully and judge only on explicit review authority.

Plans/status/incidents/handoffs need the chosen report shape, plainly marked
unknowns, absolute dates when material, actionable-only checklists, and command/
result evidence where available. Say in the page and reply if verification did not run.

Open the file in a browser when available; check JavaScript console errors,
every styled code block's contrast/reset, first-viewport clarity, wide and 320px
overflow, and a narrow viewport for mobile. Inspect print CSS/preview for reports,
handoffs, plans, or lessons likely to be saved. Rewrite an unclear opening;
report unverified areas. Finish with a short explanation of file, coverage,
verification, and an absolute clickable local-file Markdown link.
