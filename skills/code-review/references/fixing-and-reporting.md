# Check, rate and fix findings

## 1. Establish the problem

For each reported bug, establish its trigger, expected behavior and actual result through the reviewed application with realistic inputs and normal checks in place. A local reproduction is enough; production logs are not required. An observed failure also qualifies when it applies to the reviewed code.

Include internal failures such as lost data, broken backups and failed jobs. For security, check attainable access and existing defenses. Explain a lost layer of protection without claiming an exploit that another layer blocks. For maintenance findings, show the confusing code and its present cost to read or change.

Tie findings to the reviewed change. Investigate missing evidence; reject unsupported claims, personal preferences and missing-test suggestions without a specific behavior to prove. Type-permitted inputs and user count alone do not establish reachability or a race.

## 2. Rate and record

Assess likelihood and impact yourself, including for native findings that already have a priority. Explain how often the trigger can occur and the harm it causes; rare destructive failures still matter. Use the CLI's rating scales and record contract:

```sh
review-findings schema
review-findings record --help
```

Record every checked candidate, including rejected and uncertain ones. The CLI derives severity and disposition from the evidence; it does not verify that evidence. Keep maintenance cost separate from runtime likelihood and impact.

Match repeated reports to the same open cause after the reviewer returns. Append evidence with `review-findings record --match-of <id>` and the saved run identity, source, evidence and match note from its help; keep one finding and one outstanding question.

## 3. Choose the repair

Fix proven, worthwhile problems that the CLI accepts within the authorized task and budget. Repair the shared cause at its owner, reuse repository or dependency solutions, and check affected callers. Several files alone do not require another approval. Weigh the repair's complexity against the harm; leave independent adjacent work as a nonblocking follow-up.

Ask when permission is missing, scope must expand or a concrete high-risk choice remains. Explain the problem, proposed fix and actual decision in plain English. Keep explicit requirements for breaking changes, dependencies, access and publication. An `investigate` or `consult` result is not permission to patch.

Queue unanswered questions and continue independent authorized work. Repeated reports belong to the existing question; silence is not approval. Wait when no independent work remains, the clean target is reached or the CLI blocks continuation. Record the owner's answer before dependent work. A tentative keep/revert edit needs prior authority; reversibility alone grants none. The findings commands reference covers those less common record transitions.

## 4. Fix and verify

Use `writing-good-tests` for behavior or test changes, `reducing-cognitive-load` for readable repairs and `typescript-discipline` for TypeScript. For UI changes, reuse the implementation owner's `frontend-ui-validation` evidence and request missing states.

Record each actual patch attempt using the finding's `decisionId`, not its database `issueId`:

```sh
review-findings progress-record --repo <owner/repo> --repo-path <checkout> \
  --branch <branch> --target <target> --base <base> --phase <phase> \
  --head <sha> --expected-revision <revision> --outcome repair-applied \
  --finding-id <decision-id> --repair-attempt <unique-attempt-id> --evidence <patch-reference>
```

Run focused checks. Record a failed repair with `--outcome repair-unsuccessful`, the same attempt ID, matching finding/phase/head, current revision and verification evidence. Two failed attempts require approval before a third.

Record successful repairs as fixed through `review-findings record` and completed checks through `review-findings record-command`. After each repair or failed attempt:

```sh
review-findings scope-check --repo <owner/repo> --repo-path <checkout> \
  --branch <branch> --target <target> --base <base> \
  --reason "After a repair or failed attempt" --json
```

Resolve any reported blocker before more work. Once checks pass, return to the review loop to commit and review the accepted fixes. Preserve unrelated edits.
