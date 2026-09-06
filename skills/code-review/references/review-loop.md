# Run a review, fix findings, repeat

Keep one saved record of each review and repair so a resumed session can continue where it stopped.

## 1. Before the review

Set `<phase>` to `native` for native review or `cold` for independent review, and check whether another pass is allowed:

```sh
review-findings scope-check --repo <owner/repo> --repo-path <checkout> \
  --branch <branch> --target <target> --base <base> \
  --reason "Before the next review pass" --json
review-findings progress-status --repo <owner/repo> --repo-path <checkout> \
  --branch <branch> --target <target> --base <base> --phase <phase>
```

Use the returned revision to record the start:

```sh
review-findings progress-record --repo <owner/repo> --repo-path <checkout> \
  --branch <branch> --target <target> --base <base> --phase <phase> \
  --head <reviewed-sha> --expected-revision <revision> \
  --outcome started --evidence <invocation-reference>
```

Launch the reviewer only if these commands succeed. If another process updated the record, read the new state before continuing; keep the existing run and limits.

## 2. Save the result

Wait for the reviewer to finish against the intended code. Check and record its findings using the findings guide in the main skill, then save the outcome before repairs. Use the revision returned by the start:

```sh
review-findings progress-record --repo <owner/repo> --repo-path <checkout> \
  --branch <branch> --target <target> --base <base> --phase <phase> \
  --head <reviewed-sha> --expected-revision <revision> \
  --outcome <result> --evidence <review-result-reference>
```

- `clean`: no valid findings remain, including when all candidates were rejected with evidence.
- `clean-except-queue`: only recorded questions remain.
- `findings`: a supported finding still needs repair.
- `blocked`: the review failed, was interrupted, checked the wrong code or returned no usable result.

Keep completed results even when the next action is blocked. Retry an apparently transient, ambiguous result once within the saved limits, using the same engine and model.

## 3. Fix and repeat

After repairs pass their checks, inspect the diff and commit the fixes together. Review the updated code in the same phase. For a single-commit review, use the repair commit next.

Native review needs two clean passes on unchanged code. Independent review uses its saved target, normally one. Stop at that count. Changes reset the current streak, not completed phases or history. Independent-review fixes repeat only independent review.

If all pending questions are later rejected with evidence, keep the earned passes on unchanged code. Open questions prevent completion; follow the findings guide when an answer is needed.
