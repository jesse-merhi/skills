---
name: clawsweeper-until-clean
description: 'Re-review ClawSweeper PRs until three clean passes and a platinum-or-better label, then make up to three bounded attempts at diamond and explain the ceiling when platinum remains.'
---

# Clawsweeper until clean

Outcome: converge an eligible GitHub PR through the Clawsweeper bot, which is
the review source of truth for this workflow. Trigger it, wait for the fresh
review, fix actionable findings, push, and repeat.

First establish **three consecutive ClawSweeper re-reviews** with **zero
actionable findings** on one head and a **platinum-or-better** rating label.
Then use the completed reviews to make up to three honest attempts at diamond.
Platinum is successful; diamond is a bounded stretch goal, not a second gate.

Do not use this skill for a one-shot trigger. A single `/clawsweeper re-review`
comment is enough for that. Use this skill when you want the loop run to
convergence.

## Non-negotiables

```yaml
trigger: comment exactly `/clawsweeper re-review` on an eligible PR via `gh pr comment`; no other comment text is authorized
review_source: must be a clawsweeper review/comment posted AFTER your trigger comment
fix_tool: apply targeted fixes directly, or use the repo-specific fix workflow when one exists
stop_condition: 3 consecutive clawsweeper re-reviews with zero actionable findings
minimum_readiness: one of `rating: 🐚 platinum hermit`, `rating: 🦞 diamond lobster`, or `rating: 🦀 challenger crab` must be present after the clean streak
diamond_timing: inspect rank-up moves only after the clean platinum-or-better baseline
diamond_attempt_limit: 3 across the entire workflow, including any resumed run
platinum_result: success only with a concrete explanation of why diamond was not reached
counter_reset: any clawsweeper re-review that lists actionable findings resets the consecutive-clean counter to 0
no_early_exit: do not stop on 1 or 2 clean re-reviews
no_self_review: do not skip a re-trigger because you "already know it's clean"
no_self_label: never add, edit, or preserve the readiness label on Clawsweeper's behalf
```

## Pre-flight

1. Confirm the target PR number and repo. Pin those values; reuse them every
   iteration.
2. Confirm `gh` is authenticated against the right account and `gh pr view <pr>`
   returns the expected PR. The command-comment exception applies only when the
   authenticated user authored the PR or the task contains explicit evidence
   that the user substantially contributed to it. If neither can be verified,
   ask before commenting.
3. Capture a baseline timestamp and head SHA using
   [polling-and-freshness.md](references/polling-and-freshness.md).
4. Recover `diamond_attempts` from the current workflow state and PR history.
   Count each prior clean platinum baseline followed by an author-controlled
   rank-up change. If the history is ambiguous, use the highest plausible count
   instead of risking a fourth attempt.
5. Decide a safety cap. Defaults: **6 re-review cycles per clean-convergence
   phase**, at most **4 phases**, and **20 min wall-clock per wait** for any
   single Clawsweeper response. The first phase establishes the baseline; each
   later phase exists only after one diamond attempt changes review input.
6. Confirm the working tree is clean enough that fixes will land on the right
   branch. Note any untracked/local changes that might confuse targeted fixes.

## Loop

Maintain across the whole session:

```text
consecutive_clean = 0
phase_iterations = 0
total_iterations = 0
diamond_attempts = <recovered integer from 0 through 3>
last_trigger_at  = <ISO timestamp of your most recent /clawsweeper re-review comment>
last_head_sha    = <PR head SHA at trigger time>
```

Repeat:

1. Increment `phase_iterations` and `total_iterations`.
2. Trigger Clawsweeper with `gh pr comment <pr> --body "/clawsweeper re-review"`.
3. Record `last_trigger_at` and `last_head_sha`.
4. Monitor for a fresh, finished response using
   [polling-and-freshness.md](references/polling-and-freshness.md).
5. Classify the response with [verdicts.md](references/verdicts.md).
6. If clean, increment `consecutive_clean`; stop only at `3/3`.
7. If it has findings, reset `consecutive_clean` to 0, fix only those findings
   with [fixing.md](references/fixing.md), push, and re-trigger.
8. If ambiguous, do not count it as clean. Re-trigger once; if ambiguity
   remains, stop and report.
9. If a safety cap is hit, stop and report unresolved state honestly.
10. After `3/3`, wait for ClawSweeper's label update and verify a
    platinum-or-better label with
    [polling-and-freshness.md](references/polling-and-freshness.md). If it is
    absent at the wall-clock cap, stop incomplete. Do not apply it yourself.
11. Continue to **After clean: try for diamond**. Do not report final success
    before that step returns a terminal outcome.

Between consecutive clean re-reviews, do not edit code or push commits. The
streak is only meaningful when Clawsweeper agrees with itself three times on the
same tree.

## After clean: try for diamond

Read [rank-up.md](references/rank-up.md) and apply its post-clean decision. If
it selects an author-controlled improvement, increment `diamond_attempts`
before the mutation, reset `consecutive_clean` and `phase_iterations`, and
return to the loop for another clean-convergence phase. After that phase, use
the newest result to decide whether to stop or spend another attempt. Preserve
`diamond_attempts` across any caller-driven resume so the workflow can never
start a fourth rank-up cycle.

This step finishes as `already-diamond-or-better`, `diamond-achieved`, or
`platinum-with-explanation`. A platinum result must name the concrete evidence,
environment, scope, residual-risk, or owner-decision ceiling. Do not rerun an
unchanged review merely in hope of a different rating.

## Completion criteria

- Final stop reason is `already-diamond-or-better`, `diamond-achieved`,
  `platinum-with-explanation`, `safety-cap-hit`, or `wall-clock-cap-hit`.
- Success requires three consecutive fresh Clawsweeper verdicts with zero
  actionable findings on the same PR head SHA and one platinum-or-better
  rating label after that streak.
- Every actionable finding resets the clean counter, even on the third
  re-review.
- Every counted response is fresh, finished, and from Clawsweeper.
- The readiness label was observed rather than added by the agent, and no push
  occurred after the final counted review.
- At most three post-clean diamond attempts occurred across the complete
  workflow. Each attempted a distinct concrete improvement, and a final
  platinum result includes the specific reason it did not reach diamond.
- The final report follows [reporting.md](references/reporting.md).

## Context pointers

- Use [polling-and-freshness.md](references/polling-and-freshness.md) for the
  baseline command, polling command, response identity, finished-response rules,
  and head-SHA discipline.
- Use [verdicts.md](references/verdicts.md) for clean, findings, and ambiguous
  classification.
- Use [fixing.md](references/fixing.md) for targeted fix and push rules.
- Use [rank-up.md](references/rank-up.md) only after the first clean
  platinum-or-better baseline, for the bounded diamond attempts and their
  stopping explanation.
- Use [reporting.md](references/reporting.md) for iteration narration, final
  report fields, hard rules, and common mistakes.
