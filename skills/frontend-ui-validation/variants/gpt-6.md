---
name: frontend-ui-validation
description: 'Validate behaviour of web or native UI through real interactions, screenshots, and layout evidence.'
---

# UI validation

Exercise the changed UI and inspect behaviour, appearance, and relevant states.

## Web

Use the repository's normal launch workflow and the session's approved browser tools.

Check relevant loading, empty, error, keyboard, scrolling, and narrow-screen states. Inspect screenshots and console output for clipping, overlap, focus, and unreachable controls; compare composition, spacing, type, and colour with supplied references. Repair source when authorized, not the temporary DOM. For validation-only work, report evidence and recommended repairs without editing.

For repeatable URL-state captures, use the Playwright helper only if the project already has Playwright and the harness permits it:

```sh
skill-audit-layout <URL> --state <name>=<URL> --viewport 390x844 --wait-for <ready-selector> --output-dir <new-directory>
```

Use `--help` for controls. Exercise menus, dialogs, forms, and transitions through real interactions.

## Native

Follow [Native checks](references/native-expo.md) for the changed native flow.

## Keep evidence useful

Record build or revision, local changes, environment, viewport or device, interaction, expected and observed results, and capture paths. Include failures and unavailable checks. Screenshots show appearance; recordings help show motion and interaction. Layout warnings and tests do not prove visual quality.

Reuse those evidence paths and coverage notes in downstream tickets, reviews, and proof-pack work.

## Record proof environments

Record the simulators, emulators, dev servers, bundlers and Compose stacks this task starts, their ownership evidence, identifiers and stop commands in the evidence notes. Saving proof or finishing a validation step does not complete a larger task; keep its environments running and pass this record to whoever completes the task.

For a standalone validation request, release runtimes this task started only after validation is complete and proof is saved. Follow [cleanup](../cleanup/SKILL.md)'s ownership, scoped stopping and verification rules using the repository's stop command or the exact resource's native stop command. Preserve worktrees, branches, files, volumes, reusable data, other sessions' resources and environments the user still needs for manual testing. Report stopped resources, stop failures and anything retained with its reason.

## References

- [Layout evidence](references/browser-layout-audit.md): Use for the capture helper's output and limitations.
