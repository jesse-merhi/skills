---
name: code-review
description: 'Review changed behavior, repair confirmed problems together, and independently verify the final code.'
---

# Code review

Establish native and independent review evidence, favoring reuse. Honor requests for a single phase or pass and report their limits.

Use the model policy in the applicable `AGENTS.md`. Review launchers own their executable defaults.

Read `coding-standards` in **Read expectations** mode before assessing the diff. Use its required standards assessment throughout this review and include it in the final report. Loading expectations does not invoke enforcement adoption or authorize extra repairs.

Delegate useful bounded repairs to the configured implementer and unresolved code or dependency questions to the investigator. Supply the objective, worktree and revision, scope, constraints, acceptance criteria and relevant evidence. Keep reusable guidance and settings in the role definitions. The coordinator retains the findings registry, repair decisions, sequencing, integration, validation and delivery.

Use a fresh findings-only reviewer for the independent phase under the independent-review instructions. It does not replace the coordinator or native review. Report unavailable roles and continue suitable local work without reconstructing prompts or changing live configuration; local review cannot satisfy an independent-review requirement.

## 1. Start the review

Check out the branch or commit in question. For a branch review, check that the resolved comparison uses the PR's base or the caller's planned PR base before publication. Use the commit's parent only for a requested single-commit review. Start from a clean, committed checkout. Commit authorized task edits for review and preserve unrelated uncommitted work.

Prepare the validation commands once, reusing an authorized worktree. When the diff changes executable behavior or relevant test or runtime setup, check tool versions against the repository, identify the production runtime from the changed entry point's launcher or deployment configuration, and verify runtime-specific APIs and imports there. When a changed test needs a browser or another runtime component, check its local and CI setup; a warm cache does not prove fresh setup works.

The coordinator decides review reuse, further review and validation within the authorized task without asking the user. Follow the review loop and record the reasoning through the review commands.

Start or resume from the checkout through the review entrypoint. It resolves the repository root, branch and HEAD from Git, reuses saved review context, and otherwise uses a matching PR for the target and base. Saved context that supplies the identity needs no PR lookup. Explicit identity flags override inference. If the comparison is ambiguous, supply the intended `--base`; do not guess the default branch. For the default native review:

```sh
review-findings review native \
  --scope-summary "<requested change and allowed repairs>" \
  --native-clean-target 1 --required-phase native --required-phase cold \
  --require-current-head
```

For another engine, reserve with `review start --phase native --evidence "Report planned at <run-owned-report-path>"` with the requested scope settings, check the returned identity before dispatch, then follow the native-launch instructions. For a cold-only request, reserve with `review start --phase cold --evidence "Report planned at <run-owned-report-path>"` at independent dispatch and check the returned identity before launching the reviewer. Specify only the requested phases; use two clean native passes when explicitly requested.

The entrypoint initializes missing scope and returns the run/review identity and recording contract. Check the resolved identity, keep it for later commands, and save its head as the starting commit for the final diff summary. Repeating an open review returns its existing handle and saved state; initialization flags do not rewrite a resumed run's settings or evidence. Use `review status --review <id>` to inspect it. No preliminary `scope-start`/`scope-status` sequence is needed. If the returned identity differs from the requested comparison, finish that invocation as blocked with the mismatch as evidence, then correct the scope through the review commands before retrying. Do not count its result as clean. A blocked or unusable invocation must be resolved under the review commands before starting another.

## 2. Review and repair

Use [the native reviewer](references/native-review.md) and [the review loop](references/review-loop.md) to schedule reviews and repairs. Follow [the findings guide](references/fixing-and-reporting.md) to check candidates, repair shared causes and verify preserved behavior.

Use [the review commands](references/recording-reviews.md) to checkpoint assessed findings and probe evidence during discovery, then save the complete report. Batch available records in one code-mode call and check every result. Close discovery before repairing; interrupted reviews retain their incomplete status while supported findings can be recovered and repaired through those commands.

## 3. Establish independent review evidence

For further independent review, follow [the independent-review instructions](references/cold-review.md) and [the changed-file checks](references/pr-rubbish-audit.md) within the same review loop.

## 4. Check and finish

Decide what validation the change needs. Reuse applicable passing results and satisfy required checks. Save completed checks with `review-findings record-command --review <review-id>` when the destination has an invocation. For reuse-only runs, use the destination run identity as documented in [recording reviews](references/recording-reviews.md#repairs-and-checks); do not record against an inherited source handle.

After the review, use [feedback-hardening](../feedback-hardening/SKILL.md) to decide whether the available reviewer and validation observations warrant a separate task. Apply that judgment to clean, partial, single-phase, bot-only and blocked reviews; none automatically requires a handoff. If a feedback task is launched, its status and outcome do not gate this review or its delivery.

```sh
review-findings scope-check --repo <owner/repo> --repo-path <checkout> \
  --branch <branch> --target <PR-URL-or-commit> --base <base> \
  --reason "Final checks and requested reviews complete" --json
review-findings scope-complete --repo <owner/repo> --repo-path <checkout> \
  --branch <branch> --target <PR-URL-or-commit> --base <base> \
  --reason "Requested reviews complete with no open decisions" --json
```

Run completion only after all requested reviews and checks pass with no open decisions. For diagnostic growth warnings or blocked work, [handle the reported reason](references/blocked-checks.md). Growth warnings call for internal reassessment while authorized work continues.

[Push authorized fixes](references/publish-fixes.md), then [summarize the saved results](references/final-output.md).

Use [the findings commands](references/findings-registry.md) when recording or retrieving evidence.

## Separately requested bot review

For a separately requested bot review, use [the ClawSweeper workflow](references/clawsweeper.md) and [its ratings](references/clawsweeper-ratings.md).
