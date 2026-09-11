---
name: code-review
description: 'Review changed behavior, repair confirmed problems together, and independently verify the final code.'
---

# Code review

Run native review, repair confirmed problems, then obtain native and independent review of the final code. Honor a request for only one phase or pass and report its limits.

## 1. Start the review

Check out the PR branch or the commit in question. Use the PR's base, or the requested commit's parent. Start from a clean, committed checkout; preserve uncommitted edits and ask before committing or discarding them. Save `git rev-parse HEAD` as the starting commit for the final diff summary.

Fill these values from the checkout and PR:

```sh
review-findings scope-start --repo <owner/repo> --repo-path <checkout> \
  --branch <branch> --target <PR-URL-or-commit> --base <base> \
  --head <starting-sha> --scope-summary "<requested change and allowed repairs>" \
  --native-clean-target 1 --required-phase native --required-phase cold \
  --require-current-head
```

For a single-phase request, specify only that phase. Use two clean native passes when explicitly requested.

Prepare the runtime and validation commands once, reusing an authorized worktree. Check tool versions against the repository. Identify the production runtime from the changed entry point's launcher or deployment configuration, and verify runtime-specific APIs and imports there. When a changed test needs a browser or another runtime component, check its local and CI setup; a warm cache does not prove fresh setup works.

To resume, use `review-findings scope-status --repo <owner/repo> --repo-path <checkout> --branch <branch> --target <PR-URL-or-commit> --base <base> --json`. Keep the saved values in later commands. Extend an expired timer only under existing explicit user authority, using [the budget-extension command](references/findings-registry.md).

## 2. Review and repair

Use [the native reviewer](references/native-review.md) and [the review loop](references/review-loop.md) to schedule reviews and repairs. Follow [the findings guide](references/fixing-and-reporting.md) to check candidates, repair shared causes and verify preserved behavior.

Submit each completed review as [one batch](references/batches.md): all candidates, repeated reports and coverage together. Finish and record the assessment before repairing; do not submit findings one at a time.

## 3. Run an independent review

Follow [the independent-review instructions](references/cold-review.md) and [the changed-file checks](references/pr-rubbish-audit.md), continuing the same review loop.

## 4. Check, push and summarize

Run the relevant repository tests, typecheck, lint and build commands. Reuse earlier proof only under the review loop's applicability rules. Confirm behavior and add effective regression coverage before delivery; this workflow does not require a failing-test-first cycle. Save completed checks in a `checks` batch.

```sh
review-findings scope-check --repo <owner/repo> --repo-path <checkout> \
  --branch <branch> --target <PR-URL-or-commit> --base <base> \
  --reason "Final checks and requested reviews complete" --json
review-findings scope-complete --repo <owner/repo> --repo-path <checkout> \
  --branch <branch> --target <PR-URL-or-commit> --base <base> \
  --reason "Requested reviews complete with no open decisions" --json
```

Run completion only after all requested reviews and checks pass with no open decisions. If a command blocks work, [handle its reported reason](references/blocked-checks.md).

[Push authorized fixes](references/publish-fixes.md), then [summarize the saved results](references/final-output.md).

Use [the findings commands](references/findings-registry.md) when recording or retrieving evidence.

## Separately requested bot review

For a separately requested bot review, use [the ClawSweeper workflow](references/clawsweeper.md) and [its ratings](references/clawsweeper-ratings.md).
