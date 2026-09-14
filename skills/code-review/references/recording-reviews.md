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

## Assess a changed candidate

After a rebase, main sync, repair, merge-group rebuild or other committed head change, snapshot the current candidate and the saved evidence it may inherit:

```sh
review-findings review candidate-prepare --source-run <run-id>
```

Omit `--source-run` when the current run contains the source evidence. Inspect the returned source and candidate base, head, tree and patch identities, progress revision, finished review invocations and candidate ID. Establish semantic impact under the review loop; the command does not infer behavior from file overlap.

Record exactly one decision against that snapshot:

```sh
review-findings review candidate-assess --candidate <candidate-id> \
  --decision reuse --semantic-impact-evidence "<why prior evidence still applies>"

review-findings review candidate-assess --candidate <candidate-id> \
  --decision focused --affected-phase native --affected-phase cold \
  --semantic-impact-evidence "<changed integration, affected behavior and required review>"

review-findings review candidate-assess --candidate <candidate-id> \
  --decision broad --semantic-impact-evidence "<why impact cannot be bounded>"
```

Use `reuse` only for an equivalent exact branch patch identity with enough applicable source invocations to meet every configured phase target. Use `focused` with every required phase whose earlier evidence no longer covers the affected behavior; missing required phases are also included. An unaffected phase is carried only when its applicable source invocations meet that phase's configured target. Use `broad` when all required phases must run again. The assessment carries only eligible completed phase evidence and preserves the source invocation IDs. It does not turn inherited evidence into a current-candidate invocation or carry validation command records. Reuse validation only through separately recorded evidence whose relevant behavior and assumptions still apply.

Preparation and assessment are compare-and-set operations over the saved progress and Git candidate. If either changes, do not retry with the stale candidate ID or copy its decision forward. Prepare and assess the new candidate. Review launchers still own their actual scope: the default native helper reviews its full comparator. A focused native phase requires a separately reserved `review start --phase native` invocation and a launcher that supports the targeted brief; otherwise run the broader native review and report that scope accurately.

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

Preserve and verify any existing patch. Record supported repairs through the closed handle, then commit authorized repairs and assess the repaired candidate under the review loop. Run the phases whose evidence the repair invalidated. Do not recreate old code for bookkeeping, reset unaffected phase evidence or label the interrupted report complete. Explicit user deadlines, limits and permission boundaries still apply.

## Repairs and checks

After discovery closes (complete or blocked), record repair events with `progress-record --review <id>`. Supply the outcome, finding ID, patch ID (`--repair-attempt`) and observed evidence; the CLI supplies phase, head and revision. Record the applied attempt while the finding is open. After verification, update a successful finding through `record --review <id> --status fixed`; for a failed attempt, record `repair-unsuccessful` and leave the finding open. Two failures require a `repair-replanned` event with the diagnosis and materially changed approach before another attempt.

For a consulted finding, include the actual approval receipt in `--authorization` on its first `repair-applied` event. Later attempts for that finding reuse the saved receipt within its approved scope. After successful verification, record the final `fixed` status with `--owner-resolution approved` and the owner’s decision.

Save actual check commands and results through `record-command --review <id>`. Run the record commands for completed repairs and checks together in code mode, checking each result. These commands record evidence; they do not perform edits or run the checks themselves.
