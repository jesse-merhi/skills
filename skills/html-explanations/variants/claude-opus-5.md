---
name: html-explanations
description: 'Create standalone HTML for complex explanations, code walkthroughs, plans, reports, diagrams, or research.'
---

# HTML explanations

Deliver one self-contained local HTML page answering one complex reader question.
Control the saved artifact as carefully as the reply: no repeated summary cards,
empty sections, or decorative interactions. Required rendering/accessibility/
print checks remain part of completion.

Choose a reasoning shape from [html-effectiveness-patterns.md](references/html-effectiveness-patterns.md).
Use `assets/explanation-template.html` or the closest of seven `assets/patterns/`
structures, replace sample facts, and remove irrelevant sections. Suitable work
includes comparisons, code/architecture/bug explanations, PR walkthroughs,
plans/status/incidents/handoffs, research, lessons, and small clarifying demos.
Use one `.html` with inline CSS/JavaScript and no build or remote runtime dependency.

Lead with the answer: headline, optional nonrepeating summary, then the useful
visual. Give plain-English grounding before mechanics; explicit code/PR reading
should reach actual changed flow/code in the first viewport after one outcome.
Use everyday terms before acronyms/internal names, while keeping exact task
files/functions/APIs/states/events/dates/decisions in evidence. Summary rows
name the concrete promise, behavior, symbol, or boundary; machinery comes later.

Keep primary prose near 70–75 characters per line. Prefer compact tables, flows,
timelines, comparisons, and consequence-revealing controls. Sequences belong in
one ordered list with rows/separators, cards in genuinely independent groups.
Remove process narration, dashboards, metrics, and repeated orientation. Interaction
must let the reader test a claim, assumption, state, or understanding.

Use lower sections, `<details>`, or side-by-side panels for long code/caveats.
Highlight locally with a small high-contrast token palette, not remote scripts
or every identifier in a colour. Place clearly labeled editorial boxes between
relevant code segments, distinct from source comments. Label/link exact evidence
files/symbols. Reset inline code background/border/padding/radius/font sizing in
`pre code`; inspect against pale strips or pill boxes on dark blocks.

Reflow at 320 CSS pixels to one column without page-level horizontal scroll;
wide code/tables may scroll internally. Status uses text/shape as well as colour.
Controls need labels, keyboard support, visible focus, and comfortable targets.
Honor reduced motion and print styles preserving the argument while removing
controls/background decoration. Keep local data/secrets local without external
scripts/fonts/analytics/image URLs.

PR/diff explanation requires [pr-diff-walkthrough.md](references/pr-diff-walkthrough.md)
and `assets/patterns/annotated-diff.html`, including the complete annotated direct-
base diff; explanation is not a review unless requested. Other structures may
follow entrypoint→functions→state→result, comparison→recommendation, definition→
example, architecture ownership, bug→cause→fix→proof, or report/incident timeline.
For plans/status/incidents/handoffs mark unknowns, use absolute material dates,
actionable-only checklists, and relevant commands/results. The research is in
[html-explanation-patterns.md](references/html-explanation-patterns.md).

Inspect the actual page in a browser when available: JavaScript console, every
code block, first-viewport clarity, wide and 320px overflow, applicable mobile
view, and print CSS/preview for saveable reports/plans/handoffs/lessons. Fix an
unclear opening and disclose unverified areas. If no verification ran, say so in
page and reply. Return only the file, what it answers, how checked, and an absolute
clickable local-file Markdown link; no extra verifier workflow is needed.
