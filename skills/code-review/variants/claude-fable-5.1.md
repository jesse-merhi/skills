---
name: code-review
description: 'Review changed behavior, repair confirmed problems together, and independently verify the final code.'
---

# Code review

Run native discovery, repair confirmed problems together, then obtain native and independent review of the final code. If the user asks for only one phase or one pass, honor that scope and report its limits.

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

For a single-phase request, specify only that required phase. Keep the executable default two-native-pass schedule when explicitly requested. Prepare the runtime and selected validation commands once; reuse an existing authorized worktree. Identify each changed entry point's production runtime from its launcher or deployment configuration. For runtime-specific APIs or imports, run a focused local check in that runtime; the test runner's interpreter alone does not prove compatibility. Check local and CI setup when a changed test needs a browser or other runtime component; a warm local cache does not establish that a fresh environment can run it. Verify tool versions against the repository before launching expensive work.

To resume, use `review-findings scope-status --repo <owner/repo> --repo-path <checkout> --branch <branch> --target <PR-URL-or-commit> --base <base> --json`. Keep the saved values in later commands. Extend an expired timer only under existing explicit user authority, using [the budget-extension command](references/findings-registry.md).

## 2. Discover and repair the whole problem

Use [the native reviewer](references/native-review.md) and [the review loop](references/review-loop.md). Collect the complete result before editing. The review loop explains when to gather an independent inventory before repairs. Use [the findings guide](references/fixing-and-reporting.md) to establish which problems are real, investigate their shared causes and repair affected paths together. The coordinator owns registry and lifecycle actions; a repair worker receives the prepared checkout, accepted findings and required evidence, and returns its patch and verification.

Record completed actions with [lifecycle batches](references/batches.md). The tool handles ordering and exact retries; it does not judge evidence or grant repair permission.

## 3. Run an independent review

Use [the independent-review instructions](references/cold-review.md) with [the changed-file checks](references/pr-rubbish-audit.md), continuing the same review loop. Include the neutral setup and validation evidence described there. Relevant test, type, readability and UI lenses remain required. Assign extra reviewers only to specific gaps that the general reviewer cannot adequately cover. After any further repair, obtain both required phase results on the new final head.

## 4. Check, push and summarize

Run the relevant repository tests, typecheck, lint and build commands identified during review. Reuse recorded checks only when the checked code, callers, dependencies, fixtures, configuration and environment remain applicable; otherwise rerun the affected checks. Behavior comes first, with effective regression tests before delivery. Early focused checks may diagnose or verify a repair; a mandatory failing-test-first cycle is not part of this workflow. If a repair is needed, fix it and obtain the required phase results on the new committed head before finishing. Record each check before completing the run:

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
