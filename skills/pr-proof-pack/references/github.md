# GitHub publishing

Read the signed-in identity and the exact PR:

```sh
gh api user --jq .login
gh pr view <PR-URL> --json url,title,body,author,baseRefOid,headRefOid
```

## Upload

Write the intended description to a local Markdown file. Reference images where they belong; put each video alone in its paragraph:

```md
![Before: filters reset](./before.png)

![](./after.mp4)
```

Run from the directory containing those relative paths. For uploads, preserve a checkpoint using the exact asset paths written in the draft:

```sh
proof-publication prepare --pr <PR-URL> --body draft.md --asset ./before.png --asset ./after.mp4 --state <NEW-DIRECTORY>
proof-publication check --state <DIRECTORY>
gh pr edit <PR-URL> --body-file draft.md --attach ./before.png --attach ./after.mp4
```

Run `check` immediately before the edit; reconcile any drift first. The checkpoint does not track the base commit, so include that in the PR metadata recheck. Add `--title` when the title needs changing. For text-only updates, use `gh pr edit --body-file` without attachment flags.

If upload fails, inspect the error and check `gh --version`; native attachments require 2.99.0 or newer. Read the actual post-failure state with:

```sh
proof-publication observe --state <DIRECTORY>
```

An upload may partly succeed. Preserve successful uploads and newer human edits, then prepare a fresh checkpoint for any remaining attachments. If stopping, leave the body with working hosted references rather than local file paths.

## Display and verification

For deliberate image sizing, use `<img src="HOSTED-URL" alt="What changed" width="50%">`. Choose a readable width; GitHub retains the width attribute but strips inline CSS. Recheck the PR before saving a post-upload formatting change.

```sh
gh pr view <PR-URL> --json title,body,baseRefOid,headRefOid
github-verify-rendered-proof --pr <PR-URL> --head <HEAD-SHA>
```

Compare the readback and reported media with the intended update, including expected types and byte sizes for new uploads. The helper checks server-rendered embeds, downloadable media, and revision stability. It does not judge visual quality or video playback; inspect the local media for those.

Use inspected static exports for diagrams. Routine publication verification uses these commands, not a browser visit. Keep credentials with the provider tools and signed attachment URLs out of logs.
