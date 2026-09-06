---
name: frontend-ui-validation
description: 'Validate behaviour of web or native UI through real interactions, screenshots, and layout evidence.'
---

# UI validation

Validate the changed UI behaves appropriately.

## Web

Use the repository's normal launch workflow and the session's approved browser tools. In Codex use its browser tools; in Claude use the available Chrome integration.

Check relevant loading, empty, error, keyboard, scrolling, and narrow-screen states. Inspect screenshots and console output for clipping, unintended overlap, focus, or unreachable controls. Compare composition, spacing, type, and colour with any supplied reference. Fix source, not a temporary DOM edit.

For repeatable URL-state captures, use the existing Playwright helper only when the project already has Playwright and the harness permits it:

```sh
skill-audit-layout <URL> --state <name>=<URL> --viewport 390x844 --wait-for <ready-selector> --output-dir <new-directory>
```

Use `--help` for controls. Make sure to exercise menus, dialogs, forms, or transitions with real interactions.

## Native

Follow [Native checks](references/native-expo.md) for the changed native flow.

## Keep evidence useful

Record the build or revision and relevant local changes, environment, web viewport or native device, interaction, expected and observed outcome, and capture paths. Include failures and unavailable checks. Screenshots prove appearance; recordings help prove motion and interaction. Layout warnings and passing tests support that evidence but do not establish visual quality.

Give downstream tickets, reviewers, and proof-pack work the same evidence paths and coverage notes.

## References

- [Layout evidence](references/browser-layout-audit.md): Use for the capture helper's output and limitations.
