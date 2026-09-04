---
name: clawsweeper-until-clean
description: 'Re-review ClawSweeper PRs until three clean passes and a platinum-or-better label, then make up to three bounded attempts at diamond and explain the ceiling when platinum remains.'
---

# Clawsweeper until clean

Converge the GitHub ClawSweeper bot to three consecutive fresh zero-actionable-
finding reviews on one head plus an observed platinum-or-better label. Then make
up to three justified diamond attempts. Platinum with a concrete ceiling
explanation is success; diamond is a bounded stretch goal. A one-shot trigger
uses one comment, not this loop.

## Preflight and state

Pin repo and PR. Verify `gh` authentication and `gh pr view <pr>` target. The
exact command-comment exception applies only when the authenticated user authored
the PR or explicit task evidence proves substantial contribution; otherwise ask
before commenting. No prose comments are authorized.

Use [polling-and-freshness.md](references/polling-and-freshness.md) for baseline
time/head, response identity, and finished-state rules. Recover `diamond_attempts`
from workflow state/history: count prior clean platinum baselines followed by
author-controlled rank-up changes; use the highest plausible count if ambiguous.
Default caps are 6 re-reviews per convergence phase, at most 4 phases, and 20 minutes
per response wait. Later phases require a diamond attempt changing review input.
Confirm fixes will land on the right branch and note local/untracked interference.

Maintain `consecutive_clean = 0`, `phase_iterations = 0`, `total_iterations = 0`,
recovered `diamond_attempts` (0–3), `last_trigger_at`, and `last_head_sha` across
all resumes. For each cycle increment phase/total counters, then:

```bash
gh pr comment <pr> --body "/clawsweeper re-review"
```

Record trigger time/head and wait for a finished ClawSweeper response posted
after that trigger. Classify with [verdicts.md](references/verdicts.md).
Clean increments the streak; actionable findings reset it even on pass three.
Use [fixing.md](references/fixing.md) for targeted direct/repo-workflow fixes,
validation, push, and retrigger. Ambiguous is not clean: retrigger once, then
stop if ambiguity remains. Stop honestly at a safety/wait cap. No edits or pushes
between clean reviews; never substitute your judgment for a fresh bot response.

At 3/3, wait within the cap for a bot-awarded `rating: 🐚 platinum hermit`,
`rating: 🦞 diamond lobster`, or `rating: 🦀 challenger crab`. Missing label means
incomplete. Never add, edit, or preserve a readiness label on the bot's behalf.

## Complete the post-clean decision

Only after clean platinum-or-better, read [rank-up.md](references/rank-up.md) and
[rating-rubric.md](references/rating-rubric.md). For a selected author-controlled
improvement, increment `diamond_attempts` before mutation, reset clean/phase
counters, and reconverge. Each attempt needs a distinct concrete improvement;
never spend a fourth attempt across resumes or rerun unchanged input hoping for
a different rating.

Terminal success is `already-diamond-or-better`, `diamond-achieved`, or
`platinum-with-explanation`. Platinum must name the evidence, environment, scope,
residual-risk, or owner-decision ceiling. Other stops include `safety-cap-hit`
and `wall-clock-cap-hit`; unresolved ambiguity or missing labels remain incomplete.
Follow [reporting.md](references/reporting.md). Success requires the final fresh
3/3 on one SHA, observed label, post-clean decision, and no push after final review.
