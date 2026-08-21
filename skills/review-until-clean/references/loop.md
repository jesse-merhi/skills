# Review loop

## Classifying a run

Classify every run from the engine's review output after triage:

- `clean`: no findings, or only findings rejected with recorded evidence. For
  codex, the output clearly says the reviewed change is correct or has no
  findings. For claude, the workflow report has an empty findings list.
- `clean-except-queue`: every remaining finding matches an open consult-queue
  entry (`review-guardrails`). Counts toward the clean target; cannot produce the
  final clean verdict.
- `has_findings`: at least one actionable finding remains.
- `ambiguous`: errored, interrupted, wrong target, no clear verdict, or output
  could not be interpreted.

When in doubt, treat the run as `has_findings` or `ambiguous`. Extra cycles are
cheaper than falsely declaring convergence.

## Loop state

Before the loop, resolve `review_findings_bin` from the installed `code-review`
skill directory as required by `review-guardrails`. Use its absolute launcher;
never invoke a bare `review-findings` command.

Maintain these across the whole session:

```text
consecutive_clean = 0
iterations = 0
required_clean = 2
```

Repeat:

```text
1. If the wall-clock budget has expired:
     Record stop reason `budget-expired` in the findings CLI or final report.
     STOP and report unresolved state honestly.
2. iterations += 1
   Track the phase, iteration, target, reviewed head, and current clean count.
3. Run the selected engine's bare review against the fixed target.
4. Triage the findings:
   - reject only with recorded evidence
   - for a runtime candidate, run `finding-discipline`'s likelihood-impact risk
     rating
   - for a maintenance candidate, use `--current-job-evidence` to prove that the
     changed code has no current job and `--present-cost` for its concrete
     current reading, change, test, or ownership cost
   - CLI-derived `investigate` or `consult` -> no patch; investigate or queue it
   - apply `review-guardrails`' autonomous fix bar before accepting a patch
   - accepted finding with uncertain repair -> provisional-fix test (review-guardrails):
       pass -> fix now, log Provisional, ask the user without waiting
       fail -> consult queue (Class B), ask the user without waiting
   - findings matching an open queue entry -> match note, no new entry
   If open questions for the user have reached consult_cap ->
     Record the open queue and stop reason `blocked-on-consult`.
     SUSPEND as blocked-on-consult: present all open questions and wait.
5. Classify the run:
   clean / clean-except-queue / has_findings / ambiguous
6. If clean or clean-except-queue:
     consecutive_clean += 1
     Track the run verdict and clean count.
     If clean-except-queue and the engine cannot send tracked-finding
     notices (codex) -> SUSPEND as blocked-on-consult now; without
     notices, repeat passes on a tree with a known finding are degraded.
     If consecutive_clean >= required_clean:
       If the consult queue is empty -> record stop reason `clean-pass-met`,
               then STOP and report success.
       Else -> record stop reason `blocked-on-consult`,
               then SUSPEND as blocked-on-consult: present the queue and wait
               for the user. Do not re-run the engine on this unchanged tree.
     Else -> go to step 1 without changing the reviewed tree.
7. If has_findings:
     consecutive_clean = 0
     Fix the actionable findings with narrow edits.
     If the target was an immutable commit SHA, update the reviewed target to
     the amended/new commit SHA, or switch to the base/uncommitted target before
     the next review. Do not re-review an old immutable commit after fixes.
     Run relevant verification for the fixes.
     Record each command, result, and reason with the findings CLI.
     Run `"$review_findings_bin" scope-check --reason <remaining work and why it may
     merit more scope>`.
     If it exits non-zero -> record stop reason `blocked-on-consult`, present
       the CLI report to the user, and STOP before another review or fix.
     Keep fixed-finding details in the findings CLI.
     Go to step 1.
8. If ambiguous:
     consecutive_clean = 0
     Re-run once if the failure looks transient.
     If ambiguity persists, record stop reason `ambiguous-review`, then STOP
     and report unresolved state honestly.
```

Resume after the user answers a suspended loop:

- Any accepted finding -> fix it, close its queue entry, reset
  `consecutive_clean` to 0, and go to step 1 on the changed tree.
- All open entries rejected -> record the decisions; the completed clean target
  already covered this exact tree, so STOP with success citing those rejections.

Do not edit code between consecutive clean reviews. A multi-run streak is only
meaningful if the engine reviews the same tree every time.
