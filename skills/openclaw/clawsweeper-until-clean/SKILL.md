---
name: clawsweeper-until-clean
description: 'Drive Clawsweeper PR re-reviews in a fix-and-rerun loop: comment `/clawsweeper re-review`, monitor, fix findings, and stop only when clean.'
---

# Clawsweeper Until Clean

Trigger clawsweeper by commenting `/clawsweeper re-review` on the PR, wait for its review to land, fix any findings, and trigger it again. Only stop after **three consecutive clawsweeper re-reviews** complete with **zero actionable findings**. Anything less is incomplete work.

Use this skill when the source of truth is the Clawsweeper bot acting on the GitHub PR, not a local review command.

## Non-Negotiables

```yaml
trigger: comment exactly `/clawsweeper re-review` on the PR via `gh pr comment`
review_source: must be a clawsweeper review/comment posted AFTER your trigger comment — never an older review
fix_tool: apply targeted fixes directly, or use the repo-specific fix workflow when one exists
stop_condition: 3 consecutive clawsweeper re-reviews with zero actionable findings
counter_reset: any clawsweeper re-review that lists actionable findings resets the consecutive-clean counter to 0
no_early_exit: do not stop on 1 or 2 clean re-reviews, even if the diff looks small or "obviously fine"
no_self_review: do not skip a re-trigger because you "already know it's clean" — make clawsweeper say so
```

## When to Use

- Right before merging a PR you want held to clawsweeper's bar.
- When earlier clawsweeper rounds were noisy and you want a deterministic stopping rule.
- When the user explicitly wants the bot's verdict, not a local review run, to gate the work.

Do **not** use this skill for a one-shot trigger. A single `/clawsweeper re-review` comment is enough for that. Use this skill when you want the loop run to convergence.

## Pre-Flight

Before the first trigger:

1. Confirm the target PR (number + repo). Pin those values; reuse them every iteration.
2. Confirm `gh` is authenticated against the right account and `gh pr view <pr>` returns the expected PR.
3. Capture a **baseline timestamp** so you can distinguish new clawsweeper output from history:

   ```sh
   gh pr view <pr> --json comments,reviews,headRefOid \
     --jq '{head: .headRefOid, last_comment: (.comments | last).createdAt, last_review: (.reviews | last).submittedAt}'
   ```

   You will compare future polls against this snapshot.
4. Decide a safety cap. Defaults: **6 re-review cycles total**, **20 min wall-clock per wait** for any single clawsweeper response. Hitting either cap stops the loop with an honest report.
5. Confirm the working tree is clean enough that fixes will land on the right branch. Note any untracked/local changes that might confuse targeted fixes.

## The Loop

Maintain across the whole session:

```text
consecutive_clean = 0
iterations       = 0
last_trigger_at  = <ISO timestamp of your most recent /clawsweeper re-review comment>
last_head_sha    = <PR head SHA at trigger time>
```

Then repeat:

```text
1. iterations += 1

2. Trigger clawsweeper:
     gh pr comment <pr> --body "/clawsweeper re-review"
   Record last_trigger_at = now (use the GitHub-returned createdAt if available).
   Record last_head_sha   = current PR head SHA.

3. Monitor for clawsweeper's response. Poll on a sane cadence:
     - first 2 minutes: every ~20s
     - after that:      every ~60s
   Each poll:
     gh pr view <pr> --json comments,reviews \
       --jq '[(.comments[] | {kind:"comment", at:.createdAt, author:.author.login, body:.body}),
              (.reviews[]  | {kind:"review",  at:.submittedAt, author:.author.login, body:.body, state:.state})]
             | map(select(.at > $last_trigger_at and (.author | test("clawsweeper"; "i"))))'
   A response is "fresh" only when:
     - it is from clawsweeper (login or app slug matches), AND
     - its createdAt/submittedAt is strictly after last_trigger_at, AND
     - the PR head SHA has not changed since last_trigger_at (otherwise re-trigger; clawsweeper is reviewing stale code).
   Stop polling when at least one fresh response is present and clawsweeper has clearly finished
   (look for a final summary comment / review submission, not just an in-progress "working on it" reply).

4. Classify the fresh response:
     - clean        → no actionable findings (informational notes are fine)
     - has_findings → at least one actionable finding remains
     - ambiguous    → errored, "I couldn't review", rate-limited, or no structured verdict

5. If clean:
     consecutive_clean += 1
     If consecutive_clean >= 3 → STOP, report success.
     Else → go to step 2 (do NOT change any code between consecutive clean re-reviews).

6. If has_findings:
     consecutive_clean = 0
     Apply targeted fixes for the findings, or use the repo-specific fix workflow when one exists.
     Push the fix commit so clawsweeper sees it on the next trigger.
     Verify the fixes actually changed the relevant code; diff it before continuing.
     Go to step 2.

7. If ambiguous:
     Do NOT count this as clean. Re-trigger once. If it stays ambiguous, stop and report.

8. If iterations >= safety_cap OR a single wait exceeds the wall-clock cap → STOP, report unresolved state honestly.
```

Two rules that are easy to violate and matter most:

- Between consecutive clean re-reviews, **do not edit code or push commits**. The whole point is that clawsweeper agrees with itself three times on the same tree. Pushing between clean re-reviews invalidates the streak.
- A single actionable finding **resets the counter to zero**, even on the third re-review. Two clean + one dirty + one clean = `consecutive_clean = 1`, not 3.

## Recognising clawsweeper's response

Clawsweeper may post as a regular issue comment or as a PR review. Watch both. Match its identity loosely (e.g. login containing `clawsweeper`, possibly `[bot]` suffix), but do not match on the trigger comment itself — that is the comment you wrote.

A response is **finished** (safe to act on) when one of these is true:

- A review is submitted (`reviews[].submittedAt` populated) with a clear verdict.
- A summary comment is posted that lists findings or explicitly states no findings.
- Clawsweeper's last message is not a transient "working on it" / "queued" / "starting review" placeholder.

If you only see an in-progress placeholder, keep polling — do not classify yet.

## Head-SHA discipline

Always re-check the PR head SHA when polling. If a new commit lands on the PR after your trigger but before clawsweeper finishes, clawsweeper may be reviewing the older tree. In that case:

- Discard the in-flight response (it does not match the current code).
- Re-trigger `/clawsweeper re-review` against the new head.
- Restart the wait for that iteration.

Never count a re-review as clean when its `last_head_sha` does not match the current PR head.

## What Counts as "Clean"

Treat a clawsweeper re-review as clean only when:

- The response lists zero items in its actionable / blocking / must-fix bucket.
- Nits, style observations, or "consider"-tier suggestions do **not** count as findings unless clawsweeper itself classifies them as actionable.
- The response references the **current** head SHA (or otherwise makes clear it reviewed the latest tree).
- The response is a finished verdict, not a placeholder.

When in doubt, treat the re-review as `has_findings` or `ambiguous`. False negatives (declaring clean when it isn't) defeat the skill.

## Fixing

- Apply the minimal direct edit that resolves each clawsweeper finding, or use the repo-specific fix workflow when one exists.
- Do not bundle drive-by refactors into the fix step. Each fix should map back to a clawsweeper finding, so the next re-review sees a clean, narrow change.
- **Push the fix commit** before re-triggering — clawsweeper reviews what's on the remote, not your local tree.

## Reporting

While looping, narrate one short line per iteration so the user can follow the trajectory:

```text
iter 1: triggered /clawsweeper re-review @ sha abc123 → 4 findings → fixed → pushed def456
iter 2: triggered re-review @ sha def456 → 1 finding  → fixed inline → pushed ghi789
iter 3: triggered re-review @ sha ghi789 → clean (1/3)
iter 4: triggered re-review @ sha ghi789 → clean (2/3)
iter 5: triggered re-review @ sha ghi789 → 1 finding  → counter reset → pushed jkl012
...
iter 8: triggered re-review @ sha xyz999 → clean (3/3) ✓
```

On termination, report:

- final iteration count
- whether the stop reason was `3-consecutive-clean`, `safety-cap-hit`, or `wall-clock-cap-hit`
- the last clawsweeper verdict (link to the comment/review)
- any findings that needed a repo-specific fix workflow rather than direct edits
- the PR head SHA at the moment of the final clean re-review

## Hard Rules

- **Always re-trigger via comment.** The comment body must be exactly `/clawsweeper re-review`. Do not paraphrase, do not bundle other text, do not @-mention humans.
- **Never claim success at < 3 consecutive clean.** "Looks fine to me" is not the stop condition.
- **Never edit or push between consecutive clean re-reviews.** Pushes invalidate the streak.
- **Always reset the counter on any actionable finding**, even on re-review 3.
- **Always validate head SHA** before counting a response.
- **Respect the safety and wall-clock caps.** Looping forever is worse than stopping and reporting.
- **Do not silence findings** by reclassifying them as nits to keep the streak alive. If clawsweeper says it's actionable, it's actionable.
- **Do not impersonate clawsweeper** by writing your own "looks clean" comment. The verdict must come from the bot.

## Common Mistakes

| Mistake | Why it breaks the skill |
|---|---|
| Stopping at the first clean re-review | The point of the skill is the streak, not a single green run |
| Pushing a commit between two clean re-reviews | Clawsweeper is now reviewing a different tree; streak invalidated |
| Reading an old clawsweeper review as the response | That verdict is from before your trigger; not valid |
| Counting an in-progress "working on it" comment as clean | A placeholder is not a verdict |
| Counting 2 clean + 1 dirty + 1 clean as "close enough" | Counter resets on dirty; that's 1 consecutive, not 3 |
| Skipping the trigger because "the last fix was tiny" | The skill requires clawsweeper to confirm, every time |
| Using a different reviewer | The stop condition is defined against clawsweeper specifically |
| Bundling unrelated cleanup into a fix step | Introduces new diff that the next re-review will rightly flag |
| Re-triggering with extra text in the body | The bot may not parse the command; trigger gets ignored |
