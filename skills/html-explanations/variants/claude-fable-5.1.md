---
name: html-explanations
description: 'Create standalone HTML for complex explanations, code walkthroughs, plans, reports, diagrams, or research.'
---

# HTML explanations

Create a local page that answers one complex reader question without a wall of
text. Use it for comparisons, code/architecture/bug explanations, PR walkthroughs,
plans/reports/incidents/handoffs, research, lessons, or small explanatory demos.

1. Pick the one thing the reader should understand. Read
   [html-effectiveness-patterns.md](references/html-effectiveness-patterns.md)
   and select the reasoning structure, not just a visual theme. Start from
   `assets/explanation-template.html` or the nearest `assets/patterns/` example.
   Replace all sample facts and delete unneeded sections. Batch independent source reads.
2. Build one standalone `.html` with inline CSS/JavaScript, no build step or
   remote runtime dependencies. Put the answer first: a short headline, summary
   only if it adds something, then visual/interactive content. Explain the concept
   before code. For explicit code/PR reading, show the actual changed flow/code
   in the first viewport after one concise outcome.
3. Write literal, short copy using everyday words before acronyms/internal names.
   Use exact task labels, files, functions, APIs, states, events, dates, and
   decisions. Summary rows state the user promise or failure before machinery.
   Delete generic labels or titles that restate the adjacent sentence.
4. Keep primary lines around 70–75 characters. Use compact tables, flows, timelines,
   comparisons, and controls only when they reveal consequences. Put a short
   sequence in one ordered list with rows/separators; use cards for independent
   concepts. Remove repeated summaries, process narration, dashboard metrics,
   and sections that do not help understanding. Interaction must test a claim,
   change an assumption, inspect state, or check understanding.
5. Put long code/dense mechanics/caveats below or in `<details>` unless code is
   the main task. Highlight with self-contained token markup/CSS or a small
   inline highlighter using a limited high-contrast palette. Place clearly
   labeled editorial boxes between relevant code segments, not in a distant
   annotation column or disguised source comments. Label/link exact evidence
   files and symbols. Reset inline background, border, padding, radius, and
   font sizing in `pre code` so inline pills do not leak into blocks.
6. Support mobile and desktop: at 320 CSS pixels reflow to one column with no
   page-level horizontal scroll; wide tables/code scroll inside containers.
   Pair status colours with labels/shapes. Give controls visible labels, keyboard
   behavior, focus, and comfortable touch targets. Honor reduced motion and
   print styles that remove controls/decorations without losing the argument.
   Local user data/secrets stay local with no external scripts/fonts/analytics/images.
7. For PR/diff explanation read [pr-diff-walkthrough.md](references/pr-diff-walkthrough.md)
   and use `assets/patterns/annotated-diff.html`. Explain the complete direct-base
   change; review it only if asked. For plans/status/incidents/handoffs choose
   that report shape, mark unknowns, use absolute dates when needed, actionable
   checklists only, and include relevant commands/results. Do not make uncertain
   plans look certain through presentation.
8. Open in a browser when available. Check JavaScript console, every styled
   code block's contrast/reset, first-viewport clarity, wide and 320px overflow,
   and a narrow mobile viewport where applicable. Inspect print CSS/preview for
   saveable reports/plans/handoffs/lessons. Zoom details if needed. Fix source and
   reinspect failures. State unverified areas, including no verification in both
   page and final reply when none ran.

Useful structures include code entrypoint→functions→state→result, comparison
options/matrix/recommendation, concept definition/example/diagram, architecture
nodes/calls/ownership, bug failure/cause/fix/proof, or incident impact/timeline/
cause/follow-up. The seven patterns' research is in
[html-explanation-patterns.md](references/html-explanation-patterns.md).
Return a short file description, what it covers, verification, and an absolute
clickable local-file Markdown link. Report meaningful evidence/direction changes
during long work.
