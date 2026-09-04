---
name: clawsweeper-until-clean
description: 'Re-review ClawSweeper PRs until three clean passes and a platinum-or-better label, then make up to three bounded attempts at diamond and explain the ceiling when platinum remains.'
---

# Clawsweeper until clean

Once target and comment authority are established, carry the bot loop through
three consecutive fresh clean reviews on one head and platinum-or-better,
then the bounded diamond decision. Do not ask again on each iteration. A one-shot
trigger does not invoke this convergence loop.

## Establish authority and recovered limits

Pin repo/PR and verify authenticated `gh` plus `gh pr view <pr>`. The command-comment
exception requires authenticated-user authorship or explicit task evidence of
substantial contribution. Otherwise ask before commenting. It permits exactly
`/clawsweeper re-review`, not prose. Use
[polling-and-freshness.md](references/polling-and-freshness.md) for baseline time,
head, response identity, and finished-state evidence.

Recover `diamond_attempts` from state/history, counting author-controlled rank-up
changes after clean platinum baselines. Choose the highest plausible count when
ambiguous. Default limits are 6 reviews per clean-convergence phase, at most
4 phases, and 20 minutes for each response. Only a diamond attempt changing
review input starts a later phase. Check fixes will land on the intended branch
and note interfering local/untracked work.

## Run fresh evidence through the loop

Maintain clean/phase/total counts initialized to zero, recovered
`diamond_attempts` (0–3), `last_trigger_at`, and `last_head_sha`. Increment
`phase_iterations`/`total_iterations` before each trigger:

```bash
gh pr comment <pr> --body "/clawsweeper re-review"
```

Record head/time and wait for a finished ClawSweeper response after that comment.
Use [verdicts.md](references/verdicts.md). Clean increments `consecutive_clean`;
any actionable finding resets it to zero, including on pass three. Follow
[fixing.md](references/fixing.md) for targeted direct/repo-workflow fixes,
validation, push, and retrigger. Ambiguous results do not count; retrigger once,
then stop if still ambiguous. Caps stop the workflow honestly.

Keep code/head unchanged between clean reviews. Your judgment cannot replace
a fresh bot response. After 3/3, wait for an observed bot-owned
`rating: 🐚 platinum hermit`, `rating: 🦞 diamond lobster`, or
`rating: 🦀 challenger crab`. Missing label at the wait cap is incomplete; never
add, edit, or preserve the readiness label for the bot.

## Finish the rank-up decision without expanding scope

Read [rank-up.md](references/rank-up.md) and [rating-rubric.md](references/rating-rubric.md)
only after clean platinum-or-better. For a selected distinct author-controlled
improvement, increment attempts before mutation, reset clean/phase counts, and
reconverge. Preserve attempts across every resume, never exceed three, and do
not rerun unchanged input hoping for another rating.

Platinum is success with a concrete evidence/environment/scope/residual-risk/
owner-decision ceiling. Terminal outcomes are `already-diamond-or-better`,
`diamond-achieved`, `platinum-with-explanation`, `safety-cap-hit`, or
`wall-clock-cap-hit`; ambiguity/missing labels remain incomplete. Follow
[reporting.md](references/reporting.md). Success requires fresh finished 3/3 on
one SHA, observed label, completed post-clean decision, and no later push.
