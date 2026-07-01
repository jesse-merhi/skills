# MCP Browser Checks

When using Playwright MCP directly:

- `browser_resize`: set each required viewport before inspecting.
- `browser_snapshot({ boxes: true })`: use bounding boxes to inspect visible
  structure and obvious collisions.
- `browser_take_screenshot({ fullPage: true, type: "png" })`: use for visual
  review and final evidence.
- `browser_evaluate`: inspect computed styles, layout metrics, and DOM state.
  Reading is allowed. Temporary DOM fixes are not.
- `browser_console_messages({ level: "error" })`: required before claiming
  done.

If a screenshot and the layout audit disagree, trust the measured DOM first and
inspect the screenshot to decide whether the measured issue is real.
