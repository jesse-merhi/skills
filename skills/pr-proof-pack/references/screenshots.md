# Screenshot Proof

## Contents

- [Upload Path](#upload-path)
- [Screenshot Contract](#screenshot-contract)
- [Screenshot Proof Table](#screenshot-proof-table)
- [Before/After Rule](#beforeafter-rule)

When a PR changes or makes reachable UI that a human reviewer can see, include
PR-visible screenshots for every distinct changed state or surface unless a
screenshot is impossible or genuinely unhelpful. Distinct states include
different changed pages, modals, forms, error/loading/empty states, responsive
states, permissions states, and important before/after contrasts.

Do not satisfy this requirement with local-only screenshot paths in `/tmp` or a
claim that a browser check passed. The image must be visible to a GitHub
reviewer from the PR body, or the PR body must say screenshots are missing and
why. If the harness cannot upload or host screenshots, stop before final PR
readiness and report that blocker instead of silently omitting them.

If a screenshot only proves that an unrelated route loads, omit it and explain
why no screenshot is needed for that unchanged UI.

## Upload Path

Screenshot upload path: use Computer Use in an agent-owned browser window and
GitHub's normal PR comment attachment UI. This is the required path when
Computer Use is available and the PR needs screenshots.

1. Open the PR in a fresh agent-owned browser window. Do not reuse existing
   user browser windows unless the user explicitly asks.
2. Confirm the browser is logged into GitHub and can comment on the PR.
3. Attach the screenshot file through the PR comment box attachment control or
   drag-and-drop area.
4. Wait for GitHub to insert a
   `https://github.com/user-attachments/assets/...` Markdown image reference.
5. Copy that Markdown into the PR body screenshot table without submitting a
   comment unless a comment is explicitly desired.

Use Computer Use confirmation policy for the actual file upload step. A PR
proof screenshot upload is a file upload to GitHub; if the user has not already
approved that exact upload destination and file class, confirm right before
uploading.

Do not use CLI upload helpers, browser-cookie extraction, `gh-image`,
`GH_SESSION_TOKEN`, Keychain-stored web sessions, or Dia/Chrome/Arc cookie
stores for PR screenshots. Do not cite those unsupported paths as the reason
screenshots are missing. If screenshots are required and Computer Use is
available, try the GitHub attachment UI before writing a "Screenshots missing"
note.

Mark screenshot upload blocked only when Computer Use is unavailable, GitHub
login/comment access is unavailable in the agent-owned browser, the GitHub
attachment UI cannot attach the file, or the user declines the upload
confirmation. Include that concrete blocker in the PR body.

## Screenshot Contract

Every screenshot needs a proof claim. Before adding one, answer:

1. What changed or risky behavior does this image prove?
2. Why is an image better than a command, API example, table, or Mermaid diagram?
3. What URL, fixture/user/state, viewport, and crop choice produced it?

If those answers are weak, remove the screenshot.

For human-visible UI changes, answer those questions in the PR body screenshot
table and include the screenshot unless it is blocked. A textual "browser proof
passed" line is useful supporting evidence, but it is not a replacement for the
required screenshot.

Default to the smallest readable image:

1. **Element crop** for a card, table row, panel, modal, form, or error.
2. **Viewport crop** when surrounding controls or nav explain the state.
3. **Full-page screenshot** only when below-the-fold content, page-wide layout,
   long-list ordering, or pagination is part of the proof.

Full-page screenshots require a sentence in the PR body explaining why full
height was needed. Otherwise crop them.

Use real app screenshots from a running instance. Do not use mockups, generated
HTML stand-ins, or composed images.

Screenshots must be accessible from the PR body, not only from the local
machine. Use the repository or harness-approved upload path for GitHub-hosted
images or another reviewer-accessible artifact URL. Do not commit screenshot
files to the repo unless the project or user explicitly wants that.

## Screenshot Proof Table

When screenshots are included, add a short table near them:

```md
| Screenshot | Claim Proved | URL / State | Viewport | Crop Choice |
| --- | --- | --- | --- | --- |
| Skills browse sorted by installs | Install sort renders prod rows in expected first-page order | `/skills?sort=installs&dir=desc`, prod Convex | 1440x900 | viewport crop; controls + first rows are both relevant |
```

Use human labels. Avoid file names like `screenshot-1.png` as the only
explanation.

For UI PRs with no screenshot table, add a short "Screenshots" note explaining
why the PR has no reviewer-visible screenshots. Acceptable reasons are narrow:
backend-only diff, no human-visible behavior changed, screenshot capture was
blocked by auth/fixture/tooling, Computer Use upload was unavailable or failed
for a concrete GitHub UI/login/attachment reason, or the screenshot would only
show unchanged UI. "Tests passed", "layout audit passed", or "no CLI upload
token/session was available" is not an acceptable reason by itself.

## Before/After Rule

Before means PR base behavior, not the previous PR-branch commit.

- Before = base branch, target branch, or production behavior when it matches
  the base.
- After = current PR branch.
- If base and branch now match, remove that before/after proof.
- If true before/after capture is impractical, say what was captured and why.

Any screenshot or diagram made before a related code change is stale until
rechecked.

Avoid:

- screenshots with no stated proof claim;
- missing screenshots for human-visible UI changes without an explicit blocker
  or narrow no-screenshot rationale;
- screenshot blocker notes based on unsupported CLI helper/session-token paths
  instead of a Computer Use attempt;
- local-only `/tmp` screenshot paths presented as PR-visible proof;
- full-page screenshots without a reason;
- route-load screenshots for UI the PR did not change;
- screenshots for backend-only behavior when diagrams, API examples, or tables
  are clearer;
- stale screenshots from an earlier branch state.
