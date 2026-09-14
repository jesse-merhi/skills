# Record review evidence

Use the coordinator’s database throughout. The review entrypoint initializes missing scope or resumes saved state, returning the run identity, `reviewId` and recording contract. Keep these values for later commands.

For the normal Codex review, `review-findings review native` resolves the checkout and saved review context, launches the reviewer once and returns the report path. Repeating it while the review is open returns the same ID and does not launch again.

For an independently dispatched reviewer or another native engine, reserve the review first:

```sh
review-findings review start --phase cold \
  --evidence "Report planned at <run-owned-report-path>"
```

For another native engine, including Claude Code's built-in review workflow, reserve the review with the same command and `--phase native`. Keep that native review separate from the findings-only cold reviewer.

The reservation evidence identifies the planned report location; it does not claim dispatch or completion. Pass that location to the reviewer and use the actual report reference when finishing. Check that the returned identity matches the requested comparison before dispatch. Dispatch only when `resumed` is false. Otherwise use the existing invocation. Inspect it with `review-findings review status --review <id>`. If the process stopped without a usable result, finish it with `--outcome blocked` and the observed error. A blocked review remains incomplete.

## Save the report

Checkpoint assessed candidates and probe evidence as they become available, using the findings guide. Preserve raw output outside the checkout with the invocation ID, exact head, observed results and unchecked scope; use `record-command --review <id>` for completed probes. Record actionable findings, unresolved concerns and meaningful verified rejections; immediately discarded speculation needs no registry entry or summary. Batch available `record`, repeated-evidence and `coverage-record` commands in one code-mode call. Reconcile the complete assessment before finishing. Keep writes serial and inspect every exit code. Successful records remain saved if a later command fails; use the diagnostic’s accepted shape to correct the failed record and finish the remaining commands before proceeding.

Use `--review <id>` instead of repeating repository fields. `review-findings schema` owns finding fields and ratings; each command’s `--help` owns its flags. For meaningful repeat reports, use `record --review <id> --match-of <finding-id>` with source, evidence and match note. For coverage, provide the observed files and change IDs; the review ID comes from the handle. Coverage counts only after a complete assessment is saved with status `finished`; finding-bearing coverage is separate from clean-pass credit.

```sh
review-findings review finish --review <id> --outcome findings --evidence "<complete report>"
```

Choose `clean`, `clean-except-queue`, `findings` or `blocked` under the review loop’s rules. Finish checks the saved state and reviewed commit; the agent does not supply revision counters or JSON files. Repeating the same finish is harmless. Once closed, the handle accepts no more ordinary candidates or coverage. Interrupted evidence has the explicit recovery path below.

## Recover an interrupted assessment

Close the interrupted invocation with `review finish --outcome blocked` and the observed reason. Keep its checkpoints and raw output; a partial report earns no clean pass or coverage credit. Check recovered candidates against the saved revision using the findings guide. A candidate count or speculative note is insufficient evidence.

For a candidate recovered after closure, use `record --review <id> --recover "<saved output and verification reference>"` with the usual finding fields and an `open` or `rejected` status. The CLI appends immutable provenance containing the original invocation, head and base. It permits recovery while a tested patch is present, without checking out old code or reopening the review. Keep unresolved evidence open with the CLI-derived `investigate` disposition; only accepted findings or approved consultations permit repair events.

Preserve and verify any existing patch. Record supported repairs through the closed handle, then commit authorized repairs and start fresh required reviews of the repaired head in the same scope. Do not recreate old code for bookkeeping, reset phase targets or label the interrupted report complete. Explicit user deadlines, limits and permission boundaries still apply.

## Repairs and checks

After discovery closes (complete or blocked), record repair events with `progress-record --review <id>`. Supply the outcome, finding ID, patch ID (`--repair-attempt`) and observed evidence; the CLI supplies phase, head and revision. Record the applied attempt while the finding is open. After verification, update a successful finding through `record --review <id> --status fixed`; for a failed attempt, record `repair-unsuccessful` and leave the finding open. Two failures require a `repair-replanned` event with the diagnosis and materially changed approach before another attempt.

For a consulted finding, include the actual approval receipt in `--authorization` on its first `repair-applied` event. Later attempts for that finding reuse the saved receipt within its approved scope. After successful verification, record the final `fixed` status with `--owner-resolution approved` and the owner’s decision.

Save actual check commands and results through `record-command --review <id>`. Run the record commands for completed repairs and checks together in code mode, checking each result. These commands record evidence; they do not perform edits or run the checks themselves.
