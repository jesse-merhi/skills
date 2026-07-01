# Native Expo Checks

When the changed UI is a native Expo screen:

- Start the app through the repo's normal mobile command. Prefer the repo-owned
  mobile/dev skill when one exists.
- Use local Expo MCP tools when available for simulator screenshots, visible
  tree / selector inspection, taps, and app logs.
- Prefer stable `testID` / accessibility selectors over coordinates.
- Validate the changed native state at phone dimensions in the simulator. Check
  the reachable loading, empty, error, and long-content states the task touched.
- Run `npx --yes impeccable@3.0.3 detect` on changed source files or
  directories, because URL scanning may not apply to native screens.
- Do not use remote EAS build, update, workflow, or account-log MCP tools for
  visual validation unless the user explicitly asks for remote Expo work.

For native Expo work, final evidence should include simulator/device, screen or
route tested, screenshot path when captured, app log status, selector/state
checks performed, and Impeccable detection result.
