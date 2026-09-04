---
name: html-explanations
description: 'Create standalone HTML for complex explanations, code walkthroughs, plans, reports, diagrams, or research.'
---

# HTML explanations

Choose the smallest local HTML page that answers the reader's question and
build it. Resolve routine pattern/layout choices from the task instead of asking
for a template selection. Preserve uncertainty in the content and required render checks.

## Shape the explanation around one question

Use for comparisons, code/architecture/flow/bug explanations, PR walkthroughs,
plans/status/incidents/handoffs, research, lessons, and demos that clarify behavior.
Read [html-effectiveness-patterns.md](references/html-effectiveness-patterns.md),
then reuse `assets/explanation-template.html` or the closest `assets/patterns/`
reasoning structure. Replace sample facts and remove irrelevant sections.
Produce one `.html` with inline CSS/JavaScript, no build or remote runtime dependency.

Lead with the answer and omit a summary that repeats the headline/first visual.
Explain in plain language before dense mechanics. For explicit code/PR reading,
reach the real changed flow/code in the first viewport after one outcome statement.
Use concrete task labels and everyday terms before specialist vocabulary; retain
exact names in evidence/code where useful. Summary rows name a behavior, promise,
file, symbol, or boundary, not generic process labels. Put test machinery after
the promise it checks.

## Make the page readable rather than larger

Aim for 70–75-character primary lines and compact tables, flows, timelines,
comparisons, or controls. A short sequence is one ordered list with separators;
independent concepts may use cards. Treat all sections as optional, cutting
process narration, repeated summaries, dashboards, metrics, and redundant orientation.
Interaction should expose a claim, assumption, state, or understanding check.
Put long code/caveats below or in `<details>` unless they are the main task.

Highlight code with local token markup/CSS or a small inline highlighter, using
a limited high-contrast palette. Attach visibly labeled editorial explanations
between relevant code segments and keep them distinct from source comments.
Link/label exact files and symbols. A dedicated `pre code` reset must remove
inline background/border/padding/radius/font-sizing styles from blocks.

At 320 CSS pixels reflow into one column without page overflow, while wide
code/tables scroll inside containers. Status needs text/shape with colour; controls
need labels, keyboard behavior, visible focus, and touch targets. Respect reduced
motion and print styles that preserve the argument while removing controls/
decoration. Local user data/secrets stay local with no external scripts/fonts/
analytics/image URLs.

## Apply the specialized shape and finish its proof

For PR/diff pages read [pr-diff-walkthrough.md](references/pr-diff-walkthrough.md)
and use `assets/patterns/annotated-diff.html`. Explain the complete annotated
direct-base change; do not infer authority to review it. Other shapes can follow
code entrypoint→state→result, options→trade-offs→recommendation, concept→example,
architecture ownership, bug→cause→fix→proof, or report/incident timelines.
Plans/status/incidents/handoffs need explicit unknowns, absolute material dates,
actionable-only checklists, and relevant command/results. Pattern research is
in [html-explanation-patterns.md](references/html-explanation-patterns.md).

Open the file in a browser when tools exist. Check console for JS, every code
block's contrast/reset, first-viewport clarity, wide/320px page overflow, applicable
narrow mobile view, and print CSS/preview for saveable reports/handoffs/plans/lessons.
Fix an unclear opening and report what was not verified; if nothing ran, say so
in page and reply. Finish with the created file, coverage, proof, and an absolute
clickable local-file Markdown link, without repeating the page in chat.
