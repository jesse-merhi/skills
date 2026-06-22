# html-effectiveness Pattern Map

Source: `https://github.com/ThariqS/html-effectiveness`

Local vendored examples: `../assets/html-effectiveness/examples/`

The repo is a gallery of standalone HTML files with no build step and no dependencies. Use it as a pattern library for choosing the shape of an HTML explanation.

## Pattern Table

| Source example | Use when | Useful page shape |
| --- | --- | --- |
| `01-exploration-code-approaches.html` | Comparing implementation options | Side-by-side approaches, code snippets, pros/cons, recommendation |
| `02-exploration-visual-designs.html` | Comparing UI directions | Visual variants, criteria, notes per direction |
| `03-code-review-pr.html` | Stored for upstream completeness; use only if the user explicitly asks for a review-style page | Findings, risk areas, changed files, review checklist |
| `04-code-understanding.html` | Explaining how code works | Entry point, flow diagram, call chain, state changes |
| `05-design-system.html` | Explaining design rules | Tokens, components, usage examples, do/don't pairs |
| `06-component-variants.html` | Showing component variants | Matrix by state, size, theme, and behavior |
| `07-prototype-animation.html` | Explaining animation behavior | Live animation, timing notes, state labels |
| `08-prototype-interaction.html` | Explaining an interaction | Small interactive demo with reset and state display |
| `09-slide-deck.html` | Presenting a short story | Full-screen slides, one point per slide |
| `10-svg-illustrations.html` | Explaining visual metaphors | Inline SVG diagrams or illustrations |
| `11-status-report.html` | Reporting work status | Progress bands, owners, blockers, timeline |
| `12-incident-report.html` | Explaining an incident | Impact, timeline, cause, remediation, follow-ups |
| `13-flowchart-diagram.html` | Showing process logic | Nodes, arrows, branch labels, annotations |
| `14-research-feature-explainer.html` | Explaining a feature | Context, mechanics, examples, implementation notes |
| `15-research-concept-explainer.html` | Teaching a concept | Definition, interactive example, edge cases |
| `16-implementation-plan.html` | Planning implementation | Phases, dependencies, acceptance checks, risks |
| `17-pr-writeup.html` | Explaining a PR | What changed, why, risk, verification |
| `18-editor-triage-board.html` | Editing/prioritizing items | Kanban board, filters, item details |
| `19-editor-feature-flags.html` | Explaining flags/config | Editable config table, environments, guardrails |
| `20-editor-prompt-tuner.html` | Tuning prompts/content | Input/output panes, controls, diff/score display |

## Reusing The Vendored HTML

When a source example closely matches the task:

1. Copy the source file from `assets/html-effectiveness/examples/` into the task output location.
2. Replace all sample content with the user's real topic, files, symbols, data, or decision.
3. Keep the standalone structure: inline CSS, inline JavaScript, no build step.
4. Preserve the upstream copyright/SPDX header.
5. Verify the copied page in a browser when possible.

Use `assets/explanation-template.html` only when none of the vendored examples fit.

## Choosing A Shape

- If the user asks "which option should we pick?", use an approach comparison.
- If the user asks "how does this work?", use a code flow or concept explainer.
- If the user asks "what happened?", use an incident timeline.
- If the user asks "what should we do next?", use an implementation plan.
- If the user asks "what changed in this PR?", use a PR writeup page.
- If the user will edit or triage data, use a small editing UI.

## HTML Quality Bar

- The page should reduce reading effort. If it is just paragraphs in a browser, use chat instead.
- Use layout to encode meaning: columns for comparison, timelines for time, arrows for flow, badges for state, tables for repeated facts.
- Keep the first viewport useful. The user should see the answer, not only a title.
- Use plain CSS and semantic HTML. Add JavaScript only when interaction helps.
- Keep generated assets local. Inline SVG is fine for diagrams.
