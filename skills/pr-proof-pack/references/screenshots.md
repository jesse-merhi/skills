# Practical Visual Evidence

## Contents

- [Hard Requirement](#hard-requirement)
- [Interactive Browser Upload Path](#interactive-browser-upload-path)
- [Evidence Contract](#evidence-contract)
- [UI Interaction Proof](#ui-interaction-proof)
- [Backend and Operator Proof](#backend-and-operator-proof)
- [Performance Proof](#performance-proof)
- [Placement](#placement)

## Hard Requirement

Capture and upload every evidence item selected in `proof-selection.md`. This
file owns how to capture and publish that evidence; `proof-selection.md` owns
what qualifies.

If the selected interactive browser, practical capture, screen recording,
provider login, attachment upload, image rendering, or video playback fails,
stop before creating or updating the PR. Tell the human the concrete failure
and ask them to restore the blocked capability. Continue only after it works.

## Interactive Browser Upload Path

Use the browser path selected during the preflight. Do not switch to an
unapproved browser-control tool, a standalone upload helper, browser-cookie
extraction, `gh-image`, session tokens, or Keychain/browser cookie stores.

Before any PR mutation:

1. In OpenClaw, use its browser tool or `openclaw browser`. Check
   `openclaw browser --json status` and `openclaw browser profiles` when profile
   selection or login is unclear, then use the configured authenticated profile.
   In Claude environments, prefer the external `browser-use` skill and its
   pinned CLI when available; otherwise load `computer-use`.
2. With OpenClaw, open the repository through the selected browser profile. With
   Browser Use, open a fresh repository tab in the permitted Chrome-family
   browser and do not inspect unrelated tabs. With Computer Use, open an
   agent-owned browser window.
3. Reach the repository's PR provider and confirm the selected path can read and
   operate the page with the expected account.
4. If any part fails, stop and ask the human to repair that browser path or
   provider login.

### Explicit Upload Confirmation

Immediately before the first attachment upload or PR save, follow the selected
tool's native confirmation policy. If the active harness bypasses or lacks that
confirmation, use its structured question UI to ask the human for permission
for the named upload and save. Treat that answer as permission only for the
current proof refresh.

OpenClaw's native `browser upload` action is allowed because it operates the
provider's file input through the selected interactive browser.
CDP is acceptable only when it is transport behind that browser surface;
never use it to bypass login or extract credentials.

For a new PR, the publishing workflow may create a draft shell after this
preflight.

In OpenClaw, use the native browser file-input path:

1. Put each finished evidence file under the configured OpenClaw temporary
   uploads root, such as `/tmp/openclaw/uploads/<file>`, or use managed inbound
   media such as `media://inbound/<id>`. Do not expose an arbitrary local path.
2. Open the main PR body editor, place the insertion point at the exact
   placeholder or stale attachment, then run
   `openclaw browser --browser-profile <profile> snapshot` to resolve the
   visible attachment-trigger ref.
3. Run the atomic chooser path:
   `openclaw browser --browser-profile <profile> upload /tmp/openclaw/uploads/<file> --ref <upload-trigger-ref>`.
   If the snapshot exposes the actual `<input type=file>` instead, use
   `--input-ref <file-input-ref>`. The same modes accept managed inbound media.
4. Wait for the editor to replace the temporary marker with a provider-hosted
   attachment or playable-media reference.
5. Add descriptive alt text or a label, save, and inspect the rendered media
   through the same `--browser-profile <profile>`.

Use the same clipboard-first flow on GitHub, Bitbucket, and other PR editors in
Computer Use or another browser surface with clipboard support:

1. Copy the finished image or recording to the clipboard.
2. Open the main PR body editor.
3. Select the exact placeholder or stale attachment being replaced.
4. Paste once.
5. Wait for the editor to replace the temporary upload marker with a
   provider-hosted attachment or playable-media reference.
6. Add descriptive alt text or a label, save, and inspect the rendered media.

Do not click an attachment control or open a native file picker before trying
clipboard paste. When Browser Use cannot paste that media type, use its
`upload_file` helper on the provider's file input after explicit confirmation.
On GitHub, the finished reference normally uses `user-attachments`; on
Bitbucket or another provider, require its equivalent reviewer-visible hosted
media rather than a local path.

Do not commit proof media to the repository unless the project or user
explicitly requests that storage model.

## Evidence Contract

Every visual answers these questions in nearby text:

1. What current net-diff behavior does this visibly demonstrate?
2. What starting state, input, action, transition, and outcome appear?
3. What route, fixture, account, environment, viewport, dataset, and capture
   method make it reproducible?
4. What important error, recovery, persistence, or side effect was checked?

Use real output from the current branch. Before means the direct PR base, not a
previous feature-branch commit. Recapture after every related branch change.

## UI Interaction Proof

Record the changed flow manually at a deliberate pace. A reviewer should be able
to follow without scrubbing frame by frame.

- begin before the first relevant action so the starting state is visible;
- move the pointer deliberately and pause after important transitions;
- show the input, loading or transition state, outcome, and relevant recovery;
- exercise changed error, empty, permission, responsive, keyboard, or reduced-
  motion behavior when it is in scope;
- upload screenshots of every distinct changed state at readable size;
- use realistic data and avoid secrets or personal information.

A test runner video, a replay of automated E2E output, or static screenshots
alone do not replace the manual interaction walkthrough.

## Backend and Operator Proof

Show the changed system behavior, not the command that checked it:

- API: representative request, response, and persisted or rejected state;
- worker or queue: input event, processing outcome, and resulting side effect;
- migration: realistic dry run or execution plus changed records and rollback;
- infrastructure: operator action plus resulting resource or runtime state;
- test-only: the running product scenario the test now protects.

Terminal screenshots remain useful when they show the real request and outcome.
A terminal showing only a test, build, validator, or success exit code is not
evidence.

## Performance Proof

Show the experience or system becoming faster, smaller, or more stable:

- capture comparable before/after traces, recordings, charts, or visible timing;
- use the same hardware, environment, dataset, cache state, scenario, and tool;
- report the measurement method and sample size;
- include representative values and variability, not only the best run;
- add a Markdown comparison table beside the visual.

Example:

| Scenario | Base median | PR median | Change | Samples |
| --- | ---: | ---: | ---: | ---: |
| Dashboard ready | 2.4 s | 1.5 s | 37.5% faster | 20 |

## Placement

Put each image and recording directly in the main PR body, never in a table or
detached comment. Place its explanation immediately below it:

```md
<uploaded interaction recording>

**What this shows:** Saving an invalid supplier stops at the form, explains the
phone-number error, and keeps the entered values available for correction.

**State:** Local seeded supplier account; desktop viewport; manual interaction
recorded at deliberate pace on the current PR branch.
```

Use descriptive alt text and labels. Keep reproduction steps copyable. Let
GitHub's checks report routine automated validation.
