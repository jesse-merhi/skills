---
name: code-review
description: 'Review code, check findings, fix worthwhile problems and repeat until clean.'
---

# Code review

Run native review, then an independent review. If the user asks for only one, run only that part.

## 1. Start the review

Check out the PR branch or the commit in question. Use the PR's base, or the requested commit's parent. Start from a clean, committed checkout; preserve uncommitted edits and ask before committing or discarding them. Save `git rev-parse HEAD` as the starting commit for the final diff summary.

Fill these values from the checkout and PR:

```sh
review-findings scope-start --repo <owner/repo> --repo-path <checkout> \
  --branch <branch> --target <PR-URL-or-commit> --base <base> \
  --head <starting-sha> --scope-summary "<requested change and allowed repairs>"
```

To resume, use `review-findings scope-status --repo <owner/repo> --repo-path <checkout> --branch <branch> --target <PR-URL-or-commit> --base <base> --json`. Keep the saved values in later commands.

## 2. Run native reviews and fix the findings

Use [the native reviewer](references/native-review.md) and [the review loop](references/review-loop.md). Handle returned findings with [the findings guide](references/fixing-and-reporting.md).

## 3. Run an independent review

Use [the independent-review instructions](references/cold-review.md) with [the changed-file checks](references/pr-rubbish-audit.md), continuing the same review loop.

## 4. Check, push and summarize

Run the relevant repository tests, typecheck, lint and build commands identified during review. If a repair is needed, fix it and repeat the review for that part before finishing. Record each check before completing the run:

```sh
review-findings record-command --repo <owner/repo> --repo-path <checkout> \
  --branch <branch> --target <PR-URL-or-commit> --base <base> \
  --command "<full validation command>" --result "<observed result>" \
  --reason "<behavior checked and evidence location>"
```

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
