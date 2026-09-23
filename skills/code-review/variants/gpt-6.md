---
name: code-review
description: 'Review changed behavior, repair confirmed problems together, and independently verify the final code.'
---

# Code review

Establish native and independent review evidence, reusing applicable results. Honor requests for a single phase or pass and report its limits. Follow the applicable `AGENTS.md` model policy; launchers own executable defaults.

Read `coding-standards` in **Read expectations** mode before assessing the diff. Include its standards assessment in the report; this does not authorize enforcement adoption or unrelated repairs.

Use `spawn_agent` with `agent_type`: "implementer" for useful bounded repairs and `agent_type`: "investigator" for unresolved code or dependency questions. Pass objective, worktree and revision or source, scope, constraints, acceptance criteria and evidence. Keep reusable settings in role definitions; the coordinator owns findings, repair decisions, sequencing, integration, validation and delivery. Report unavailable roles and continue suitable local work without rebuilding prompts or changing configuration.

Use a fresh `spawn_agent` `agent_type`: "findings_reviewer" for independent review. It does not replace native review. If unavailable, report it and continue suitable local work; local review cannot satisfy the independent requirement.

## 1. Start the review

Use a clean, committed checkout; commit authorized edits and preserve unrelated work. For branch review, compare with the PR base or planned PR base before publication. Use a commit's parent only for a requested single-commit review.

Prepare validation commands once in an authorized worktree. For executable or test/runtime setup changes, check tool versions, identify the production runtime from the entry point's launcher or deployment configuration, and verify runtime-specific APIs and imports. For changed browser or runtime-dependent tests, check local and CI setup; a warm cache does not prove fresh setup.

The coordinator decides reuse, further review and validation within authorization and records the reasoning through review commands.

Start or resume from the checkout. The entrypoint resolves root, branch and HEAD from Git, reuses saved context (without another PR lookup) or finds a matching PR. Explicit identity flags override inference; supply `--base` if ambiguous rather than guessing. For normal Codex native review:

```sh
review-findings review native \
  --scope-summary "<requested change and allowed repairs>" \
  --native-clean-target 1 --required-phase native --required-phase cold \
  --require-current-head
```

For another engine, reserve with `review start --phase native --evidence "Report planned at <run-owned-report-path>"`, check the identity, then follow native-launch instructions. For cold-only review, reserve with `review start --phase cold --evidence "Report planned at <run-owned-report-path>"` at independent dispatch and check identity before launch. Specify only requested phases; use two clean native passes if requested.

Check the returned run/review identity and recording contract; retain its head as the starting commit for the final diff summary. An open review resumes its saved state; initialization flags do not rewrite it. Inspect with `review status --review <id>`; no preliminary `scope-start`/`scope-status` is needed. If identity differs from the requested comparison, finish the invocation as blocked with mismatch evidence, correct scope through review commands, then retry. Resolve blocked or unusable invocations before starting another; never count them clean.

## 2. Review and repair

Use [the native reviewer](references/native-review.md) and [the review loop](references/review-loop.md) to schedule reviews and repairs. Follow [the findings guide](references/fixing-and-reporting.md) to check candidates, repair shared causes and verify preserved behavior.

Use [review commands](references/recording-reviews.md) to checkpoint assessed findings and probe evidence during discovery, then save the report. Batch records in one code-mode call and inspect each result. Close discovery before repair; interrupted reviews remain incomplete while supported findings can be recovered through these commands.

## 3. Establish independent review evidence

For further independent review, follow [the independent-review instructions](references/cold-review.md) and [the changed-file checks](references/pr-rubbish-audit.md) within the same review loop.

## 4. Check and finish

Choose necessary validation, reuse applicable passing results and satisfy required checks. Save completed checks with `review-findings record-command --review <review-id>` when the destination has an invocation. For reuse-only runs, use the destination run identity per [recording reviews](references/recording-reviews.md#repairs-and-checks), not an inherited source handle.

After every review—including clean, partial, single-phase, bot-only or blocked—use [feedback-hardening](../feedback-hardening/SKILL.md) to assess whether reviewer and validation observations warrant a separate task. None automatically requires handoff; a launched task’s status and outcome do not gate review or delivery.

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
