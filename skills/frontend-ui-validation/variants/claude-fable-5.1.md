---
name: frontend-ui-validation
description: 'Validate web UI with Playwright screenshots, layout checks, responsive states, and reference comparisons.'
---

# Frontend UI validation

Validate the changed interface in the rendered app. Cover the requested states
and widths, not just a desktop happy-path screenshot. This workflow is ad-hoc;
use project testing skills for persistent Playwright specs.

1. Start the app with its normal repository dev command and open the changed
   page in a real browser. Unless the task gives better targets, use 390×844,
   768×1024, and 1440×900. Include reachable empty, error, and loading states.
2. At each width run:

   ```bash
   node <skill-dir>/scripts/audit-layout.mjs <url>
   ```

   Read [browser-layout-audit.md](references/browser-layout-audit.md). Inspect
   each warning's element, text, and box values before judging it.
3. Use direct checks from [mcp-browser-checks.md](references/mcp-browser-checks.md)
   when available. Batch independent screenshots and measurements. Inspect
   overflow, clipped text, overlap, tiny tap targets, console errors, responsive
   failures, hierarchy, generic filler, and design-direction mismatch. Zoom or
   crop details when needed, retaining whole-page context.
4. For native React Native/Expo screens, follow
   [native-expo.md](references/native-expo.md) and capture simulator proof from
   the mobile app. Use browser checks only for web-rendered screens. For Figma,
   mockup, reference, theme, density, auth, or operational-app comparisons,
   read [design-specific-checks.md](references/design-specific-checks.md).
5. Report every real error and warning. If fixes are authorized, edit source
   and rerun the affected viewport and state. Do not repair by mutating the live
   DOM. For validation-only work, return evidence and a recommendation without edits.
6. Show counts, console status, screenshot paths, and reasons for retained issues:

   ```text
   390x844: 0 errors, 0 warnings
   768x1024: 0 errors, 1 warning intentionally left: <reason>
   1440x900: 0 errors, 0 warnings
   Console: 0 errors
   Screenshots: <paths>
   ```

If the script cannot run, say so and identify replacement MCP/manual checks.
For native Expo, use the native reference's evidence instead of browser-width
lines. Do not claim browser coverage for a simulator-only screen. During long
work, report new visual evidence, a changed direction, or a blocker.
