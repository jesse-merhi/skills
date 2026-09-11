# Check, rate and fix findings

## Establish the problem

Tie each candidate to the reviewed change and exact revision. Show how a client/API user or background job reaches the bug, what should happen, what happens instead and who is affected. Use realistic inputs and the application's normal checks. Local reproduction is sufficient; production logs are unnecessary.

Trace actual callers, configured producers and installed dependencies. A controlled fixture at an existing external boundary can prove a failure; inventing a future adapter or bypassing internal guarantees cannot. Type-permitted inputs and user count alone do not establish reachability or a race.

Include internal failures such as lost data, broken backups and failed jobs. For security, check attainable access and existing defenses; distinguish a lost protection from an exploit still blocked elsewhere. For maintenance, show the confusing code and its present cost.

Compare applicable recorded counterevidence before repeating an investigation. A later fix does not disprove an earlier bug. Investigate missing evidence; reject unsupported claims, preferences and missing-test suggestions without a specific behavior to prove. Keep prior verdicts out of independent briefs.

## Rate the complete inventory

Use `review-findings schema` for evidence and rating requirements. Assess likelihood and impact even when the reviewer supplied a priority; rare destructive failures matter. Keep maintenance cost separate. The CLI derives severity and disposition but cannot verify the evidence. Accept runtime findings only with the proof above; leave unresolved candidates unrated and explain rejections.

Record every checked candidate, including rejected and uncertain ones, through `record --review <id>` in the code-mode call for the complete report. Match repeated reports to the same open or rejected cause with `record --match-of`. Include the revision and why the cause and counterevidence still apply. Changed facts requiring a new judgment, or recurrence after a fix, need a new decision linked to the earlier ID.

## Choose and verify repairs

Before editing, group the accepted inventory by failed assumption. Trace other callers and sibling implementations, including failure and recovery. Repair the shared cause and confirmed affected instances together, preferring repository or dependency solutions. Check assumptions introduced by the fix: adding a lock also requires checking cancellation, ownership and runtime availability. This is implementation work, not another review invocation.

Fix proven, worthwhile problems accepted by the CLI within existing authority and budget. Keep independent adjacent work as a nonblocking follow-up. Ask about missing permission, expanded scope or concrete high-risk choices; preserve explicit requirements for breaking changes, dependencies, access and publication. `investigate` and `consult` do not authorize edits, including tentative keep/revert repairs.

Queue unanswered questions and continue independent authorized work. Repeated reports share one question; silence is not approval. Record the owner's answer before dependent work. Wait when nothing independent remains or the CLI blocks continuation.

Use `writing-good-tests` for behavior or test changes, `reducing-cognitive-load` for repairs, and `typescript-discipline` for TypeScript. Reuse applicable `frontend-ui-validation` evidence for UI changes and request missing states.

Verify the repaired behavior, affected siblings and behavior the fix must preserve. For validation, authorization or selection changes, test the intended accepted case and a realistic near-match that must stay rejected. Trace downstream decisions and effects; acceptance alone is insufficient. Add coverage for distinct realistic regressions not already protected. Stop on the first failure and diagnose before rerunning. Check the combined patch once per affected check set.

Record repair attempts and checks through the review commands, using `decisionId`, not database `issueId`. Record the applied attempt while the finding is open, then record verification. Mark a successful repair fixed; record a failed attempt as `repair-unsuccessful` and keep its finding open. Two failures require owner authorization before a third. Record the owner's decision through the existing authorization command; do not duplicate saved attempts.

Run `review-findings scope-check` with the saved scope after the repairs or a failed attempt. Resolve blockers before continuing, then commit and return to review. Preserve unrelated edits.
