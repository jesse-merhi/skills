---
name: frontend-ui-validation
description: 'Validate rendered frontend UI with Playwright screenshots, bounding boxes, console checks, layout audits, responsive states, interaction states, and Figma or reference comparisons. Use after visible web UI changes; use repo-owned native proof for Expo and React Native screens.'
---

# Frontend UI Validation

This is a visual gate, not a vibe check. A screenshot by itself is not
validation.

Use this to prove that rendered UI has no obvious layout failures: horizontal
overflow, clipped text, sibling overlap, tiny tap targets, console errors,
broken responsive states, weak hierarchy, generic visual scaffolding, or
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
   still apply to web-rendered surfaces, but native screens need simulator proof
   from the mobile app itself.

7. For Figma, mockup, reference, theme, density, auth, or operational-app
   comparisons, read
   [references/design-specific-checks.md](references/design-specific-checks.md).

8. Fix every real `error` and `warning` before claiming done. If a finding is
   intentional, explain why. Re-run the same viewport and state after each fix.

## Done Means

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
