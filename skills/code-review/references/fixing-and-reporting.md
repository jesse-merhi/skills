# Check, rate and fix findings

## 1. Establish the problem

For each reported bug, use realistic inputs and normal checks in the reviewed application to establish its trigger, expected behavior and actual result. A local reproduction or an observed failure that applies to the reviewed code is enough; production logs are not required.

Include internal failures such as lost data, broken backups and failed jobs. For security, check attainable access and existing defenses. Explain a lost layer of protection without claiming an exploit that another layer blocks. For maintenance findings, show the confusing code and its present cost to read or change.

Tie findings to the reviewed change and exact revision. Trace the actual caller, configured producer and installed dependency behavior before claiming a failure. A hypothetical response from a future adapter is not a current producer. A controlled local fixture at an existing external boundary can establish a failure; replacing internal guarantees with arbitrary corruption cannot.

Before repeating an investigation, compare relevant recorded counterevidence with this revision, dependency, requirement and trigger. A later fixed revision does not disprove an earlier bug. Keep prior verdicts out of independent reviewer prompts.

Tie findings to the reviewed change. Investigate missing evidence; reject unsupported claims, personal preferences and missing-test suggestions without a specific behavior to prove. Type-permitted inputs and user count alone do not establish reachability or a race.

## 2. Rate and record

Assess likelihood and impact yourself, including for native findings that already have a priority. Explain how often the trigger can occur and the harm it causes; rare destructive failures still matter. Use the CLI's rating scales and record contract:

```sh
review-findings schema
review-findings record --help
```

Record every checked candidate, including rejected and uncertain ones. The CLI derives severity and disposition from the evidence; it does not verify that evidence. Keep maintenance cost separate from runtime likelihood and impact.

Match repeated reports to the same open or rejected cause after the reviewer returns. Append evidence with `review-findings record --match-of <id>` and the saved run identity, source, evidence and match note from its help; include the reviewed revision in the match note and keep one finding and at most one outstanding question. A match appends evidence without changing the earlier decision. For a rejected claim, compare current counterevidence first; changed facts needing a new judgment require a new decision linked to the earlier ID. A recurrence after a fixed finding also needs a new decision, not a match.

## 3. Choose the repair

Fix proven, worthwhile problems that the CLI accepts within the authorized task and budget. Before the first edit, collect the full accepted inventory and group findings by failed assumption. Trace other callers and sibling implementations relying on that assumption, including failure and recovery paths. Repair the shared cause and confirmed affected instances together, reusing repository or dependency solutions. Check new assumptions introduced by the fix: for example, adding a lock also requires checking cancellation, ownership and availability in supported environments. This investigation belongs to the implementer and does not require another reviewer. Apply the same relevant code, type, test and UI standards while repairing. Several files alone do not require another approval. Weigh the repair's complexity against the harm; leave independent adjacent work as a nonblocking follow-up.

Ask when permission is missing, scope must expand or a concrete high-risk choice remains. Explain the problem, proposed fix and actual decision in plain English. Keep explicit requirements for breaking changes, dependencies, access and publication. An `investigate` or `consult` result is not permission to patch.

Queue unanswered questions and continue independent authorized work. Repeated reports belong to the existing question; silence is not approval. Wait when no independent work remains, the clean target is reached or the CLI blocks continuation. Record the owner's answer before dependent work. A tentative keep/revert edit needs prior authority; reversibility alone grants none. The findings commands reference covers those less common record transitions.

## 4. Fix and verify

Use `writing-good-tests` for behavior or test changes, `reducing-cognitive-load` for readable repairs and `typescript-discipline` for TypeScript. For UI changes, reuse the implementation owner's `frontend-ui-validation` evidence and request missing states.

The coordinator records normal repair attempts through one lifecycle batch after verification, using the finding’s `decisionId`, not its database `issueId`. Do not first record the same attempt through individual progress commands. For exceptional transitions outside the batch path, use the findings command contract; two failed attempts still require approval before a third.

Run focused checks for the repaired behavior, affected siblings and behavior the fix must preserve. When a repair changes validation, authorization or selection, verify the intended accepted case and a realistic near-match that must remain rejected. Trace both through downstream checks to the resulting decision and effects; acceptance alone does not prove the repair. Reuse existing proof where it covers those cases. Stop on the first failure and diagnose before rerunning. Add coverage for a distinct realistic regression that existing tests do not protect; missing tests alone are not a bug. Verify the combined patch once per affected check set rather than rerunning the whole suite after each edit. Record a failed repair in the batch with `unsuccessful: true`, its attempt ID and verification evidence, keeping the finding open. Two failed attempts require approval before a third.

When using lifecycle batches, submit each repair result while its finding is still open; the batch records the attempt before making it fixed. A retry of the same saved action returns its receipt without repeating writes. The individual commands remain available for exceptional transitions. Record completed checks before closing the run. After each repair or failed attempt:

```sh
review-findings scope-check --repo <owner/repo> --repo-path <checkout> \
  --branch <branch> --target <target> --base <base> \
  --reason "After a repair or failed attempt" --json
```

Resolve any reported blocker before more work. Once checks pass, return to the review loop to commit and review the accepted fixes. Preserve unrelated edits.
