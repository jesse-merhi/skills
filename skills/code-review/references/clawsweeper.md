# ClawSweeper until clean

Run only when requested or required by an authorized caller. A bot-only request runs this workflow alone and reports its coverage limits. Use the evidence and repair requirements in [code-review](../SKILL.md). Keep the target, triggers, results and remaining limits with the task across resumes.

1. **Check ownership and state.** Verify the authenticated account, PR ownership, base, head, proof and existing bot result. Only a PR authored by or substantially contributed to by the user permits the exact comment below. Other comments need separate permission.
2. **Trigger and wait.** Record the head and trigger time, then post:
   ```sh
   gh pr comment <PR-URL> --body "/clawsweeper re-review"
   ```
   Inspect `gh pr view <PR-URL> --json headRefOid,comments,reviews,labels`. Count only a completed response from the verified bot after this trigger covering unchanged code, base and proof. Queued, failed, ambiguous or stale responses are incomplete.
3. **Confirm and repair.** Check findings against actual behavior and fix confirmed problems within scope. This workflow authorizes validating and pushing these scoped fixes before retriggering; preserve the caller's publication and CI constraints. Changes to code, base or proof reset the clean streak.
4. **Finish the bot check.** Require two consecutive clean results and a bot-awarded platinum-or-better rating for the same target. Only the bot assigns ratings. At platinum, follow concrete in-scope rank-up advice, making at most three distinct improvements and rebuilding the streak after each. Stop at diamond or explain what prevents it. Proof must demonstrate the changed behavior; decorative media cannot repair weak code. The bot owns its confidence and rating criteria.
5. **Respect limits.** Allow six triggers per attempt, four attempts overall, and twenty minutes per response. Retry an ambiguous response once within those limits. Record each rank-up attempt before editing. Stop incomplete at the limit. Report the final bot link, head, rating, streak, changes and remaining blockers; later changes invalidate affected evidence.
