---
name: frontend-ui-validation
description: 'Validate web UI with Playwright screenshots, layout checks, responsive states, and reference comparisons.'
---

# Frontend UI validation

Deliver rendered evidence for the changed UI's required states and viewport
matrix, with every real error and warning resolved or reported. Keep this an
ad-hoc validation task; do not add speculative states, persistent test suites,
or verifier agents.

Start the app with its normal repository command and open the changed page in
a real browser. Unless better targets are supplied, cover 390×844, 768×1024,
and 1440×900, including reachable empty, error, and loading states. Run at each width:

```bash
node <skill-dir>/scripts/audit-layout.mjs <url>
```

Use [browser-layout-audit.md](references/browser-layout-audit.md) to interpret
the audit and [mcp-browser-checks.md](references/mcp-browser-checks.md) for direct
screenshot, box, console, and style checks. Inspect the actual element/text/box
behind warnings. Examine overflow, clipping, overlap, tap targets, console errors,
responsiveness, hierarchy, filler, and design direction. Inspect close detail
when needed while retaining the complete layout view.

Native React Native/Expo screens use [native-expo.md](references/native-expo.md)
and simulator evidence from the mobile app, not browser-only proof. Apply
[design-specific-checks.md](references/design-specific-checks.md) for Figma,
mockup, reference, theme, density, auth, or operational-app comparisons.

When implementation is authorized, repair source and rerun the same affected
state and viewport. Otherwise return evidence and recommended fixes without
source edits. Do not count live DOM mutation as a repair. Discover genuine UI
failures before selecting the report; brevity must not hide a real warning.

Return compact proof such as:

```text
390x844: 0 errors, 0 warnings
768x1024: 0 errors, 1 warning intentionally left: <reason>
1440x900: 0 errors, 0 warnings
Console: 0 errors
Screenshots: <paths>
```

If the script did not run, name replacement MCP/manual checks. Replace browser
lines with native Expo evidence for simulator screens; never imply browser
coverage from native rendering. These checks and repair reruns are the completion
gate; a screenshot or a generic final verification pass is not a substitute.
