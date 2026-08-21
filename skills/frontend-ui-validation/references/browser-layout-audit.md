# Browser layout audit

Run the bundled layout audit script through Playwright at each required width:

```bash
node <skill-dir>/scripts/audit-layout.mjs <url>
```

The script catches:

- document-level horizontal overflow
- element content overflow via `scrollWidth/clientWidth` and
  `scrollHeight/clientHeight`
- visible sibling overlaps
- clipped or cramped text containers
- buttons, links, and form controls smaller than 44 x 44 CSS pixels
- visible elements outside the viewport
- console errors

The script is intentionally conservative. Treat its output as a review queue.
Do not dismiss findings without looking at the element, text, and box values.

If a screenshot and the layout audit disagree, trust the measured DOM first and
inspect the screenshot to decide whether the measured issue is real.
