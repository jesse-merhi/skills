# Record a complete review

Use the coordinator’s database throughout. The CLI saves review state and returns a `reviewId`; keep that ID for later commands.

For the normal Codex review, `review-findings review native` uses the saved scope flags from setup, launches the reviewer once and returns the report path. Repeating it while the review is open returns the same ID and does not launch again.

For an independently dispatched reviewer or another native engine, reserve the review first:

```sh
review-findings review start <saved scope flags> --phase cold --evidence "<invocation reference>"
```

Dispatch only when `resumed` is false. Otherwise use the existing invocation. Inspect it with `review-findings review status --review <id>`. If the process stopped without a usable result, finish it with `--outcome blocked` and the observed error. A blocked review remains incomplete.

## Save the report

Wait for the complete assessment, then check every candidate using the findings guide. Run all its `record`, repeated-evidence and `coverage-record` commands in one code-mode call. Keep writes serial and inspect every exit code. Successful records remain saved if a later command fails; correct the failed record and finish the remaining commands before proceeding.

Use `--review <id>` instead of repeating repository fields. `review-findings schema` owns finding fields and ratings; each command’s `--help` owns its flags. Record accepted, rejected and uncertain candidates. For repeat reports, use `record --review <id> --match-of <finding-id>` with source, evidence and match note. For coverage, provide the observed files and change IDs; the review ID comes from the handle. Coverage counts only after the review finishes successfully.

```sh
review-findings review finish --review <id> --outcome findings --evidence "<complete report>"
```

Choose `clean`, `clean-except-queue`, `findings` or `blocked` under the review loop’s rules. Finish checks the saved state and reviewed commit; the agent does not supply revision counters or JSON files. Repeating the same finish is harmless. Once finished, the handle accepts no more candidates or coverage.

## Repairs and checks

After finish, record repair events with `progress-record --review <id>`. Supply the outcome, finding ID, patch ID (`--repair-attempt`) and observed evidence; the CLI supplies phase, head and revision. Record the applied attempt while the finding is open. After verification, update a successful finding through `record --review <id> --status fixed`; for a failed attempt, record `repair-unsuccessful` and leave the finding open. Two failures require the existing owner-authorization command before another attempt.

Save actual check commands and results through `record-command --review <id>`. Run the record commands for completed repairs and checks together in code mode, checking each result. These commands record evidence; they do not perform edits or run the checks themselves.
