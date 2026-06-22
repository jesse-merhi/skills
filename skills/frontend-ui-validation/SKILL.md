---
name: frontend-ui-validation
description: 'Validate rendered frontend UI with Playwright screenshots, bounding boxes, console checks, layout audits, Impeccable anti-pattern detection, responsive states, and Figma/reference comparisons.'
---

# Frontend UI Validation

This is a visual gate, not a vibe check. A screenshot by itself is not
validation.

Use this to prove that the rendered UI has no obvious layout failures:
horizontal overflow, clipped text, sibling overlap, tiny tap targets,
console errors, broken responsive states, Impeccable anti-pattern
findings, or mismatch with the intended design direction.

This skill is for ad-hoc validation during a task. Persistent Playwright
specs belong in project testing skills.

For native React Native / Expo screens, use the app's mobile testing
skill first when one exists. Browser checks still apply to web-rendered
surfaces. Native screens need simulator proof from the mobile app itself.

## When to use

- After generating or modifying UI code.
- Before telling the user visual work is done.
- When the user reports wrapping, clipping, overlap, odd spacing, or
  mobile breakage.
- When comparing against Figma, a mockup, or a screenshot.
- Before a commit that touches any rendered UI

## Required Loop

1. Start the app with the repo's normal dev command.
2. Open the changed page in a real browser.
3. Check the page at these widths unless the task gives better targets:
   - 390 x 844
   - 768 x 1024
   - 1440 x 900
4. At each width, run the bundled layout audit script through
   Playwright:

```bash
node <skill-dir>/scripts/audit-layout.mjs <url>
```

5. Run Impeccable detection on the best available target:

```bash
npx --yes impeccable@3.0.3 detect <changed-ui-path-or-url> --json
```

Prefer the running URL when the dev server is available, because the
rendered page catches more than static files. If the URL scan is blocked
by missing browser dependencies, scan the changed UI files or directories.
Treat every finding as a review queue item: fix it, or explain why it is
intentional for this product.

6. If MCP browser tools are available, also use:
   - `browser_resize`
   - `browser_snapshot` with `boxes: true`
   - `browser_take_screenshot`
   - `browser_console_messages` with `level: "error"`
   - `browser_evaluate` for targeted computed-style checks
7. Fix every real `error`, `warning`, and Impeccable finding before
   claiming done. If a finding is intentional, explain why.
8. Re-run the same width and Impeccable target after each fix.

## What The Script Catches

- document-level horizontal overflow
- element content overflow via `scrollWidth/clientWidth` and
  `scrollHeight/clientHeight`
- visible sibling overlaps
- clipped or cramped text containers
- buttons, links, and form controls smaller than 44 x 44 CSS pixels
- visible elements outside the viewport
- console errors

## What Impeccable Catches

- generic AI UI tells such as gradient text, side-stripe cards, and
  repeated decorative scaffolding
- weak typography, flat hierarchy, long line lengths, and tiny text
- poor contrast, washed-out muted text, and default color reflexes
- over-carded layouts, nested cards, monotonous spacing, and crowded UI
- dated or risky motion patterns such as bounce easing and layout
  property transitions

The script is intentionally conservative. Treat its output as a review
queue. Do not dismiss findings without looking at the element, text, and
box values.

## MCP Checks

When using Playwright MCP directly:

- `browser_snapshot({ boxes: true })`: use bounding boxes to inspect
  visible structure and obvious collisions.
- `browser_take_screenshot({ fullPage: true, type: "png" })`: use for
  visual review and final evidence.
- `browser_evaluate`: inspect computed styles, layout metrics, and DOM
  state. Reading is allowed. Temporary DOM fixes are not.
- `browser_console_messages({ level: "error" })`: required before
  claiming done.

If a screenshot and the layout audit disagree, trust the measured DOM
first and inspect the screenshot to decide whether the measured issue is
real.

## Native Expo Checks

When the changed UI is a native Expo screen:

- Start the app through the repo's normal mobile command. Prefer the
  repo-owned mobile/dev skill when one exists.

- Use local Expo MCP tools when available for simulator screenshots,
  visible tree / selector inspection, taps, and app logs.
- Prefer stable `testID` / accessibility selectors over coordinates.
- Validate the changed native state at phone dimensions in the
  simulator. Check the reachable loading, empty, error, and long-content
  states the task touched.
- Run `npx --yes impeccable@3.0.3 detect` on changed source files or
  directories, because URL scanning may not apply to native screens.
- Do not use remote EAS build, update, workflow, or account-log MCP
  tools for visual validation unless the user explicitly asks for remote
  Expo work.

For native Expo work, final evidence should include simulator/device,
screen or route tested, screenshot path when captured, app log status,
selector/state checks performed, and Impeccable detection result.

## Design-Specific Checks

If the UI uses dark mode, theme variants, density modes, or auth/empty
states, validate each one the user can reasonably reach.

For Figma/mockup/reference work:

1. Read the reference first.
2. Identify the 5-10 visual facts that matter: layout, hierarchy,
   spacing, type, color, and key states.
3. Use `browser_evaluate` or computed styles to compare values where
   possible.
4. Use screenshots for composition and visual mismatch.

For operational apps, look especially for:

- table/header/body misalignment
- badges or labels clipping in narrow cells
- long names/emails wrapping badly
- sticky bars covering content
- empty states that shove controls off-screen
- modals too tall for mobile

## Anti-patterns

| Anti-pattern | Why it's wrong | What to do instead |
|---|---|---|
| One screenshot at desktop width | Misses mobile and tablet failures | Run the audit at all required widths |
| "Looks fine" | Not evidence | Report audit counts and screenshot paths |
| Ignoring script warnings | The exact failure the user cares about often appears there | Inspect each warning and fix or justify |
| Skipping Impeccable detection | Misses design anti-patterns that the DOM audit does not measure | Run `npx --yes impeccable@3.0.3 detect` on the URL or changed UI files |
| Fixing with `browser_evaluate` DOM mutation | It disappears on reload | Edit source files |
| Checking only happy state | Empty/error/loading states often break layout | Validate reachable states |

## Done Means

Final response must include evidence like:

```text
390x844: 0 errors, 0 warnings
768x1024: 0 errors, 1 warning intentionally left: <reason>
1440x900: 0 errors, 0 warnings
Console: 0 errors
Impeccable: 0 findings
Screenshots: <paths>
```

If the audit script could not run, say that and report which MCP checks
or manual checks replaced it.

For native Expo screens, replace browser-width audit lines with the
native evidence listed above. Do not claim browser layout audit coverage
for a screen that only rendered in the simulator.
