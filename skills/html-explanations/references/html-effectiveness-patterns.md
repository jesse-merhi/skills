# HTML Explanation Pattern Map

Local examples: `../assets/patterns/`

Choose the pattern by the question the reader needs answered. Visual style is
secondary.

## Pattern Table

| Pattern | Reader question | Required shape |
| --- | --- | --- |
| `decision-brief.html` | Which option should we choose, and why? | Recommendation first, shared criteria, evidence, trade-offs, next action |
| `code-flow.html` | How does this behavior happen? | Observable result, invariant, numbered flow, exact files and symbols, proof |
| `incident-report.html` | What happened and what prevents a repeat? | Impact, absolute timeline, causal chain, recovery, owners and follow-ups |
| `interactive-model.html` | How does changing an assumption change the result? | Labeled inputs, live output, sensitivity, formula and source data |
| `concept-lesson.html` | What mental model should I retain? | Mission, invariant, worked example, edge cases, retrieval check |
| `implementation-plan.html` | What should happen next, in what order, and how will we know? | Target behavior, dependencies, phases, risks, acceptance proof |
| `annotated-diff.html` | What changed in this PR or stack, and how do the layers compose? | Compact outcome, optional stack navigation, annotated direct-base diff, highlighted implementation/test code, secondary proof |

## Reusing A Pattern

When a pattern closely matches the task:

1. Copy the closest file from `assets/patterns/` into the task output location.
2. Replace all sample content with the user's real topic, files, symbols, data, or decision.
3. Keep the standalone structure: inline CSS, inline JavaScript, no build step.
4. Delete irrelevant sections instead of preserving empty shells.
5. Verify the copied page in a browser.

Use `assets/explanation-template.html` only when none of the seven patterns fit.

## Choosing A Shape

- If the user asks "which option should we pick?", use the decision brief.
- If the user asks "how does this work?", use code flow.
- If the user asks "teach me", use the concept lesson.
- If the user asks "what happened?", use an incident timeline.
- If the user asks "what if this input changes?", use the interactive model.
- If the user asks "what should we do next?", use the implementation plan.
- For a PR walkthrough, adapt code flow when behavior changed and decision brief
  when the page explains an architectural choice.
- For a reader who wants to understand a PR or stack, use the change
  walkthrough. Lead with changed behavior. For a stack, navigate layers
  bottom-to-top and explain each direct-base diff separately. For a standalone
  PR, omit the navigator. Put a small annotated direct-base diff first, with
  implementation and real changed test code one compact tab away. Keep
  fixtures, infrastructure, CI, generated
  files, docs, and rollout notes in collapsed proof only when they add evidence
  not already visible in the test code.
- For status, adapt implementation plan and make completed, active, blocked,
  and next work explicit.

## HTML Quality Bar

- The page should reduce reading effort. If it is just paragraphs in a browser, use chat instead.
- Use layout to encode meaning: columns for comparison, timelines for time, arrows for flow, badges for state, tables for repeated facts.
- Use one compact row-based list for a short flow or summary of changes. Reserve
  card grids for independent concepts, not steps that should be read in order.
- Write each summary row as one specific statement. Omit generic mini-headings
  that restate the sentence beside them.
- Keep the first viewport useful. The user should see the answer, not only a title.
- For PR reading, make the first viewport reach the selected layer's changed
  flow or code. Do not spend it on review-order prose, diff metrics, repeated
  summaries, or generic architecture teaching.
- Use plain CSS and semantic HTML. Add JavaScript only when interaction helps.
- Keep generated assets local. Inline SVG is fine for diagrams.
- Couple a claim with its evidence or inspectable example.
- Put code explanations inline between the highlighted code segments they
  describe. Keep editorial boxes visually distinct from real source comments.
- Hide only optional detail. Recommendations, required evidence, and next
  actions stay visible.
- Reflow at 320 CSS pixels. Code and tables may scroll inside their own
  containers; the page must not.
- Use a text label or shape as well as color for status.
- Keep controls at least 44px in the dimension the user must target.
- Support reduced motion and printable output.
