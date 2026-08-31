# Visual evidence and attachments

## Contents

- [When this file applies](#when-this-file-applies)
- [GitHub attachment upload](#github-attachment-upload)
- [Bitbucket image upload](#bitbucket-image-upload)
- [Rendered PR verification](#rendered-pr-verification)
- [Evidence contract](#evidence-contract)
- [Presentation gate](#presentation-gate)
- [Static UI proof](#static-ui-proof)
- [UI interaction proof](#ui-interaction-proof)
- [Recording edit](#recording-edit)
- [Backend and operator proof](#backend-and-operator-proof)
- [Performance proof](#performance-proof)
- [Placement](#placement)

## When this file applies

Read this file only after `proof-selection.md` determines that an important
claim would lose information in text. This file owns how to capture and publish
that selected visual evidence; `proof-selection.md` owns whether a visual
qualifies.

UI evidence must show the actual product. Explanatory technical diagrams,
wireframes, mockups, screenshots of prose, and test-runner output cannot satisfy
static or interactive UI proof. When rendered diagram or export output is itself
the changed product, capture that actual output as proof of its own pixels and
result; it still does not prove that the system depicted by the diagram ran.

If practical capture, screen recording, provider authentication, attachment
upload, asset verification, or a required visual inspection fails,
stop before completing the PR update. Tell the human the concrete failure and
ask them to restore the blocked capability. Continue only after it works.

## GitHub attachment upload

For a PR hosted on exactly `github.com`, upload each image or video with the
repository command:

```sh
<skill-dir>/scripts/github-upload-attachment \
  --pr <number-or-URL-resolved-in-step-2> \
  <path>
```

The command resolves the exact PR and numeric repository ID, detects the media
type, sends the binary through GitHub's token-authenticated attachment endpoint,
and requires a `201` response with a canonical
`https://github.com/user-attachments/assets/*` URL. It then authenticates only
the initial canonical URL, follows redirects without forwarding credentials to
another host, ignores user curl configuration that could weaken that boundary,
keeps signed redirect URLs out of process arguments, rejects redirects outside
GitHub-controlled media hosts, and verifies HTTP status, HTTP and detected
content types, and exact byte size.
It prints only the verified asset URL on success.

The command supports `github.com` PRs only and accepts only image or video
content. It requires curl 8.4 or newer so its byte limit also applies to
responses without `Content-Length`. If the preflight fails, upgrade curl and
ensure the newer binary is first on `PATH`.
If it fails, stop and report its diagnostics. Do not extract or reuse browser
credentials.

Insert images with descriptive alt text and a deliberate percentage width:

```html
<img src="https://github.com/user-attachments/assets/example"
     alt="Supplier results remain visible while the role search is filtered"
     width="50%">
```

Choose the smallest width that keeps the relevant detail comfortably readable
in the PR content area. Start narrow mobile or focused UI captures at `50%`,
medium-width captures at `75%`, and use `100%` only when the content benefits
from the full column. These are judgment defaults, not fixed categories. A
device capture should not render at full width merely because its physical
pixel dimensions are large. GitHub preserves percentage values in the `width`
attribute but strips an inline CSS `width`, so use `width="50%"`, not
`style="width: 50%"`.

Use a Markdown table when it makes a small related group easier to compare,
such as before/after, desktop/mobile, or two important states. Size each image
to `100%` of its table cell so the table, rather than the source pixels,
controls the grouping:

```md
| Before: direct base | After: PR |
| --- | --- |
| <img src="BEFORE_URL" alt="Before: results disappear" width="100%"> | <img src="AFTER_URL" alt="After: results remain visible" width="100%"> |
```

Keep a single image, a sequential interaction, or a comparison whose details
become cramped outside a table. Insert videos as a bare URL on their own line;
image Markdown such as `![](url)` does not produce a working MP4 player. Keep
every attachment in the main PR body, never in a detached comment. Do not
commit proof media to the repository unless the project or user explicitly
requests that storage model.

## Bitbucket image upload

For a Bitbucket Cloud PR, follow [bitbucket.md](bitbucket.md). TWG applies the
complete description and provider-hosted images together with
`twg bb pull-requests update`, `--description-file`, repeated `--image` flags,
and body placeholders such as `{{image}}`. A separate TWG or Atlassian skill is
optional; use it when available and useful.

The TWG path supports images, not video. If still images would lose an essential
motion or playback claim, stop with `blocked` evidence instead of publishing a
weaker proof.

## Rendered PR verification

On GitHub, inspect the final title and Markdown body, then verify the
server-rendered body without opening a browser:

```sh
PR_URL='<full-PR-URL-resolved-in-step-2>'
PR_HEAD='<final-head-SHA-resolved-in-step-2>'
gh pr view "$PR_URL" --json title,body --jq '{title, body}'
<skill-dir>/scripts/github-verify-rendered-proof --pr "$PR_URL" --head "$PR_HEAD"
```

Check the title, section order, captions, copyable reproduction steps, and every
expected image and video in the Markdown. The repository verifier captures
`body_html` without printing it, requires the PR to stay on the expected final
head, preflights the same curl 8.4 requirement before fetching media, and
reports only media counts, types, and byte sizes. It
keeps signed URLs out of process arguments and fetches every resolved asset
without credentials, user curl configuration, or untrusted redirects.
Never forward the `gh` token to a resolved asset, Camo, or CDN host, and never
print a resolved signed asset URL. The HTTP and detected content types must both
match the rendered image or video family after MIME parameters are removed,
which allows GitHub's safe image subtype normalization.
For evidence uploaded during this refresh, require the reported byte size to
match its local source.
Preserved evidence may not have a run-owned local source.
It does not need an exact size match.
This proves that GitHub stored the new bytes, kept preserved assets available,
and produced the expected media markup.

Use an interactive browser for facts the server-rendered HTML cannot prove:

- Mermaid or other client-side rendering;
- literal PR-page layout or pixel appearance;
- actual video playback or another visual interaction the proof claim depends
  on.

Inspect the finished evidence locally before upload with the model's image or
video viewer. Inspect the fetched rendered asset again after upload. A file with
real bytes, a successful status, or the expected content type does not prove
that its pixels or frames show the intended behavior or look presentable.

For Bitbucket Cloud, TWG readback proves the stored PR description but not the
rendered image. Follow [bitbucket.md](bitbucket.md) and inspect every finished
image or diagram on the rendered PR in an authenticated interactive browser.

## Explanation diagrams

Use the same provider upload, rendered-asset verification, and presentation
gate for an explanatory diagram. Inspect the exported diagram locally before
upload and inspect the fetched rendered asset again afterward. Confirm that it
is readable at the PR body's real width and still has clear hierarchy, useful
icons, balanced spacing, correct routes, and no clipping or collisions.

Introduce it with the one thing the reviewer should learn and caption it
`What this explains`. The evidence contract below does not turn the diagram
into proof; observed product behavior must still be shown separately with
actual screenshots, recordings, or native text as required by
`proof-selection.md`.

## Evidence contract

Every visual evidence item answers these questions in nearby text:

1. What current net-diff behavior does this visibly demonstrate?
2. What starting state, input, action, transition, and outcome appear?
3. What route, fixture, account, environment, viewport, dataset, and capture
   method make it reproducible?
4. What important error, recovery, persistence, or side effect was checked?
5. What direct-base behavior is the reviewer comparing with the PR result?
6. What information would be lost if this were represented as copyable text?

Use real output from the current branch. Before means the direct PR base, not a
previous feature-branch commit. Recapture after every related branch change.

## Presentation gate

Inspect the actual image at full readable detail and watch every finished video
at 1× speed. Reject and recapture evidence that does not look deliberate and
review-ready.

- Crop to the product area or result being proved. Exclude browser tabs,
  address bars, bookmarks, extensions, account avatars, operating-system chrome,
  docks, notifications, unrelated windows, and empty space.
- Keep only interface controls that are part of the behavior. A browser frame is
  not context; provide route, fixture, environment, and viewport in nearby text.
- Make the relevant state readable at normal PR-body width. Use a tighter crop or
  fewer rows rather than asking the reviewer to zoom into a full desktop.
- Render each image at a percentage that suits what it depicts. A narrow mobile
  screen should normally occupy less of the PR column than a desktop interface
  or dense diagram. Treat full width as a deliberate presentation choice, not
  the default produced by plain image Markdown.
- Group a small set of directly comparable images in a table when the shared
  headers and alignment reduce comparison work. Keep them separate when table
  columns make the evidence harder to read.
- Match crop, scale, viewport, theme, and data for before/after evidence. Label
  each side without covering the changed result.
- Remove secrets, personal information, unrelated tabs, cursor clutter, debug
  overlays, and temporary tool interfaces.
- Use clean alignment, intentional spacing, and one visual focus. Do not add
  decorative framing that competes with the evidence.

The model must be able to state what the visual proves, where the result appears,
and why the composition is sufficient. Recapture when any answer depends on the
caption rather than visible content.

## Static UI proof

Capture actual product screenshots when appearance, layout, responsive behavior,
or a rendered state changed. When the baseline is meaningful and reproducible,
use the same route, fixture, data, viewport, theme, and starting state against
the direct base and PR branch. Label the matched images `Before: direct base`
and `After: PR` and keep the changed pixels readable at normal GitHub width.

Otherwise state the constraint and show the actual product entry point and PR
outcome. When a manual interaction also changed, these screenshots supplement
the required recording; they do not replace it.

## UI interaction proof

Record every changed motion, timing, gesture, or manual flow at a deliberate
pace. A reviewer should be able to follow without scrubbing frame by frame.

- begin before the first relevant action so the starting state is visible;
- capture the page viewport or relevant product area rather than the
  surrounding browser or desktop interface;
- move the pointer deliberately and pause after important transitions;
- show the input, loading or transition state, outcome, and relevant recovery;
- record the same scenario on the direct base and PR branch when both have
  comparable visible behavior;
- exercise changed error, empty, permission, responsive, keyboard, or reduced-
  motion behavior when it is in scope;
- add a labeled before/after image only when it makes a static visual difference
  easier to compare or preserves a state that is not legible in the video;
- use realistic data and avoid secrets or personal information.

An explanatory technical diagram, static screenshot, test runner video, replay
of automated E2E output, or screenshot of textual output does not prove a visual
interaction.

## Recording edit

Follow [video-editing.md](video-editing.md) before upload. Remove inactive
lead-in, setup, and dead stretches; retain a short readable hold on the starting
state, important transitions, and outcome. Keep the actual actions at normal
speed. Preserve real waiting when duration or performance is itself the claim.

Play the finished video once at 1× speed. Done when the flow is easy to follow,
no informative state is rushed, and no long idle interval remains.

## Backend and operator proof

Show the changed system behavior, not the command that checked it:

- API: representative request, response, and persisted or rejected state;
- worker or queue: input event, processing outcome, and resulting side effect;
- migration: realistic dry run or execution plus changed records and rollback;
- infrastructure: operator action plus resulting resource or runtime state;
- test-only: the running product scenario the test now protects.

Represent terminal requests, responses, state, and traces as copyable text by
default. Use a terminal screenshot or recording only when the visible operator
interaction, rendering, or timing is itself part of the claim.
A terminal showing only a test, build, validator, or success exit code is not
evidence.

## Performance proof

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

Put each selected image and recording in the main PR body, never in a detached
comment. Use a table for a small related group when it improves scanning;
otherwise place the media directly in the body. Put the shared explanation
immediately below the item or table:

```md
<uploaded interaction recording>

**What this shows:** Saving an invalid supplier stops at the form, explains the
phone-number error, and keeps the entered values available for correction.

**State:** Local seeded supplier account; desktop viewport; manual interaction
recorded at deliberate pace on the current PR branch.
```

Use descriptive alt text and labels. Keep reproduction steps copyable. Let the
provider's checks report routine automated validation.
