# Practical Visual Evidence

## Contents

- [Hard Requirement](#hard-requirement)
- [Computer Use Upload Path](#computer-use-upload-path)
- [Evidence Contract](#evidence-contract)
- [UI Interaction Proof](#ui-interaction-proof)
- [Backend and Operator Proof](#backend-and-operator-proof)
- [Performance Proof](#performance-proof)
- [Placement](#placement)

## Hard Requirement

Every PR must include uploaded visual evidence of the implemented behavior
working in practice. Every PR needs at least one screenshot. UI interactions
also need a deliberately paced manual walkthrough video.

Tests, builds, CI, coverage, lint, type-check, validator output, green
checkmarks, and screenshots of those results are supporting checks, not
behavioral evidence. Leave routine pass lists in GitHub's checks instead of
repeating them in the PR body. They cannot satisfy `Visual proof`. Code, diffs,
diagrams, mockups, and generated stand-ins also cannot prove that the
implementation ran.

If Computer Use, practical capture, screen recording, GitHub login, attachment
upload, image rendering, or video playback fails, stop before creating or
updating the PR. Tell the human the concrete failure and ask them to restore the
blocked capability. Continue only after it works.

## Computer Use Upload Path

Computer Use is mandatory. Do not replace it with CDP, another browser-control
tool, a CLI upload helper, browser-cookie extraction, `gh-image`, session tokens,
or Keychain/browser cookie stores.

Before any PR mutation:

1. Load `computer-use`.
2. Open an agent-owned browser window and reach the GitHub repository.
3. Confirm the tool can read and operate the page and that GitHub access works.
4. If any part fails, stop and ask the human to repair Computer Use or login.

For a new PR, the publishing workflow may create a draft shell after this
preflight. Upload each screenshot and recording through GitHub's attachment UI.
Wait for a reviewer-visible `user-attachments` reference, place it in the main
PR body without submitting a detached comment, save, and inspect the rendered
image or playable recording.

Follow the active Computer Use confirmation policy at the upload step. Do not
commit proof media to the repository unless the project or user explicitly
requests that storage model.

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
