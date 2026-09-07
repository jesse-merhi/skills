# Choosing a page shape

The files in `assets/patterns/` are starting points, not mandatory formats.

| Reader's question | Example |
| --- | --- |
| Which option should we choose? | `decision-brief.html`: compare shared criteria and explain the recommendation |
| How does it work? | `code-flow.html`: follow the input through code to its observable result |
| What happened? | `incident-report.html`: show impact, timeline, cause, and recovery |
| What if something changes? | `interactive-model.html`: vary an input and show the consequence |
| Teach me this concept | `concept-lesson.html`: explain it through a worked example |
| What happens next? | `implementation-plan.html`: show dependencies, decisions, and proof |
| What changed in this PR? | `annotated-diff.html`: explain the real patch beside its code |

Use `assets/explanation-template.html` when none fits. Replace sample content, remove unused sections, and keep the output standalone.

Layout should express the relationship: comparison columns, a time sequence, a code flow, or repeated facts in a table. Add interaction only when it helps the reader inspect a claim or explore an assumption.
