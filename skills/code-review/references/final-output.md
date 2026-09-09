# Final output

Use the saved run identity, including `--db <path>` if the run uses a nondefault database. Retrieve the completed records:

```sh
review-findings closeout --summary --repo <owner/repo> --repo-path <checkout> \
  --branch <branch> --target <target> --base <base>
review-findings closeout --json --repo <owner/repo> --repo-path <checkout> \
  --branch <branch> --target <target> --base <base>
```

The JSON's `verification_run` contains `command`, `result`, `reason` and `decision_id`; use these records rather than inventing a validation result. Validation must be recorded before completion; report missing records rather than trying to write to a closed run.

Lead with whether review finished and fixes were pushed or remain local. Give the exact target and final SHA, native/cold phase results and evidence, validation, unresolved decisions and limits. A missing `reviewed_head` means the saved run is incomplete; an exact SHA alone does not prove both phases ran. Keep enough evidence for a later workflow to check the reviewed head without relying on chat memory.

Include these whole-run counts from the full JSON:

- **Raised:** `review_candidates.length`, counting each finding ID once; repeated `finding_matches` are not new findings.
- **Fixed:** candidates whose `status` is `fixed`.
- **Discarded:** candidates whose `status` is `rejected`, with brief reasons. Investigating, deferred and provisional work is not discarded or fixed.

The summary's `total_findings` excludes rejected and investigating candidates; it is not the raised count. Reconcile other statuses with the full candidate list. Keep unanswered decisions, nonblocking follow-ups, owner-declined deferred work and accepted residual risk distinct. State last-pass results separately: a clean last pass does not erase earlier findings or repairs.

Optionally show up to three highest-priority and three lowest-priority rated runtime findings, with IDs, outcomes and why they matter. Use CLI ratings; choose the highest group first and the lowest from the remaining IDs so fewer than six never produces duplicates. Maintenance findings have no runtime priority: describe their reading/change cost separately.

Report lines added/deleted, labeling the range. The final total PR diff runs from the saved review base (`scope_budget.baseOid`) to the final SHA. Review fixes run from setup's saved starting SHA to the final SHA; reuse `scope_budget.pinnedHeadOid` only when it records that same starting head, not the review base.

```sh
git diff --numstat "<review-base-sha>" "<final-sha>"
git diff --numstat "<starting-sha>" "<final-sha>"
```

Sum numeric additions/deletions; report binary changes separately. If the starting SHA is unavailable, say the review-only count is unavailable rather than guessing.

Include the fully populated `review-findings closeout --json` command above to retrieve the complete audit. Add any other useful explanation freely; no fixed extra sections are required. Run the draft through `speak-fking-english` without losing counts, evidence or open work.
