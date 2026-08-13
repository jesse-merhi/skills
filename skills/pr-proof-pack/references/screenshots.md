# Visual Evidence

## Contents

- [Hard Requirement](#hard-requirement)
- [Computer Use Upload Path](#computer-use-upload-path)
- [Evidence Contract](#evidence-contract)
- [Terminal and Non-UI Evidence](#terminal-and-non-ui-evidence)
- [Placement](#placement)
- [Before and After](#before-and-after)

## Hard Requirement

Every PR must include at least one useful, uploaded screenshot in its main body.
This includes terminal, backend, infrastructure, documentation, dependency,
configuration, and test-only changes. UI changes need screenshots of every
distinct changed state or surface.

Local paths, text saying a check passed, and a reason for omitting screenshots
do not satisfy this requirement. If Computer Use, capture, GitHub login, the
attachment control, or final image rendering fails, stop before creating or
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
preflight. Then upload each evidence file through GitHub's normal attachment UI:

1. Open the PR in the agent-owned browser.
2. Attach the screenshot through the PR comment box or drag-and-drop area.
3. Wait for GitHub to insert a
   `https://github.com/user-attachments/assets/...` Markdown image reference.
4. Copy that Markdown into the main PR body without submitting a comment.
5. Save the PR body, open the rendered view, and confirm the image loads at a
   readable size with its caption directly below it.

Follow the active Computer Use confirmation policy at the actual upload step.
Do not commit proof screenshots to the repository unless the project or user
explicitly requests that storage model.

## Evidence Contract

Every screenshot answers these questions in the body:

1. What current net-diff behavior or result does this prove?
2. What exact route, state, fixture, command, environment, viewport, and crop
   produced it?
3. Why is this the clearest visual evidence for the claim?

Prefer the smallest readable capture:

1. **Element crop** for a card, row, panel, modal, form, or error.
2. **Terminal region crop** for a command and its focused result.
3. **Viewport crop** when surrounding controls or context explain the state.
4. **Full-page capture** only when page-wide layout, ordering, pagination, or
   below-the-fold content is part of the proof.

Use real output from the current branch. Do not use mockups, generated stand-ins,
or evidence captured before a related branch change.

## Terminal and Non-UI Evidence

A terminal screenshot is valid and required evidence for non-UI work. Make it
easy to read:

- show the focused command and the line or small result block that proves the
  claim;
- use a readable font size and crop away unrelated shell history and chrome;
- include enough context to distinguish success from a command that merely ran;
- redact or avoid secrets, tokens, private URLs, personal data, and noisy logs;
- keep the command and expected result as copyable text in the PR body;
- capture current output after the final branch change.

Examples include a targeted test with the behavior named in its output, a
request and response, a migration dry-run summary, a rendered-document check, or
a focused diff/validator result. A wall of green test output is weaker than one
small result tied to the PR's main claim.

## Placement

Put each image directly in the main PR body, never in a table or detached
comment. Place its explanation immediately below it:

```md
![Install sorting check passes](https://github.com/user-attachments/assets/...)

**What this shows:** The focused browser test confirms install sorting renders
production rows in descending order.

**State:** `npm test -- install-sort`, current PR branch, terminal region crop.
```

Use human labels and descriptive alt text. The uploaded file name is not a
caption.

## Before and After

Before means direct-base behavior, not the previous feature-branch commit.

- Before = direct base or production when it matches that base.
- Now = current PR branch.
- If base and branch now match, remove the before/after claim.
- If a true before capture is impractical, say what was captured and why.
- After any related branch change, recapture and replace stale evidence.
