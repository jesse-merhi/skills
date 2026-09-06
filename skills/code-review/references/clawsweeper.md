# ClawSweeper until clean

Run this named workflow only when requested or required by the authorized caller. It permits the exact bot command below on a PR authored by, or substantially contributed to by, the user. Other comments require separate permission. A bot-only run does not run native/cold review or satisfy their gate.

1. **Check ownership and state.** Check the authenticated account, PR head and existing bot result. Use the main skill's setup to initialize or resume its authorized review record; use `phase=clawsweeper`. The target is two consecutive clean reviews on unchanged code, base and proof, with bot-awarded platinum or better.
2. **Trigger and wait.** Run `scope-check`, then record the head, trigger time and a distinct started pass. If the check or start is refused, stop; otherwise post:
   ```sh
   gh pr comment <PR-URL> --body "/clawsweeper re-review"
   ```
   Use the current host's supported wait. Inspect responses with `gh pr view <PR-URL> --json headRefOid,comments,reviews,labels`. Count only a completed response from the verified ClawSweeper bot after this trigger and covering the unchanged head. Queued, failed, unclear or stale responses are incomplete.
3. **Triage and repair.** Use the shared fixing/reporting process. This workflow permits validating and pushing its scoped fixes before retriggering the bot. Findings or changes to code, base or proof reset the streak. Preserve unrelated edits and calling-workflow checks.
4. **Check the rating.** After two clean reviews, require `rating: 🐚 platinum hermit`, `rating: 🦞 diamond lobster` or `rating: 🦀 challenger crab` awarded by the bot for that head. Only the bot sets rating labels. From platinum, follow useful, in-scope rank-up advice and the rating reference supplied by the main skill; make at most three distinct improvements, rebuilding the clean streak after each. Stop at diamond or explain the concrete evidence, environment, scope or owner decision limiting the result.
5. **Respect saved limits and report.** Keep attempts and streaks across resumes: six triggers per attempt, four attempts overall and twenty minutes per response. Retry an ambiguous response once within those limits. Record diamond attempts before edits. Stop incomplete when a budget is exhausted. Report the final bot link, head, rating, streak, changes and remaining blockers. A later push invalidates this result and any affected caller checks.

The current progress CLI cannot reopen a completed phase after a proof-only change on the same SHA. If that occurs, report the limitation and stop incomplete; the old clean passes do not cover the new proof.
