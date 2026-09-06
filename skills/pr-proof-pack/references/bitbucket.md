# Bitbucket publishing

Resolve the workspace, repository, and PR number from its URL, then read the full PR:

```sh
twg bb pull-requests get <PR-ID> --full --workspace <WORKSPACE> --repo <REPO> -o json
```

Use its author and source/destination commits for ownership and diff checks.

## Upload

Write the description to a Markdown file. Place `{{image}}`, `{{image:2}}`, and so on where each image belongs, then pass images in that order:

```sh
twg bb pull-requests update --pull-request <PR-ID> \
  --description-file draft.md \
  --image before.png --image-name <PR-ID>-<UNIQUE-RUN>-before.png \
  --workspace <WORKSPACE> --repo <REPO> -o json
```

Repeat each image/name pair for more images; add `--title` if needed. Use unique names: Bitbucket Downloads replaces an existing artifact with the same name. For text-only changes, omit the images and placeholders.

This upload path supports PNG, JPEG, GIF, and WebP, not video. If motion is essential, explain the unsupported format rather than treating stills as equivalent proof. If a command fails, inspect its error and current `--help` before retrying.

## Verify

Run the read command again. Compare the title, description, and source/destination commits with the intended update, and check that image placeholders became provider-hosted references.

Use available provider API attachment checks without opening a browser. The PR readback alone verifies stored content, not image availability; report that limit when the tools cannot check the attachment. Preserve newer edits when reconciling a partial update.
