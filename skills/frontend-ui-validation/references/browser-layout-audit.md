# Layout evidence

`skill-audit-layout` uses Playwright already installed in the current project. It writes screenshots and `captures.json` with the requested state, final URL, capture time, viewport, console errors, layout findings, and capture failures. `--storage-state <private-file>` supplies an existing authorized login state; it does not authorize creating or changing a login.

Navigation waits for DOM content, not an idle network. Use `--wait-for <selector>` for the visible element that establishes the page's ready state. `--timeout-ms` bounds navigation, readiness, and screenshot operations (default 30000). A failed capture stays in the report, later requested captures still run, and the command exits unsuccessfully. A screenshot without a readiness selector does not establish that asynchronous content finished loading.

The measurements flag page overflow, clipped text, overlapping boxes, off-screen elements, and small controls. They are candidates to inspect, not automatic failures: intentional overlays, scrolling content, ellipsis, and inline links can be legitimate. The 44px target warning is a generous touch heuristic, not a complete accessibility audit.

URL states are separate navigations, not interaction scripts. For menus, dialogs, transitions, or authenticated flows that require actions, exercise them with the available approved browser tools. Capture the resulting state and inspect the relevant text, boxes, focus, and console.

Compare screenshots with a supplied design reference for composition and hierarchy. Read layout/style data when useful and exposed by the tool; report unavailable checks rather than inventing tool names.

Keep captures private when they contain user data. Persistent E2E tests belong to the project's test portfolio, not this ad-hoc capture helper.

Follow [Keep evidence useful](../SKILL.md#keep-evidence-useful). The helper does not supply build/revision, local changes or actual interaction outcomes automatically.
