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
- Put the answer first in the page: a short headline, a brief summary when it
  adds information, then the visual/interactive body. Do not preserve a
  summary slot when the headline or first visual already says the same thing.
- The first screen must be understandable without reading code. Explain
  the decision, bug, or concept in plain English before showing
  implementation details. Put code, dense mechanics, and caveats in
  lower sections or `<details>` blocks unless the user's explicit goal
  is code or PR reading. For code and PR reading, reach the changed flow or
  real code in the first viewport after one concise outcome statement.
- Assume the reader knows the desired behavior, not the repository's internal
  vocabulary. Use everyday words before technical names.
- Do not make acronyms or specialist terms carry the explanation. Prefer
  "exactly one of these fields" over "XOR," and "reads both saved transcript
  formats" over naming storage implementations. Keep exact terms in filenames,
  code, or secondary evidence when they help someone inspect the change.
- In summary cards, state the user-visible promise or failure being checked.
  Describe the test machinery only after that promise is clear.
- Use real labels from the task: filenames, functions, API names, states, events, dates, and decisions.
- Keep primary prose near 70–75 characters per line.
- Prefer compact sections, tables, flow diagrams, timelines, comparisons, and
  controls that reveal consequences over long paragraphs or repeated cards.
- Present a short sequence or summary of changes as one compact ordered list
  with rows and separators. Use separate cards only when the items are
  independent concepts that benefit from spatial grouping; do not turn every
  step in a flow into its own card.
- Default to the smallest page that answers the reader's question. Treat every
  section as optional. Remove review-process narration, repeated summaries,
  dashboards, metrics, and orientation that do not help the reader understand
  what changed, where it changed, or how it works.
- Use interaction only when it lets the reader test a claim, change an
  assumption, inspect a state, or check their understanding.
- Put long code snippets inside `<details>` blocks or side-by-side panels.
- Syntax-highlight code excerpts with self-contained token markup and CSS or a
  small inline highlighter. Do not use remote scripts or runtime dependencies.
  Use a small, high-contrast token palette rather than coloring every
  identifier.
- Attach code explanations to the lines they describe. Prefer compact,
  GitHub-style editorial boxes between highlighted code segments over a
  separate annotation column. Clearly label these boxes as explanation,
  visually separate them from the source lines, and never disguise editorial
  text as a source-code comment.
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
- **PR change walkthrough**: changed behavior, optional stack navigation, direct-base implementation flow, real code excerpts, proof and rollout notes.
- **Plan/report**: goal or current state, phases or timeline, blockers, risks, checks, decisions needed, next actions.
- **Incident report**: impact, timeline, trigger, cause, fix, follow-ups, evidence.

## PR And Diff Pages

- Explain the change; do not judge it unless the user asks for review.
- Gather title, body, changed files, commits, key symbols, tests, and visible user/system behavior.
- Determine whether the PR is standalone or belongs to a stack. For a stack,
  gather every open layer in bottom-to-top order, each PR's direct base, and the
  shared outcome the stack is building toward.
- Group files by changed flow: UI, API, persistence, background job, configuration, tests, docs, or similar.
- Include exact files and symbols to search.
- Put long snippets in expandable sections.
- Use review language only when a review already happened or the user asked for one.

When the reader wants to understand what changed in a PR or stack, use
`assets/patterns/annotated-diff.html`:

- Lead with the changed behavior and the implementation story. Treat diff size,
  line counts, and complexity as secondary evidence only when they answer a
  real reader question.
- For a standalone PR, omit stack navigation completely. Do not render a
  one-item tab rail or explain that the PR is not stacked.
- For a stack, add a compact bottom-to-top navigator before the selected PR.
  Label each layer with its PR number, short outcome, base, and position. Make
  the recommended review order clear through the navigator and keep the
  selected layer visible. Do not add a separate section explaining review
  order unless the dependency itself is surprising and affects correctness.
- Explain one layer at a time from its direct-base diff. Never attribute changes
  inherited from lower layers to the selected PR. Switching layers should
  update the summary, changed flow, code excerpts, files, and proof together.
- State what the whole stack delivers once, then state what the selected layer
  adds. Keep shared context stable while the reader moves between layers.
- When meaningful tests changed, use a compact secondary **Implementation** /
  **Tests** switch. Keep implementation selected by default. In the test view,
  show real test excerpts with exact filenames and inline notes that explain
  the behavior each excerpt proves; do not replace test code with pass counts
  or prose cards. Prefer tests changed in the direct-base diff. When the PR
  relies on relevant unchanged coverage, include the exact existing test and
  label it **Existing coverage — unchanged in this PR**. Keep CI, fixtures,
  infrastructure, generated files, docs, and rollout facts in a small
  collapsed proof area only when they add evidence not visible in the test
  code. Omit empty groups.
- Order implementation excerpts by learning dependency, not file path or diff
  order. A common sequence is contract/schema -> parsing/normalization ->
  orchestration -> canonical runtime/owner -> output/lifecycle/persistence.
- Use real code excerpts. Label omissions as omissions; never invent helper
  names to shorten code.
- Pair each inline editorial box with the code segment it follows. Answer:
  **what changed, where is it, and how does it work?** Add why only when it
  clarifies a non-obvious constraint or trade-off.
- Give code notes outcome-first, everyday headings. Prefer "Send one form, not
  both" over "Reject ambiguous shapes," "Reject the whole list before
  starting" over "Validate first," and "Limit the whole request" over "Bound
  amplification."
- In the proof view, explain what each group proves in plain
  language. Examples: "the old one-search request still works," "bad input is
  rejected before any search starts," and "one search call is followed by one
  tool call." Put harness, fixture, storage, and protocol details second.
- Show the unchanged canonical owner or path when reuse is an important part of
  the design. This makes delegation visible and rules out duplicate logic.
- Add review orientation or a complexity judgment only when requested or when
  an unresolved question materially changes how the diff should be read.

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
The seven examples in `assets/patterns/` are intentionally different reasoning
structures, not visual themes. Copy the closest structure, replace all sample
facts, and remove sections that do not help the reader.

The library was informed by GOV.UK content patterns, WCAG reflow guidance,
MDN live examples, Distill, Tufte CSS, Observable Plot, and a review of
`ThariqS/html-effectiveness`. The full research and source links live in
[`research/html-explanation-patterns.md`](../../research/html-explanation-patterns.md).
