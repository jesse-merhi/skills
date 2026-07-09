# Impeccable Detection

Run Impeccable detection on the best available target:

```bash
npx --yes impeccable@3.2.0 detect <changed-ui-path-or-url> --json
```

Prefer the running URL when the dev server is available, because the rendered
page catches more than static files. If the URL scan is blocked by missing
browser dependencies, scan the changed UI files or directories.

Treat every finding as a review queue item: fix it, or explain why it is
intentional for this product.

Impeccable catches:

- generic AI UI tells such as gradient text, side-stripe cards, and repeated
  decorative scaffolding
- weak typography, flat hierarchy, long line lengths, and tiny text
- poor contrast, washed-out muted text, and default color reflexes
- over-carded layouts, nested cards, monotonous spacing, and crowded UI
- dated or risky motion patterns such as bounce easing and layout property
  transitions
