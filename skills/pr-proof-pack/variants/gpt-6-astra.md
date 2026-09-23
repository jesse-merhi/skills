---
name: pr-proof-pack
description: 'Check or update PR descriptions and proof.'
---

# PR proof pack

## 1. Check

Read the PR and diff using the [GitHub](references/github.md) or [Bitbucket](references/bitbucket.md) guide. Compare its description and proof with the change; leave accurate material alone. Resolve routine choices from PR and repository evidence.

In the target checkout, count the changes against the PR's resolved base and head:

```sh
pr-net-diff --base <BASE-SHA> --head <HEAD-SHA> --markdown
```

## 2. Capture

Choose evidence with [Proof selection](references/proof-selection.md) and handle screenshots or recordings with [Media](references/media.md). Reuse current UI proof from the implementation owner; ask that owner for missing or stale UI coverage instead of repeating validation. Capture other proof only if missing or stale.

## 3. Update

Update using [PR writing](references/pr-writing.md).

Verify the signed-in account belongs to the user and they authored the PR. This workflow permits updating their title, description and proof attachments, unless the request is read-only. Ask before editing another author's PR. Limit changes to the proof pack; put evidence in the body, not comments.

Before publishing, recheck the PR's base, head, title and body. Reconcile newer edits and refresh affected proof.

## 4. Verify

Verify publication using the provider guide, and inspect the finished media using [Media](references/media.md).

Tell the user what changed, link the PR, and explain anything unfinished.
