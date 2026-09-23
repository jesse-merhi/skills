---
name: html-explanations
description: 'Create a standalone HTML explanation when a visual or interactive page makes the subject easier to understand.'
---

# HTML explanations

Answer the question, then show the flow, comparison, example, or evidence. Use a page when structure or interaction helps more than chat.

Create one local HTML file with inline CSS and JavaScript; no build step or remote runtime.

Place explanations beside relevant code, outside source comments. Preserve exact source and evidence; hide only optional detail. A PR explanation is not a review authorization.

Use readable line lengths, clear hierarchy, keyboard-accessible controls, and colour plus text for status. Reflow at 320px; contain scrolling for wide code and tables. Style `pre code` separately from inline code. Respect reduced motion; if printing matters, preserve the argument in print layout.

Inspect rendering, interactions, console, and narrow layout; inspect print layout if needed. Keep private content and assets local. Return the file link, brief explanation, and verification gaps.

## References

- [Pattern guide](references/html-effectiveness-patterns.md): Use for reusable examples when creating the page; adapt them freely and remove irrelevant sections.
- [Diff walkthroughs](references/pr-diff-walkthrough.md): Use for PR and stack reading.
- [Source research](references/html-explanation-patterns.md): When changing the templates themselves, consult their source research.
