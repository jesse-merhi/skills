---
name: pr-proof-pack
description: 'Check or update PR descriptions and proof.'
---

# PR proof pack

## 1. Check

Read the PR and its diff using the [GitHub](references/github.md) or [Bitbucket](references/bitbucket.md) guide. Compare the description and evidence with what actually changed. Leave accurate material alone.

In the target checkout, count the changes against the PR's resolved base and head:

```sh
pr-net-diff --base <BASE-SHA> --head <HEAD-SHA> --markdown
```

## 2. Capture

Use [Proof selection](references/proof-selection.md) to choose evidence and [Media](references/media.md) for screenshots and recordings. Reuse current UI evidence from the implementation owner; request missing or stale UI coverage from that owner rather than starting another validation pass. Capture other evidence only when missing or stale.

## 3. Update

Update using [PR writing](references/pr-writing.md).

Verify the signed-in account belongs to the user and the user authored the PR. For their own PR, this workflow authorizes updating the title, description, and proof attachments. Follow an explicit read-only request; ask before changing another author's PR. Keep changes to the proof pack, with evidence in the body rather than comments.

Immediately before publishing, check whether the PR's base, head, title, or body changed. Reconcile newer edits and refresh affected proof before updating.

## 4. Verify

Verify publication using the provider guide, and inspect the finished media using [Media](references/media.md).

Complete these four stages for the requested PR. Tell the user what changed, link the PR, and explain anything unfinished.
