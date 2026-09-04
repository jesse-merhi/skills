---
name: frontend-ui-validation
description: 'Validate web UI with Playwright screenshots, layout checks, responsive states, and reference comparisons.'
---

# Frontend UI validation

Outcome: prove that the rendered UI works and communicates at the required
states and viewport sizes. A screenshot alone is not validation; inspect for
horizontal
overflow, clipped text, sibling overlap, tiny tap targets, console errors,
broken responsive states, weak hierarchy, generic visual filler, or
mismatch with the intended design direction.

This skill is for ad-hoc validation during a task. Persistent Playwright specs
belong in project testing skills.

## Workflow

1. Start the app with the repo's normal dev command.

2. Open the changed page in a real browser.

3. Check the page at these widths unless the task gives better targets:

   - 390 x 844
   - 768 x 1024
   - 1440 x 900

4. At each width, run the bundled layout audit script through Playwright:

   ```bash
   node <skill-dir>/scripts/audit-layout.mjs <url>
   ```

   Read [references/browser-layout-audit.md](references/browser-layout-audit.md)
   for what the script catches and how to treat warnings.

5. Use direct browser/MCP checks when available.

   Read [references/mcp-browser-checks.md](references/mcp-browser-checks.md)
   for screenshot, bounding-box, console, and computed-style checks.

6. For native React Native / Expo screens, switch to native proof.

   Read [references/native-expo.md](references/native-expo.md). Browser checks
   still apply to web-rendered screens, but native screens need simulator proof
   from the mobile app itself.

7. For Figma, mockup, reference, theme, density, auth, or operational-app
   comparisons, read
   [references/design-specific-checks.md](references/design-specific-checks.md).

8. Report every real `error` and `warning`. If implementation is authorized,
   fix each finding and re-run the same viewport and state. Otherwise, return
   the evidence and recommended fix without editing source.
   Finish once required states and viewports are covered and every finding is
   resolved or reported; broaden validation only for a remaining concern.

## Done means

Final response must include evidence like:

```text
390x844: 0 errors, 0 warnings
768x1024: 0 errors, 1 warning intentionally left: <reason>
1440x900: 0 errors, 0 warnings
Console: 0 errors
Screenshots: <paths>
```

If the audit script could not run, say that and report which MCP checks or
manual checks replaced it.

For native Expo screens, replace browser-width audit lines with the native
evidence from `references/native-expo.md`. Do not claim browser layout audit
coverage for a screen that only rendered in the simulator.

## Avoid

- checking only desktop width;
- saying "looks fine" without audit counts and screenshot paths;
- ignoring script warnings without inspecting the element, text, and box values;
- fixing by mutating the live DOM through browser automation instead of editing
  source files;
- checking only the happy state when empty/error/loading states are reachable.
