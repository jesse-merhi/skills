---
name: frontend-ui-validation
description: 'Validate web UI with Playwright screenshots, layout checks, responsive states, and reference comparisons.'
---

# Frontend UI validation

Prove the changed rendered UI works and communicates across required states and
viewports. This is ad-hoc task validation; persistent Playwright specs belong
to project testing workflows.

Start the app with the normal repository command and open the changed page in
a real browser. Unless the task supplies better targets, inspect 390×844,
768×1024, and 1440×900. Include reachable empty, error, and loading states.
At each width run the bundled layout audit through Playwright:

```bash
node <skill-dir>/scripts/audit-layout.mjs <url>
```

Read [browser-layout-audit.md](references/browser-layout-audit.md) to interpret
warnings and [mcp-browser-checks.md](references/mcp-browser-checks.md) for available
direct screenshot, bounding-box, console, and computed-style checks. Inspect
actual elements, text, and boxes behind warnings. Look for overflow, clipping,
sibling overlap, tiny tap targets, console errors, broken responsiveness, weak
hierarchy, generic filler, and mismatch with design direction.

For native React Native/Expo screens use [native-expo.md](references/native-expo.md)
and simulator proof from the mobile app. Browser checks apply only to web-rendered
screens. For Figma, mockup, reference, theme, density, auth, or operational-app
comparisons apply [design-specific-checks.md](references/design-specific-checks.md).

Report every real error and warning. With implementation authority, fix the
source and rerun the same viewport/state; never use live DOM mutation as the fix.
Without it, return evidence and the recommended fix without source edits.

Finish with counts, console status, screenshot paths, and reasons for retained
warnings, for example:

```text
390x844: 0 errors, 0 warnings
768x1024: 0 errors, 1 warning intentionally left: <reason>
1440x900: 0 errors, 0 warnings
Console: 0 errors
Screenshots: <paths>
```

If the script could not run, disclose that and identify replacement MCP/manual
checks. Native Expo evidence replaces browser-width lines; never claim browser
audit coverage from a simulator-only render. A screenshot alone or "looks fine"
is not a validation result.
