# Bitbucket Cloud through TWG

## When this file applies

Read this file only for a Bitbucket Cloud PR. TWG is the provider CLI used by
this branch. This public proof-pack works without a separate TWG skill. An
available TWG or Atlassian skill may provide current guidance. Load it when
useful; the CLI path here still works without it.

TWG is not limited to media upload. Use it for the Bitbucket reads and
authorized PR mutations this workflow needs. Its availability does not grant
permission for unrelated provider actions.

Use the live binary's help as the source of truth. The examples below use the
long command names for clarity; do not assume an older TWG release supports
the same flags.

## Resolve and inspect the PR

Resolve the Bitbucket workspace slug, repository slug, and PR ID from the exact
PR URL or repository remote. Pass all three explicitly rather than relying on
working-directory detection:

```sh
twg bb pull-requests get <pr-id> \
  --full \
  --workspace <workspace-slug> \
  --repo <repository-slug> \
  -o json
```

Record the PR URL, title, description, source branch, destination branch,
source commit hash, and destination commit hash. Fetch missing commits from the
appropriate provider remotes, verify both with
`git cat-file -e '<commit-hash>^{commit}'`, then run:

```sh
<skill-dir>/scripts/pr-net-diff --base <destination-commit-hash> \
  --head <source-commit-hash> --markdown
```

Require the reported selected base and head SHA to match those commits. The
comparison base remains their merge base.

## Preflight a refresh

First inspect the exact mutation command without changing provider state:

```sh
twg bb pull-requests update --help
```

Require `--pull-request` and `--description-file` for every refresh. When an
image or diagram was selected, also require `--image` and `--image-name`. Then
run the read-only `get` command above with explicit workspace and repository
values to prove that authentication and repository access work.

If TWG is missing, its live help lacks a required flag, or the read fails, stop
before mutation. Report the detected binary and failure. Ask the human to put a
current TWG binary first on `PATH` or repair Bitbucket authentication, such as
with `twg setup bitbucket`.

## Refresh the description and images

Write the complete intended PR description to a temporary Markdown file. For
each image, put TWG's placeholder on its own line at the intended body location:

```md
{{image}}
```

Use `{{image}}` for the first image. For multiple images, pass the files in body
order and use `{{image:2}}`, `{{image:3}}`, and so on for later images. Keep
nearby alt text, captions, and evidence context in the Markdown because the
placeholder itself carries none.

After publication authority is confirmed, run the full read-only `get` again.
Require the source hash, destination hash, title, and description to match the
snapshot used to prepare the draft. If any changed, stop, recompute the net
diff, and reconcile the new provider state; never overwrite a concurrent human
edit or publish stale proof. Then update the body and upload all selected images
in one operation:

```sh
twg bb pull-requests update \
  --pull-request <pr-id> \
  --description-file <draft-markdown-path> \
  --image <first-image-path> \
  --image-name <pr-id>-<run-unique-suffix>-<first-descriptive-name.png> \
  --workspace <workspace-slug> \
  --repo <repository-slug> \
  -o json
```

If the title is stale and live help exposes `--title`, include the corrected
title in the same update.

Repeat `--image` and its paired descriptive `--image-name` in placeholder order
for additional images. Bitbucket download names are repository-wide keys, and
uploading an existing name replaces that artifact. Include the PR ID and a
run-unique timestamp or nonce in every name so a later proof refresh cannot
change an older PR's images.

The name must have an extension matching the detected image type. Follow the
live help's current file-type and size limits.
TWG uploads the images to Bitbucket's provider-hosted storage and embeds them
while applying the description. Do not upload detached evidence in a comment
or commit proof media to the repository.

This path supports images, not video. Use one or more still images only when
they preserve the claim. If motion or playback is essential evidence, classify
the refresh as `blocked` and explain that the Bitbucket/TWG attachment path
cannot publish the required format.

For a text-only refresh, omit `--image`, `--image-name`, and image placeholders.

## Verify the finished PR

Run the full read-only `get` command again. Require the source and destination
commit hashes to match the final heads captured before mutation. Check the title
and complete description, confirm every intended section is present, and
confirm that no literal `{{image...}}` placeholder remains.

For a text-only refresh, this provider readback is sufficient when the stored
Markdown contains every expected claim and reproduction step. For every image
or diagram, open the exact PR in an authenticated interactive browser. Confirm
that each embed loads in the intended body position, then inspect its rendered
pixels at the PR body's real width. TWG readback verifies stored PR data; it
does not prove that Bitbucket rendered usable media. There is no repository-owned
headless Bitbucket rendered-media verifier.

If the final head changed, an embed is missing, a placeholder remains, or the
rendered pixels cannot be inspected, stop and report the exact failed check.
