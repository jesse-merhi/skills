---
name: clawsweeper-until-clean
description: 'Re-review Clawsweeper PRs in a fix-and-rerun loop until clean.'
---

# Clawsweeper until clean

Use this skill when the source of truth is the Clawsweeper bot acting on the
GitHub PR, not a local review command. Trigger Clawsweeper, wait for the fresh
review, fix actionable findings, push, and repeat.

Only stop after **three consecutive Clawsweeper re-reviews** complete with
**zero actionable findings**. Anything less is incomplete work.

Do not use this skill for a one-shot trigger. A single `/clawsweeper re-review`
comment is enough for that. Use this skill when you want the loop run to
convergence.

## Non-negotiables

```yaml
trigger: comment exactly `/clawsweeper re-review` on an eligible PR via `gh pr comment`; no other comment text is authorized
review_source: must be a clawsweeper review/comment posted AFTER your trigger comment
fix_tool: apply targeted fixes directly, or use the repo-specific fix workflow when one exists
stop_condition: 3 consecutive clawsweeper re-reviews with zero actionable findings
counter_reset: any clawsweeper re-review that lists actionable findings resets the consecutive-clean counter to 0
no_early_exit: do not stop on 1 or 2 clean re-reviews
no_self_review: do not skip a re-trigger because you "already know it's clean"
```

## Pre-flight

1. Confirm the target PR number and repo. Pin those values; reuse them every
   iteration.
2. Confirm `gh` is authenticated against the right account and `gh pr view <pr>
   returns the expected PR. The command-comment exception applies only when the
   authenticated user authored the PR or the task contains explicit evidence
   that the user substantially contributed to it. If neither can be verified,
   ask before commenting.
3. Capture a baseline timestamp and head SHA using
   [polling-and-freshness.md](references/polling-and-freshness.md).
4. Decide a safety cap. Defaults: **6 re-review cycles total**, **20 min
   wall-clock per wait** for any single Clawsweeper response.
5. Confirm the working tree is clean enough that fixes will land on the right
   branch. Note any untracked/local changes that might confuse targeted fixes.

## Loop

Maintain across the whole session:

```text
consecutive_clean = 0
iterations       = 0
last_trigger_at  = <ISO timestamp of your most recent /clawsweeper re-review comment>
last_head_sha    = <PR head SHA at trigger time>
```

Repeat:

1. Increment `iterations`.
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

Between consecutive clean re-reviews, do not edit code or push commits. The
streak is only meaningful when Clawsweeper agrees with itself three times on the
same tree.

## Completion criteria

- Final stop reason is `3-consecutive-clean`, `safety-cap-hit`, or
  `wall-clock-cap-hit`.
- Success requires three consecutive fresh Clawsweeper verdicts with zero
  actionable findings on the same PR head SHA.
- Every actionable finding resets the clean counter, even on the third
  re-review.
- Every counted response is fresh, finished, and from Clawsweeper.
- The final report follows [reporting.md](references/reporting.md).

## Context pointers

- Use [polling-and-freshness.md](references/polling-and-freshness.md) for the
  baseline command, polling command, response identity, finished-response rules,
  and head-SHA discipline.
- Use [verdicts.md](references/verdicts.md) for clean, findings, and ambiguous
  classification.
- Use [fixing.md](references/fixing.md) for targeted fix and push rules.
- Use [reporting.md](references/reporting.md) for iteration narration, final
  report fields, hard rules, and common mistakes.
