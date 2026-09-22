# Final output

If the user explicitly waived review, record the waiver and its scope in the task or PR closeout. Do not invent completed phases or a review run for a waiver-only result. For performed review work, report its actual evidence and limits using the saved records below.

Use the saved run identity, including `--db <path>` if the run uses a nondefault database. Retrieve the completed records:

```sh
review-findings closeout --summary --repo <owner/repo> --repo-path <checkout> \
  --branch <branch> --target <target> --base <base>
review-findings closeout --json --repo <owner/repo> --repo-path <checkout> \
  --branch <branch> --target <target> --base <base>
```

Include the observed outcome of the `feedback-hardening` handoff in your reply to the user.

The JSON's `verification_run` contains `command`, `result`, `reason` and `decision_id`; use these records rather than inventing a validation result. Validation must be recorded before completion; report missing records rather than trying to write to a closed run.

Explain what changed for the user, what was observed, why it matters, important design decisions and what remains. Link the PR or local proof and say what the human should inspect. For a decision, explain real alternatives and recommend one. Allow enough prose for the complexity; validation totals and hashes support the explanation rather than replace it. Explain the practical situation without routine references to internal instructions, preserving higher-priority required disclosures.

Lead with whether review finished and fixes were pushed or remain local. Give the exact target and final candidate SHA, native/cold phase results, validation, unresolved decisions and limits. When evidence was reused, name the earlier reviewed candidate, the applicability decision and reason, the evidence retained, and the additional review or validation performed. A final SHA or earlier `reviewed_head` alone does not prove the required phases apply to the current candidate. Keep enough saved evidence for a later workflow to verify applicability without relying on chat memory.

Summarize the whole run's actionable findings, fixes, unresolved concerns and meaningful verified rejections where they help explain the outcome. Immediately discarded ideas need no report, count or category summary. Use saved candidate IDs and statuses; repeated `finding_matches` are not new findings. The summary's `total_findings` excludes rejected and investigating candidates. Keep unanswered decisions, nonblocking follow-ups, owner-declined deferred work and accepted residual risk distinct. State last-pass results separately: a clean last pass does not erase earlier findings or repairs.

Optionally show up to three highest-priority and three lowest-priority rated runtime findings, with IDs, outcomes and why they matter. Use CLI ratings; choose the highest group first and the lowest from the remaining IDs so fewer than six never produces duplicates. Maintenance findings have no runtime priority: describe their reading/change cost separately.

Report lines added/deleted, labeling the range. The final total PR diff runs from the saved review base (`scope_budget.baseOid`) to the final SHA. Review fixes run from setup's saved starting SHA to the final SHA; reuse `scope_budget.pinnedHeadOid` only when it records that same starting head, not the review base.

```sh
git diff --numstat "<review-base-sha>" "<final-sha>"
git diff --numstat "<starting-sha>" "<final-sha>"
```

Sum numeric additions/deletions; report binary changes separately. If the starting SHA is unavailable, say the review-only count is unavailable rather than guessing.

Include the fully populated `review-findings closeout --json` command above to retrieve the complete audit. Add any other useful explanation freely; no fixed extra sections are required. Run the draft through `speak-fking-english` without losing evidence or open work.
