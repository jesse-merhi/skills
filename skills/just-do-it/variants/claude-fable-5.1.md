---
name: just-do-it
description: 'Finish a proposed change and deliver a reviewed PR ready for Jesse.'
---

# Just Do It

When explicitly invoked, finish the proposed change and deliver one PR ready for Jesse to inspect.

Check the code, PR, and current review/test evidence. Start at the first unfinished or invalidated step; keep completed work whose evidence still applies.

1. Finish the change and run focused validation. For web or native UI, the implementation owner uses `frontend-ui-validation` and records evidence for review and proof-pack reuse.
2. Commit and push the scoped changes to a feature branch. Create or update Jesse's draft PR. For an approved dependent PR chain, use the installed `gh stack` tool and discover commands through `gh stack --help`; preserve each PR's own review and sign-off gates.
3. Complete `code-review` on the current head.
4. Complete `pr-proof-pack` for the final diff.
5. Pass required CI and repo checks. For PRs targeting `openclaw/*`, complete the explicit ClawSweeper workflow in `code-review`.
6. When all required steps pass and the PR has no conflicts, mark it ready for Jesse. Do not merge it.

If blocked or a required workflow cannot finish within its limits, leave the PR draft and explain why.

## Permissions

Before GitHub writes, verify account `jesse-merhi` and Jesse's authorship of an existing PR.

No force-push, merge/automerge, deployment, destructive actions, labels, or reactions. The only allowed public comment is exactly `/clawsweeper re-review`, when required by step 5; no prose additions. Ask before new dependencies, breaking changes, or unrelated scope.
