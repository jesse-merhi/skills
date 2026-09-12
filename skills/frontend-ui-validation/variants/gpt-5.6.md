---
name: frontend-ui-validation
description: 'Validate behaviour of web or native UI through real interactions, screenshots, and layout evidence.'
---

# UI validation

Exercise the changed UI and inspect its behaviour, appearance, and relevant states. After resolving a setup problem, resume the requested interaction and check its outcome; a ready browser, emulator or app is only the starting point for that proof.

## Web

Use the repository's normal launch workflow and the session's approved browser tools. In Codex use its browser tools; in Claude use the available Chrome integration.

Check relevant loading, empty, error, keyboard, scrolling, and narrow-screen states. Inspect screenshots and console output for clipping, unintended overlap, focus, or unreachable controls. Compare composition, spacing, type, and colour with any supplied reference. When the task authorizes repair, fix source rather than a temporary DOM edit. For validation-only work, report the evidence and recommended source repair without editing.

For repeatable URL-state captures, use the existing Playwright helper only when the project already has Playwright and the harness permits it:

```sh
skill-audit-layout <URL> --state <name>=<URL> --viewport 390x844 --wait-for <ready-selector> --output-dir <new-directory>
```

Use `--help` for controls. Make sure to exercise menus, dialogs, forms, or transitions with real interactions.

## Native

Follow [Native checks](references/native-expo.md) for the changed native flow.

## Keep evidence useful

Record the build or revision, relevant local changes, environment, web viewport or native device, interaction, expected and observed outcomes, and capture paths. Include failures and unavailable checks. Screenshots prove appearance; recordings help prove motion and interaction. Layout warnings and passing tests support that evidence but do not establish visual quality.

Share the same evidence paths and coverage notes with downstream tickets, reviewers, and proof-pack work.

## References

- [Layout evidence](references/browser-layout-audit.md): Use for the capture helper's output and limitations.
