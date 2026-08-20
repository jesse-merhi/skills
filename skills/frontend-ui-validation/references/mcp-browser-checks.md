# MCP browser checks

When using a browser MCP connector directly, use the tool names exposed in the
current session. Do not assume older unprefixed Playwright MCP names such as
`browser_evaluate` are available. Some agent tools expose prefixed browser
tools; others expose browser control through `node_repl` plus Playwright.

Required checks, regardless of tool spelling:

- Resize to each required viewport before inspecting.
- Capture a screenshot for visual review and final evidence.
- Capture a structural snapshot or bounding-box data when the connector exposes
  it.
- Inspect computed styles, layout metrics, and DOM state through a read-only
  browser evaluation mechanism when available.
- Read console messages and confirm there are no errors before claiming done.

Rules:

- Reading DOM/layout state is allowed.
- Temporary DOM fixes are not proof. Fix source files instead.
- If a screenshot and the layout audit disagree, trust the measured DOM first
  and inspect the screenshot to decide whether the measured issue is real.
- If no MCP browser connector exposes the needed read-only checks, use the
  bundled layout audit script or Node-backed Playwright instead.
