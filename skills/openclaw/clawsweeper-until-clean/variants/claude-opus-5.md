---
name: clawsweeper-until-clean
description: 'Re-review ClawSweeper PRs until three clean passes and a platinum-or-better label, then make up to three bounded attempts at diamond and explain the ceiling when platinum remains.'
---

# Clawsweeper until clean

Converge the PR's ClawSweeper result to three consecutive fresh clean reviews on
one head plus a bot-awarded platinum-or-better label. Then make at most three
concrete diamond attempts. Platinum with an explained ceiling is success;
diamond is not a second gate. Do not add auxiliary reviewers or unbounded rank-up work.

Pin PR/repo and verify `gh` authentication and `gh pr view <pr>`. The exact
command-comment exception needs authenticated-user authorship or explicit
substantial-contribution evidence; otherwise ask before commenting. Only the
machine command is authorized. For one trigger, post it once rather than running
this convergence skill.

Use [polling-and-freshness.md](references/polling-and-freshness.md) for baseline,
head discipline, response identity, and finished-state checks. Recover
`diamond_attempts` from state/history, counting author-controlled rank-up changes
after clean platinum baselines. Ambiguity uses the highest plausible count.
Default caps: 6 re-reviews per phase, at most 4 phases, and 20 minutes per response
wait. Later phases require an attempt changing review input. Confirm fix checkout/
branch and note local/untracked interference.

Maintain `consecutive_clean = 0`, `phase_iterations = 0`, `total_iterations = 0`,
recovered `diamond_attempts` (0–3), `last_trigger_at`, and `last_head_sha`. Increment
phase/total counts before:

```bash
gh pr comment <pr> --body "/clawsweeper re-review"
```

Record time/head; accept only a fresh finished ClawSweeper response after the
trigger. Apply [verdicts.md](references/verdicts.md) to the complete returned
candidate set. Clean increments the streak; actionable findings reset it even
on review three. Use [fixing.md](references/fixing.md) for targeted direct/repo-
workflow fixes, validation, push, and retrigger. Ambiguous results are not clean:
retry the trigger once, then stop if still ambiguous. Respect caps.

No code edits or pushes between clean reviews, and no self-declared clean pass.
At 3/3 wait for bot-owned `rating: 🐚 platinum hermit`,
`rating: 🦞 diamond lobster`, or `rating: 🦀 challenger crab`; absent label at cap
means incomplete. Never add, edit, or preserve that label on the bot's behalf.

Only then use [rank-up.md](references/rank-up.md) and
[rating-rubric.md](references/rating-rubric.md). Increment attempts before each
selected distinct author-controlled improvement, reset clean/phase counters,
and reconverge. Preserve the global attempt count across resumes; there is no
fourth attempt or unchanged-input reroll.

End as `already-diamond-or-better`, `diamond-achieved`, or
`platinum-with-explanation`, the last with its concrete evidence/environment/
scope/residual-risk/owner-decision ceiling. `safety-cap-hit` and
`wall-clock-cap-hit` report incomplete work; ambiguity or missing labels are not
success. Follow [reporting.md](references/reporting.md) with compact iteration
updates and a final fresh 3/3, observed label, attempt count, and no push after
the final counted review.
