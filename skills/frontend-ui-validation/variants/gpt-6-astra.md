---
name: frontend-ui-validation
description: 'Validate web UI with Playwright screenshots, layout checks, responsive states, and reference comparisons.'
---

# Frontend UI validation

Establish whether the changed rendered UI works and communicates at the required
states and viewport sizes. Resolve routine test targets from the request and
repository; keep source edits within existing implementation authority.

## Choose the real rendering surface

Start the app normally and open the changed page in a browser. Default to
390×844, 768×1024, and 1440×900 unless the task provides better targets. Include
reachable empty, error, and loading states. Native React Native/Expo screens
instead require mobile-app simulator proof under
[native-expo.md](references/native-expo.md); browser proof covers web-rendered
screens only. Apply [design-specific-checks.md](references/design-specific-checks.md)
for Figma, mockup, reference, theme, density, auth, and operational-app comparisons.

## Establish and resolve findings

At each browser width, run the bundled Playwright layout audit:

```bash
node <skill-dir>/scripts/audit-layout.mjs <url>
```

Read [browser-layout-audit.md](references/browser-layout-audit.md) for interpretation
and [mcp-browser-checks.md](references/mcp-browser-checks.md) for direct screenshots,
boxes, console, and styles. Inspect warning elements, text, and box values.
Check overflow, clipping, sibling overlap, small tap targets, console errors,
responsive states, hierarchy, filler, and design-direction mismatch.

Report all real errors and warnings. If implementation was requested, fix the
source and rerun the affected state/width without a redundant permission question.
If not, provide evidence and recommendations without editing. Live DOM mutation
is not a source fix.

## Finish with observable evidence

Show per-viewport error/warning counts, console status, screenshot paths, and
reasons for any retained warning. For example:

```text
390x844: 0 errors, 0 warnings
768x1024: 0 errors, 1 warning intentionally left: <reason>
1440x900: 0 errors, 0 warnings
Console: 0 errors
Screenshots: <paths>
```

Disclose an unavailable script and its replacement MCP/manual checks. Native
Expo evidence replaces browser-width audit claims. Complete the required matrix
and resolve or report every finding; expand checks only for a remaining concern.
This ad-hoc workflow does not create persistent Playwright specs, and a screenshot
alone is insufficient proof.
