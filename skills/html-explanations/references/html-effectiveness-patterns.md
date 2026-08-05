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
| `annotated-diff.html` | Why is this diff this size, and how do its files compose? | Production/supporting tabs, net-line anatomy, dependency-ordered real code, numbered why/how/where notes, complexity boundary |

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
- For a reader who understands the target behavior but wants to understand the
  implementation diff, use the annotated diff. Default to production code;
  move tests, fixtures, infrastructure, CI, generated files, and docs into the
  supporting tab. Order code by what the reader must understand first.
- For status, adapt implementation plan and make completed, active, blocked,
  and next work explicit.

## HTML Quality Bar

- The page should reduce reading effort. If it is just paragraphs in a browser, use chat instead.
- Use layout to encode meaning: columns for comparison, timelines for time, arrows for flow, badges for state, tables for repeated facts.
- Keep the first viewport useful. The user should see the answer, not only a title.
- Use plain CSS and semantic HTML. Add JavaScript only when interaction helps.
- Keep generated assets local. Inline SVG is fine for diagrams.
- Couple a claim with its evidence or inspectable example.
- Hide only optional detail. Recommendations, required evidence, and next
  actions stay visible.
- Reflow at 320 CSS pixels. Code and tables may scroll inside their own
  containers; the page must not.
- Use a text label or shape as well as color for status.
- Keep controls at least 44px in the dimension the user must target.
- Support reduced motion and printable output.
