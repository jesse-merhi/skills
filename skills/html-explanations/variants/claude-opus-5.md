---
name: html-explanations
description: 'Create a standalone HTML explanation when a visual or interactive page makes the subject easier to understand.'
---

# HTML explanations

Answer the reader's question, then show the flow, comparison, example, or evidence that makes the answer clear. Use a page when its structure or interaction helps more than chat.

Create one local HTML file with inline CSS and JavaScript, without a build step or remote runtime.

Put code explanations beside the relevant code, visibly separate from source comments. Preserve exact source and evidence; hide only optional detail. Explaining a PR is not authority to review it.

Use readable line lengths, clear hierarchy, keyboard-accessible controls, and colour plus text for status. Reflow at 320px; let wide code and tables scroll within their containers. Give `pre code` its own style so inline-code pills don't leak into blocks. Respect reduced motion and keep the argument intact when printed.

Inspect the rendered page, its interactions, console, and narrow layout. Keep private content and assets local. Return the file link, a short explanation, and anything you couldn't verify.

## References

- [Pattern guide](references/html-effectiveness-patterns.md): Use for reusable examples when creating the page; adapt them freely and remove irrelevant sections.
- [Diff walkthroughs](references/pr-diff-walkthrough.md): Use for PR and stack reading.
- [Source research](references/html-explanation-patterns.md): When changing the templates themselves, consult their source research.
