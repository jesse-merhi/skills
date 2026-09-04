---
name: clawsweeper-until-clean
description: 'Re-review ClawSweeper PRs until three clean passes and a platinum-or-better label, then make up to three bounded attempts at diamond and explain the ceiling when platinum remains.'
---

# Clawsweeper until clean

Use this for bot-driven convergence, not a one-shot trigger. First obtain three
fresh consecutive clean ClawSweeper reviews on the same head and a platinum-or-
better label. Then make at most three honest diamond attempts across the whole
workflow. Platinum with a concrete explanation is a successful terminal result.

1. Pin repository and PR. Check the authenticated `gh` account and
   `gh pr view <pr>`. Comment automatically only when that user authored the PR
   or the task explicitly proves substantial contribution; otherwise ask first.
   Only the exact machine command is authorized, never prose comments.
2. Read [polling-and-freshness.md](references/polling-and-freshness.md) and capture
   baseline timestamp/head. Recover `diamond_attempts` from state and PR history,
   counting clean-platinum baselines followed by author-controlled rank-up changes.
   Use the highest plausible count when history is ambiguous.
3. Set caps: by default 6 cycles per convergence phase, at most 4 phases, and
   20 minutes per bot-response wait. The first phase establishes the baseline;
   later phases require a diamond attempt changing input. Confirm the intended
   branch and identify local/untracked changes affecting safe fixes.
4. Maintain `consecutive_clean = 0`, `phase_iterations = 0`, `total_iterations = 0`,
   recovered `diamond_attempts` (0–3), `last_trigger_at`, and `last_head_sha`.
   Increment phase/total counters and trigger:

   ```bash
   gh pr comment <pr> --body "/clawsweeper re-review"
   ```

   Record trigger time and head. Wait for a fresh finished ClawSweeper response
   posted after it, using the freshness reference. Batch independent PR/state reads.
5. Apply [verdicts.md](references/verdicts.md). Clean increments the streak.
   Actionable findings reset it to zero, even on the third review. Follow
   [fixing.md](references/fixing.md) for targeted direct/repo-workflow fixes,
   validation, push, and retrigger. Ambiguous responses do not count: retrigger
   once and stop if still ambiguous. Stop at safety/wait caps with honest unresolved state.
6. Do not edit or push between clean reviews. Do not skip a trigger because you
   think the code is clean. At 3/3, wait for the bot-owned label:
   `rating: 🐚 platinum hermit`, `rating: 🦞 diamond lobster`, or
   `rating: 🦀 challenger crab`. If absent at the wait cap, report incomplete.
   Never add, edit, or preserve the bot's label yourself.
7. Only now read [rank-up.md](references/rank-up.md) and
   [rating-rubric.md](references/rating-rubric.md). Apply the post-clean decision.
   If it selects a concrete author-controlled improvement, increment
   `diamond_attempts` before mutation, reset clean/phase counters, and reconverge.
   Each attempt must be distinct; preserve the total across caller resumes and
   never begin a fourth. Do not retrigger unchanged input to gamble on ratings.
8. Finish with `already-diamond-or-better`, `diamond-achieved`, or
   `platinum-with-explanation`; the last needs a concrete evidence/environment/
   scope/residual-risk/owner-decision ceiling. Caps use `safety-cap-hit` or
   `wall-clock-cap-hit`; ambiguity/missing labels stay incomplete. Follow
   [reporting.md](references/reporting.md), with final 3/3 evidence, awarded label,
   attempts, and no push after the last counted review.

Report fresh results, changed evidence, completed validation, or blockers during
long work. Keep edits/tests tied to accepted findings and justified rank-up work.
