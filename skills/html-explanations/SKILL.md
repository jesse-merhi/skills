---
name: html-explanations
description: 'Create standalone HTML for complex explanations, code/diff walkthroughs, plans, reports, handoffs, diagrams, research notes, and concepts.'
---

# HTML Explanations

Use this skill when the user needs to understand something and prose would become a wall of text. Produce a standalone `.html` file that the user can open locally.

Good fits:

- Comparing options, tradeoffs, or approaches
- Explaining code flow, architecture, data flow, or a bug cause
- Explaining a PR, branch, commit, or diff without doing a code review
- Turning implementation plans, status updates, incident reports, or handoffs into visual reports
- Teaching a concept with diagrams, timelines, examples, or controls
- Turning research notes into a scannable explainer
- Making a small interactive demo that clarifies behavior

## Workflow

1. Decide the one thing the page should help the user understand.
2. Pick a reader question and format from
   `references/html-effectiveness-patterns.md`.
3. Create a local standalone HTML file. Use
   `assets/explanation-template.html` for a small starter or copy the closest
   repo-owned pattern from `assets/patterns/`.
4. Keep the final chat reply short: what file you created, an absolute
   Markdown link to open it, what it covers, and how it was verified.

## Output Rules

- Use one self-contained `.html` file with inline CSS and inline JavaScript.
- Do not add a build step or remote runtime dependency.
- Put the answer first in the page: a short headline, a one-paragraph summary, then the visual/interactive body.
- The first screen must be understandable without reading code. Explain
  the decision, bug, or concept in plain English before showing
  implementation details. Put code, dense mechanics, and caveats in
  lower sections or `<details>` blocks unless the user's explicit goal
  is code reading.
- Use real labels from the task: filenames, functions, API names, states, events, dates, and decisions.
- Keep primary prose near 70–75 characters per line.
- Prefer compact sections, tables, flow diagrams, timelines, comparisons, and
  controls that reveal consequences over long paragraphs or repeated cards.
- Use interaction only when it lets the reader test a claim, change an
  assumption, inspect a state, or check their understanding.
- Put long code snippets inside `<details>` blocks or side-by-side panels.
- If styling inline `<code>` and block `<pre><code>`, add a dedicated
  `pre code` rule that resets inline-code backgrounds, borders, padding,
  radius, and font sizing inside code blocks. Inline code pill styles must
  never leak into block code, because they create unreadable pale strips on
  dark code panels.
- If the page explains code, link or label the exact files and symbols used as evidence.
- If the page includes user data or secrets from local files, keep it local and do not add external scripts, fonts, analytics, or image URLs.
- Make it readable on mobile and desktop.
- At 320 CSS pixels, reflow into one column without page-level horizontal
  scrolling. Let wide tables and code blocks scroll inside their own
  containers.
- Use color and a text label or shape together for status.
- Give interactive controls visible labels, keyboard behavior, visible focus,
  and comfortable touch targets.
- Honor `prefers-reduced-motion` and include print styles that remove controls
  and decorative backgrounds without removing the argument.

## Page Shapes

Use these as starting points:

- **Code flow**: entrypoint -> important functions -> state/data movement -> result -> risk points.
- **Comparison**: option cards, decision matrix, when-to-use labels, final recommendation.
- **Concept explainer**: short definition, concrete example, diagram, edge cases, small interactive control.
- **Architecture map**: modules as nodes, arrows for calls/data/events, notes on ownership boundaries.
- **Bug explanation**: broken behavior, evidence, cause, smallest fix, verification.
- **PR/diff walkthrough**: what changed, changed flow map, files to read, before/after behavior, tests, open questions.
- **Plan/report**: goal or current state, phases or timeline, blockers, risks, checks, decisions needed, next actions.
- **Incident report**: impact, timeline, trigger, cause, fix, follow-ups, evidence.

## PR And Diff Pages

- Explain the change; do not judge it unless the user asks for review.
- Gather title, body, changed files, commits, key symbols, tests, and visible user/system behavior.
- Group files by changed flow: UI, API, persistence, background job, configuration, tests, docs, or similar.
- Include exact files and symbols to search.
- Put long snippets in expandable sections.
- Use review language only when a review already happened or the user asked for one.

## Plans, Reports, Incidents, And Handoffs

- Pick the report shape first: plan, status, incident, or handoff.
- Mark unknowns plainly; do not let the visual format make uncertain plans look more certain.
- Use absolute dates when timing matters.
- Use checklists only for actionable items.
- If local commands support the report, include the command and result.
- If no verification ran, say that in the page and final reply.

## Verification

Before saying the work is done:

- Open the HTML file in a browser when browser tools are available.
- Check the console for errors if the page has JavaScript.
- Visually inspect every `<pre><code>` block after CSS is applied.
  Confirm code text has strong contrast and is not inheriting inline
  code pill backgrounds, borders, padding, or rounded boxes.
- Read the first viewport as if you are the target user. If it is not
  clear what the recommendation or explanation is before any code
  block, rewrite the top of the page.
- Check at least one narrow viewport if the page is meant to be read on mobile.
- Check for page-level horizontal overflow at both wide and 320px viewports.
- Print-preview or otherwise inspect print CSS when the page is a report,
  handoff, plan, or lesson likely to be saved.
- Report anything you did not verify.
- Always include a clickable absolute local-file Markdown link in the final
  reply, using the file path format supported by the current harness.

## Pattern Library

Read `references/html-effectiveness-patterns.md` before choosing a page shape.
The six examples in `assets/patterns/` are intentionally different reasoning
structures, not visual themes. Copy the closest structure, replace all sample
facts, and remove sections that do not help the reader.

The library was informed by GOV.UK content patterns, WCAG reflow guidance,
MDN live examples, Distill, Tufte CSS, Observable Plot, and a review of
`ThariqS/html-effectiveness`. The full research and source links live in
[`research/html-explanation-patterns.md`](../../research/html-explanation-patterns.md).
